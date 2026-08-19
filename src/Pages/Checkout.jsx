import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Shield, Users, Clock, MapPin, ChevronDown, ChevronUp, CheckCircle2, Lock, X } from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"


// ─── Pricing config — DISPLAY ONLY. The server recomputes and is authoritative.
const PLATFORM_FEE_PERCENT = 3     // 3% platform fee
const GST_PERCENT          = 5     // 5% GST on base price

const FUNCTIONS_BASE = "https://wenhudcyvlhilpgazylg.supabase.co/functions/v1"


// ─── Normalise Supabase row ───────────────────────────────────────────────────
function normalise(row) {
  if (!row) return null
  return {
    ...row,
    image: row.images?.length ? row.images : row.cover_image_url ? [row.cover_image_url] : [],
  }
}

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

// ─── BATCH: format a "YYYY-MM-DD" date string for display. Parsed as LOCAL time
// (not new Date("2026-09-01") which is UTC midnight and can shift a day back in
// IST). withYear toggles the trailing year.
function fmtBatchDate(d, withYear = true) {
  if (!d) return ""
  const [y, m, day] = String(d).split("-").map(Number)
  if (!y || !m || !day) return d
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}),
  })
}

// ─── BATCH: seats remaining in a batch (null = unlimited / not tracked) ───────
function seatsLeft(b) {
  if (b.seats_total == null || b.seats_total === "") return null
  const total  = Number(b.seats_total)
  const booked = b.seats_booked == null || b.seats_booked === "" ? 0 : Number(b.seats_booked)
  return total - booked
}

// ─── COUPON: map RPC reason codes → friendly messages ─────────────────────────
function couponMessage(reason) {
  switch (reason) {
    case "not_found":    return "This code isn't valid."
    case "already_used": return "This code has already been used."
    case "expired":      return "This code has expired."
    case "min_amount":   return "Your booking doesn't meet the minimum for this code."
    case "not_yours":    return "This code is linked to another account."
    default:             return "This code can't be applied."
  }
}

// ─── Load Razorpay script ─────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const { slug } = useParams()

  const [trip, setTrip]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [travelers, setTravelers] = useState(1)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [paying, setPaying]       = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess]     = useState(false)
  const [verifyError, setVerifyError] = useState(null)

  // ─── BATCH: which departure batch is selected (index into the open list) ────
  const [selectedBatchIdx, setSelectedBatchIdx] = useState(-1)

  // ─── COUPON: state ─────────────────────────────────────────────────────────
  const [couponCode, setCouponCode]       = useState("")
  const [coupon, setCoupon]               = useState(null)   // { code, discount, coupon_id }
  const [couponError, setCouponError]     = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Form state
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    travelDate: "", specialReq: "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    window.scrollTo(0, 0)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login?redirect=/checkout/" + slug)
        return
      }
    })
    if (!slug) { setLoading(false); return }

    supabase
      .from("Itineraries")
      .select("id,slug,title,location,state,duration,duration_display,price,price_per_person,tag,blurb,max_group_size,images,cover_image_url,rating,review_count,inclusions,batches")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error.message)
        setTrip(normalise(data))
        setLoading(false)
      })
  }, [slug])

  // ─── BATCH: does this trip define batches at all? (any status, any date) ────
  // If it does, batch selection is REQUIRED. If it doesn't, we fall back to the
  // old free-date input so non-batch / custom trips still work.
  const tripHasBatches = (trip?.batches?.length || 0) > 0

  // ─── BATCH: bookable batches — open + not in the past — sorted by date ──────
  const openBatches = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return (trip?.batches || [])
      .filter(b => (b.status || "open") === "open" && b.start_date && b.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  }, [trip])

  const selectedBatch = openBatches[selectedBatchIdx] || null

  // ─── BATCH: pick a batch. Sets travelDate (so the rest of the flow — pricing,
  // order body, success screen — keeps working unchanged) and clamps the
  // traveller count down if the batch has fewer seats than currently selected.
  function chooseBatch(idx, b) {
    const left = seatsLeft(b)
    if (left != null && left <= 0) return
    setSelectedBatchIdx(idx)
    setForm(f => ({ ...f, travelDate: b.start_date }))
    setErrors(e => ({ ...e, travelDate: null }))
    if (left != null && travelers > left) setTravelers(Math.max(1, left))
  }

  // ─── COUPON: clear applied coupon if traveller count changes, since the
  // discounted total (and the min-booking check) is no longer guaranteed valid.
  useEffect(() => {
    if (coupon) {
      setCoupon(null)
      setCouponError("Traveller count changed — re-apply your coupon.")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelers])

  // ─── Pricing calculations (display only — server recomputes) ───────────────
  const pricing = useMemo(() => {
    if (!trip) return null
    const basePerPerson = Number(trip.price_per_person) || 0
    const baseTotal     = basePerPerson * travelers

    const platformFee   = Math.round((baseTotal * PLATFORM_FEE_PERCENT) / 100)
    const gst           = Math.round((baseTotal * GST_PERCENT) / 100)
    const hasPricing    = basePerPerson > 0
    const taxesAndFees  = gst

    // ─── COUPON: flat ₹ off, applied to the payable total, clamped so it can
    // never exceed the amount due. Server MUST mirror this exact formula.
    const couponDiscount = coupon
      ? Math.min(Number(coupon.discount) || 0, baseTotal + taxesAndFees)
      : 0

    const grandTotal    = Math.max(0, baseTotal + taxesAndFees - couponDiscount)

    return {
      basePerPerson, baseTotal,
      platformFee, gst, taxesAndFees,
      couponDiscount,
      grandTotal,
      hasPricing,
    }
  }, [trip, travelers, coupon])


  // ─── COUPON: validate against the server RPC (single source of truth) ──────
  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code || !pricing) return
    setCouponError(null)
    setCouponLoading(true)
    try {
      // validate_coupon uses auth.uid() for the "not transferable" check; the
      // user is already logged in on this page, so the RPC runs as them.
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: code,
        p_booking_amount: pricing.baseTotal,
      })
      if (error) throw error

      const row = Array.isArray(data) ? data[0] : data
      if (!row || !row.valid) {
        setCoupon(null)
        setCouponError(couponMessage(row?.reason))
        return
      }

      setCoupon({
        code: code.toUpperCase(),
        discount: Number(row.discount_amount) || 0,
        coupon_id: row.coupon_id,
      })
      setCouponError(null)
    } catch (err) {
      console.error("Coupon validation failed:", err)
      setCoupon(null)
      setCouponError("Could not validate coupon. Please try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setCoupon(null)
    setCouponCode("")
    setCouponError(null)
  }


  // ─── Validation ───────────────────────────────────────────────────────────
  function validate() {
    const e = {}
    if (!form.name.trim())        e.name      = "Name is required"
    if (!form.email.trim())       e.email     = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email"
    if (!form.phone.trim())       e.phone     = "Phone number is required"
    else if (form.phone.length < 10) e.phone  = "Enter a valid 10-digit number"
    // BATCH: batch trips require a chosen batch; others require a free date.
    if (!form.travelDate)         e.travelDate = tripHasBatches ? "Please select a departure batch" : "Please select a travel date"
    setErrors(e)
    return Object.keys(e).length === 0
  }


  // ─── Razorpay payment handler ─────────────────────────────────────────────
  async function handlePay() {
    if (!validate()) return
    setVerifyError(null)
    setPaying(true)

    const loaded = await loadRazorpay()
    if (!loaded) {
      alert("Failed to load payment gateway. Please try again.")
      setPaying(false)
      return
    }

    // ── Step 1: Create Razorpay order (server inserts the pending booking) ──
    let order_id    = null
    let booking_id  = null
    let orderAmount = null
    let keyId       = null

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert("Please log in to continue booking.")
        setPaying(false)
        return
      }

      const res = await fetch(`${FUNCTIONS_BASE}/create-razorpay-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tour_id:         trip.id,
          num_persons:     travelers,
          booking_date:    form.travelDate,
          batch_start:     selectedBatch?.start_date || form.travelDate || null, // ─── BATCH: the chosen departure (server should validate + reserve seats)
          special_request: form.specialReq || null,
          pay_mode:        "full",
          coupon_code:     coupon?.code || null,   // ─── COUPON: server validates + applies + stores it
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Could not initiate payment. Please try again.")
        setPaying(false)
        return
      }

      order_id    = data.order_id
      booking_id  = data.booking_id
      orderAmount = data.amount      // paise, server-authoritative (already discounted)
      keyId       = data.key_id      // from server, not hardcoded

    } catch (err) {
      console.error("Order creation failed:", err)
      alert("Could not initiate payment. Please try again.")
      setPaying(false)
      return
    }

    // ── Step 2: Open Razorpay checkout ─────────────────────────
    const options = {
      key:         keyId,
      amount:      orderAmount,
      currency:    "INR",
      name:        "Hoppity",
      order_id:    order_id,
      description: `${trip.title} — ${travelers} traveller${travelers > 1 ? "s" : ""}`,
      image:       trip.image?.[0] || "",

      prefill: {
        name:    form.name,
        email:   form.email,
        contact: form.phone,
      },

      notes: {
        slug:           trip.slug,
        travelers:      String(travelers),
        travel_date:    form.travelDate,
        batch_start:    selectedBatch?.start_date || "",   // ─── BATCH: audit reference
        pay_mode:       "full",
        special_req:    form.specialReq || "",
        traveler_name:  form.name,
        traveler_email: form.email,
        traveler_phone: form.phone,
        coupon_code:    coupon?.code || "",   // ─── COUPON: for reference/audit only
      },

      theme: { color: "#7c3aed" },

      // ── Step 3: Hand the signature to the server.
      // The browser NEVER writes to Bookings or Payments. verify-razorpay-payment
      // re-computes the HMAC and calls confirm_razorpay_booking, which flips the
      // booking to paid and inserts the Payments row atomically — same path iOS
      // and Flutter use.
      handler: async function (response) {
        setPaying(false)
        setVerifying(true)

        try {
          const { data: { session } } = await supabase.auth.getSession()

          const res = await fetch(`${FUNCTIONS_BASE}/verify-razorpay-payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              booking_id:          booking_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          })

          const data = await res.json()

          if (!res.ok || !data.success) {
            // The money may well have been captured — razorpay-webhook is the
            // server-side backstop. Never tell the user the payment failed here,
            // or they will pay twice.
            console.error("Verification failed:", data)
            setVerifying(false)
            setVerifyError(
              "Your payment went through, but we couldn't confirm the booking automatically. " +
              "Our team will confirm it shortly — please don't pay again."
            )
            return
          }

          setVerifying(false)
          setSuccess(true)
          window.scrollTo(0, 0)

        } catch (err) {
          console.error("Verification request failed:", err)
          setVerifying(false)
          setVerifyError(
            "Your payment went through, but we couldn't reach our servers to confirm it. " +
            "Our team will confirm your booking shortly — please don't pay again."
          )
        }
      },

      modal: {
        ondismiss: () => setPaying(false),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on("payment.failed", (resp) => {
      console.error("Payment failed:", resp.error)
      alert(`Payment failed: ${resp.error.description}`)
      setPaying(false)
    })
    rzp.open()
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )

  if (!trip) return (
    <div className="min-h-screen bg-[#f7f1ff] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-5">🗺️</div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Trip not found</h1>
      <Link to="/itineraries" className="mt-4 text-violet-700 font-semibold hover:underline">← Browse all trips</Link>
    </div>
  )

  // ─── Verifying screen ─────────────────────────────────────────────────────
  if (verifying) return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-12">
          <div className="w-12 h-12 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">Confirming your booking…</h1>
          <p className="text-slate-500 text-sm">Payment received. Please don't close this window.</p>
        </div>
      </div>
    </div>
  )

  // ─── Success screen ───────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-12">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-slate-500 mb-2">A confirmation has been sent to <strong>{form.email}</strong></p>
          <p className="text-slate-500 text-sm mb-8">Our team will reach out on <strong>+91 {form.phone}</strong> within 24 hours.</p>

          <div className="rounded-2xl bg-[#f8f5ff] border border-violet-100 p-5 text-left mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Booking Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Trip</span><span className="font-semibold text-slate-800">{trip.title}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Travellers</span><span className="font-semibold text-slate-800">{travelers}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">{selectedBatch ? "Departure" : "Travel Date"}</span>
                <span className="font-semibold text-slate-800">
                  {selectedBatch && selectedBatch.end_date
                    ? `${fmtBatchDate(selectedBatch.start_date, false)} – ${fmtBatchDate(selectedBatch.end_date)}`
                    : fmtBatchDate(form.travelDate)}
                </span>
              </div>
              {coupon && (
                <div className="flex justify-between"><span className="text-slate-500">Coupon ({coupon.code})</span><span className="font-semibold text-green-700">−{formatINR(pricing.couponDiscount)}</span></div>
              )}
              <div className="flex justify-between border-t border-violet-100 pt-2 mt-2">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-black text-violet-700 text-base">{formatINR(pricing.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/itinerary/${trip.slug}`}
              className="flex-1 text-center rounded-2xl border border-violet-200 text-violet-700 px-5 py-3 text-sm font-semibold hover:bg-violet-50 transition">
              View Itinerary
            </Link>
            <Link to="/"
              className="flex-1 text-center rounded-2xl bg-slate-950 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f1ff] font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeInUp 0.5s ease-out forwards; }
        .shimmer-button {
          background: linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .input-field {
          width: 100%; border-radius: 0.875rem; border: 1.5px solid #e5e7eb;
          padding: 0.75rem 1rem; font-size: 0.875rem; outline: none;
          background: white; color: #1a1a1a; transition: border-color 0.2s;
        }
        .input-field:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        .input-field.error { border-color: #ef4444; }
        .input-label { font-size: 0.8125rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; display: block; }
      `}} />

      <Navbar />

      <div className="max-w-6xl mx-auto px-5 pt-28 pb-16">

        {/* Back */}
        <Link to={`/itinerary/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 font-semibold mb-8 transition fade-up">
          <ArrowLeft className="w-4 h-4" /> Back to itinerary
        </Link>

        {/* Verification fallback banner */}
        {verifyError && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 fade-up">
            <p className="text-sm font-semibold text-amber-800 mb-1">Payment received — confirmation pending</p>
            <p className="text-xs text-amber-700 leading-relaxed">{verifyError}</p>
            <a href="https://wa.me/919752377323?text=Hi%20Hoppity%2C%20my%20payment%20went%20through%20but%20my%20booking%20isn%27t%20confirmed"
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-bold text-amber-900 underline">
              Contact us on WhatsApp →
            </a>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">

          {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
          <div className="space-y-6 fade-up">

            {/* Section header */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">Secure Checkout</p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 leading-tight">
                Book Your<br /><span style={{
                  background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>Adventure</span>
              </h1>
            </div>

            {/* ── Traveller Count ── */}
            <div className="bg-white rounded-2xl border border-violet-100 p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-4">Number of Travellers</h2>
              <div className="flex items-center gap-4">
                <button onClick={() => setTravelers(t => Math.max(1, t - 1))}
                  className="w-10 h-10 rounded-xl border border-violet-200 text-violet-700 font-black text-xl hover:bg-violet-50 transition cursor-pointer flex items-center justify-center">−</button>
                <div className="text-center">
                  <span className="text-3xl font-black text-slate-900">{travelers}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{travelers === 1 ? "traveller" : "travellers"}</p>
                </div>
                <button
                  onClick={() => setTravelers(t => {
                    // BATCH: cap at the selected batch's remaining seats, if any.
                    const batchCap = selectedBatch && seatsLeft(selectedBatch) != null ? seatsLeft(selectedBatch) : Infinity
                    const cap = Math.min(trip.max_group_size || 20, batchCap)
                    return Math.min(cap, t + 1)
                  })}
                  className="w-10 h-10 rounded-xl border border-violet-200 text-violet-700 font-black text-xl hover:bg-violet-50 transition cursor-pointer flex items-center justify-center">+</button>
                {selectedBatch && seatsLeft(selectedBatch) != null ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                    <Users className="w-3.5 h-3.5" /> {seatsLeft(selectedBatch)} left in this batch
                  </span>
                ) : trip.max_group_size ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                    <Users className="w-3.5 h-3.5" /> Max {trip.max_group_size}
                  </span>
                ) : null}
              </div>
            </div>

            {/* ── Traveller Details ── */}
            <div className="bg-white rounded-2xl border border-violet-100 p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-5">Traveller Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input className={`input-field ${errors.name ? "error" : ""}`}
                    placeholder="As per government ID"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Email Address *</label>
                    <input type="email" className={`input-field ${errors.email ? "error" : ""}`}
                      placeholder="Confirmation will be sent here"
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="input-label">WhatsApp Number *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500"></span>
                      <input type="tel" maxLength={10}
                        className={`input-field pl-12 ${errors.phone ? "error" : ""}`}
                        placeholder="10-digit number"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* ── BATCH picker (batch trips) / free date (everything else) ── */}
                {tripHasBatches ? (
                  <div>
                    <label className="input-label">Select a Departure Batch *</label>
                    {openBatches.length === 0 ? (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                        No open departures for this trip right now.{" "}
                        <a href={`https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I%27d%20like%20upcoming%20batch%20dates%20for%20${encodeURIComponent(trip.title)}`}
                          target="_blank" rel="noopener noreferrer" className="font-bold underline text-amber-900">
                          Ask us about upcoming dates →
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {openBatches.map((b, i) => {
                          const left   = seatsLeft(b)
                          const full   = left != null && left <= 0
                          const active = i === selectedBatchIdx
                          const dateLabel = b.end_date
                            ? `${fmtBatchDate(b.start_date, false)} – ${fmtBatchDate(b.end_date)}`
                            : fmtBatchDate(b.start_date)
                          return (
                            <button key={i} type="button" disabled={full} onClick={() => chooseBatch(i, b)}
                              className={`text-left rounded-xl border p-3 transition ${
                                active ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                                : full  ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                                :         "border-violet-100 bg-white hover:border-violet-300 cursor-pointer"
                              }`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-slate-900">{dateLabel}</span>
                                {active && <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0" />}
                              </div>
                              {left != null && (
                                <p className={`text-xs mt-1 ${full ? "text-red-500" : left <= 3 ? "text-amber-600" : "text-slate-400"}`}>
                                  {full ? "Fully booked" : `${left} seat${left > 1 ? "s" : ""} left`}
                                </p>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {errors.travelDate && <p className="text-xs text-red-500 mt-1">{errors.travelDate}</p>}
                  </div>
                ) : (
                  <div>
                    <label className="input-label">Preferred Travel Date *</label>
                    <input type="date" className={`input-field ${errors.travelDate ? "error" : ""}`}
                      min={new Date().toISOString().split("T")[0]}
                      value={form.travelDate} onChange={e => setForm({ ...form, travelDate: e.target.value })} />
                    {errors.travelDate && <p className="text-xs text-red-500 mt-1">{errors.travelDate}</p>}
                  </div>
                )}

                <div>
                  <label className="input-label">Special Requests <span className="font-normal text-slate-400">(optional)</span></label>
                  <textarea rows={3} className="input-field resize-none"
                    placeholder="Dietary needs, accessibility requirements, celebrations, etc."
                    value={form.specialReq} onChange={e => setForm({ ...form, specialReq: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield className="w-4 h-4 text-green-600" />, label: "100% Secure Payment" },
                { icon: <CheckCircle2 className="w-4 h-4 text-violet-600" />, label: "Instant Confirmation" },
                { icon: <Lock className="w-4 h-4 text-blue-600" />, label: "Data Encrypted" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1.5 rounded-2xl bg-white border border-violet-100 p-3.5 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">{b.icon}</div>
                  <p className="text-xs font-semibold text-slate-600 leading-tight">{b.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Order Summary ────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-28 space-y-4 fade-up" style={{ animationDelay: "0.1s" }}>

            {/* Trip card */}
            <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
              <div className="relative h-44">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-purple-900" />
                {trip.image?.[0] && (
                  <img src={trip.image[0]} alt={trip.title}
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative p-5 h-full flex flex-col justify-end">
                  {trip.tag && (
                    <span className="self-start rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm mb-2">{trip.tag}</span>
                  )}
                  <p className="text-xs uppercase tracking-wider text-violet-200 mb-1">{trip.location}</p>
                  <h3 className="text-lg font-bold text-white leading-tight">{trip.title}</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trip.duration_display || trip.duration}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.location}</span>
                  {trip.rating > 0 && <span className="ml-auto text-amber-600 font-semibold">★ {Number(trip.rating).toFixed(1)}</span>}
                </div>
                {/* BATCH: show the chosen departure in the summary card */}
                {selectedBatch && (
                  <div className="mt-3 pt-3 border-t border-violet-100 flex items-center gap-1.5 text-xs text-violet-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    Departure: {selectedBatch.end_date
                      ? `${fmtBatchDate(selectedBatch.start_date, false)} – ${fmtBatchDate(selectedBatch.end_date)}`
                      : fmtBatchDate(selectedBatch.start_date)}
                  </div>
                )}
              </div>
            </div>

            {/* Price breakdown */}
            {pricing && (
              <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-900 mb-4">Price Breakdown</h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{formatINR(pricing.basePerPerson)} × {travelers} traveller{travelers > 1 ? "s" : ""}</span>
                    <span className="font-semibold text-slate-800">{formatINR(pricing.baseTotal)}</span>
                  </div>

                  <button onClick={() => setShowBreakdown(b => !b)}
                    className="w-full flex items-center justify-between text-xs text-violet-600 font-semibold py-1 hover:opacity-80 transition cursor-pointer">
                    <span>Taxes & fees</span>
                    <span className="flex items-center gap-1">
                      {formatINR(pricing.taxesAndFees)}
                      {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showBreakdown && (
                    <div className="bg-[#f8f5ff] rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">GST</span>
                        <span className="text-slate-700">{formatINR(pricing.gst)}</span>
                      </div>
                  {/*    <div className="flex justify-between">
                        <span className="text-slate-500">Platform fee</span>
                        <span className="text-slate-700">{formatINR(pricing.platformFee)}</span>
                      </div> */}
                    </div>
                  )}

                  {/* ─── COUPON: input / applied state ─────────────────────── */}
                  {pricing.hasPricing && (
                    <div className="pt-1">
                      {coupon ? (
                        <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-bold text-green-800 truncate">{coupon.code}</span>
                            <span className="text-xs text-green-700">applied</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-bold text-green-700">−{formatINR(pricing.couponDiscount)}</span>
                            <button onClick={removeCoupon} title="Remove coupon"
                              className="text-green-700 hover:text-green-900 cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex gap-2">
                            <input
                              className={`input-field !py-2.5 !text-sm uppercase ${couponError ? "error" : ""}`}
                              placeholder="Coupon code"
                              value={couponCode}
                              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyCoupon() } }}
                            />
                            <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                              className={`px-4 rounded-xl text-sm font-bold text-white transition ${couponLoading || !couponCode.trim() ? "bg-violet-300 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700 cursor-pointer"}`}>
                              {couponLoading ? "…" : "Apply"}
                            </button>
                          </div>
                          {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-violet-100 pt-3 flex justify-between">
                    <span className="text-slate-500 text-xs">Total (incl. taxes)</span>
                    <span className="font-black text-slate-900">{formatINR(pricing.grandTotal)}</span>
                  </div>
                </div>

                {/* Pay now box */}
                {pricing.hasPricing && (
                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-violet-700">Pay Now</span>
                      {coupon && <span className="text-xs font-bold text-green-700">Coupon applied 🎉</span>}
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-black" style={{
                        background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                      }}>
                        {formatINR(pricing.grandTotal)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pay button */}
                {pricing.hasPricing ? (
                  <button onClick={handlePay} disabled={paying}
                    className={`shimmer-button w-full mt-4 py-4 rounded-2xl text-white font-black text-base cursor-pointer transition ${paying ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:-translate-y-0.5"}`}>
                    {paying
                      ? <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Opening Payment...
                        </span>
                      : `Pay ${formatINR(pricing.grandTotal)} →`
                    }
                  </button>
                ) : (
                  <a href={`https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I%27d%20like%20a%20quote%20for%20${encodeURIComponent(trip.title)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-4 py-4 rounded-2xl bg-slate-900 text-white font-black text-base hover:bg-slate-700 transition">
                    💬 Request a Price Quote
                  </a>
                )}

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <p className="text-xs text-slate-400 text-center">Secured by Razorpay · UPI, Cards, Net Banking</p>
                </div>
              </div>
            )}

            {/* What's included teaser */}
            {trip.inclusions?.length > 0 && (
              <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-900 mb-3">What's Included</h3>
                <div className="space-y-2">
                  {trip.inclusions.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed">{item}</p>
                    </div>
                  ))}
                  {trip.inclusions.length > 4 && (
                    <Link to={`/itinerary/${slug}`} className="text-xs text-violet-600 font-semibold hover:underline">
                      +{trip.inclusions.length - 4} more inclusions →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp help */}
            <a href="https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I%20need%20help%20with%20my%20booking"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-green-200 bg-green-50 text-green-800 text-sm font-semibold hover:bg-green-100 transition">
              💬 Need help? Chat with us
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-violet-100 bg-white py-8 text-center text-xs text-slate-400">
        <p>© 2026 Hoppity — Discover Real India</p>
        <a href="mailto:sales@hoppity.in" className="mt-1 block hover:text-violet-600 transition">sales@hoppity.in</a>
      </footer>
    </div>
  )
}