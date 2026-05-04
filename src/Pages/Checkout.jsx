import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Shield, Users, Clock, MapPin, ChevronDown, ChevronUp, Info, CheckCircle2, Lock } from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"

// ─── Pricing config — edit these as needed ────────────────────────────────────
const PLATFORM_FEE_PERCENT = 2.5        // 2.5% platform fee
const GST_PERCENT          = 5          // 5% GST on base price
const CONVENIENCE_FEE_FLAT = 99         // flat ₹99 convenience fee per booking
const ADVANCE_PERCENT      = 1         // 30% advance to confirm booking

// ─── Razorpay config ──────────────────────────────────────────────────────────
const RAZORPAY_KEY_ID = "rzp_live_SlFUTb4rlS6gOz" // replace with your key

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
  const navigate = useNavigate()

  const [trip, setTrip]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [travelers, setTravelers] = useState(1)
  const [payMode, setPayMode]     = useState("advance") // "advance" | "full"
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [paying, setPaying]       = useState(false)
  const [success, setSuccess]     = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    travelDate: "", specialReq: "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!slug) { setLoading(false); return }
    supabase
      .from("Itineraries")
      .select("id,slug,title,location,state,duration,duration_display,price,price_per_person,tag,blurb,max_group_size,images,cover_image_url,rating,review_count,inclusions")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error.message)
        setTrip(normalise(data))
        setLoading(false)
      })
  }, [slug])

  // ─── Pricing calculations ─────────────────────────────────────────────────
  const pricing = useMemo(() => {
    if (!trip) return null
    const basePerPerson = Number(trip.price_per_person) || 0
    const baseTotal     = basePerPerson * travelers

    const platformFee   = Math.round((baseTotal * PLATFORM_FEE_PERCENT) / 100)
    const gst           = Math.round((baseTotal * GST_PERCENT) / 100)
    const convFee       = CONVENIENCE_FEE_FLAT

    const grandTotal    = baseTotal + platformFee + gst + convFee
    const advanceAmount = Math.round((grandTotal * ADVANCE_PERCENT) / 100)
    const balanceDue    = grandTotal - advanceAmount

    const payNow = payMode === "advance" ? advanceAmount : grandTotal

    return {
      basePerPerson, baseTotal,
      platformFee, gst, convFee,
      grandTotal, advanceAmount, balanceDue, payNow,
    }
  }, [trip, travelers, payMode])

  // ─── Validation ───────────────────────────────────────────────────────────
  function validate() {
    const e = {}
    if (!form.name.trim())        e.name      = "Name is required"
    if (!form.email.trim())       e.email     = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email"
    if (!form.phone.trim())       e.phone     = "Phone number is required"
    else if (form.phone.length < 10) e.phone  = "Enter a valid 10-digit number"
    if (!form.travelDate)         e.travelDate = "Please select a travel date"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Razorpay payment handler ─────────────────────────────────────────────
  async function handlePay() {
    if (!validate()) return
    setPaying(true)

    const loaded = await loadRazorpay()
    if (!loaded) {
      alert("Failed to load payment gateway. Please try again.")
      setPaying(false)
      return
    }

    // In production: create an order on your backend and get order_id
    // const { order_id } = await yourBackend.createOrder({ amount: pricing.payNow * 100, currency: "INR" })

    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      pricing.payNow * 100, // paise
      currency:    "INR",
      name:        "Hoppity",
      description: `${trip.title} — ${travelers} traveller${travelers > 1 ? "s" : ""}`,
      image:       trip.image?.[0] || "",
      // order_id: order_id,  // uncomment when using backend order creation

      prefill: {
        name:    form.name,
        email:   form.email,
        contact: `+91${form.phone}`,
      },

      notes: {
        slug:        trip.slug,
        travelers:   travelers,
        travel_date: form.travelDate,
        pay_mode:    payMode,
        special_req: form.specialReq,
      },

      theme: { color: "#7c3aed" },

        handler: async function (response) {
        // Save booking to Supabase
        try {

        const { data: { user } } = await supabase.auth.getUser()
        const { data: bookingRow, error: bookingError } = await supabase.from("Bookings").insert({
        user_id:           user?.id || null,
        item_type:         'itinerary',
        item_id:           trip.id,
        tour_id:           trip.id,
        schedule_id:       null,               // set if you have schedules
        total_amount:      pricing.grandTotal,
        status:            'confirmed',
        payment_status:    'paid',
        num_persons:       travelers,
        booking_date:      form.travelDate,
        special_request:   form.specialReq || null,
        guide_notes:       null,
        gateway_fee:       pricing.platformFee,
        razorpay_order_id: response.razorpay_order_id || null,
        })
        .select('id')
        .single()
        if (bookingError) throw bookingError
        

        const { error: paymentError } = await supabase
        .from('payment')
        .insert({
        booking_id:          bookingRow.id,
        amount:              pricing.payNow,
        gateway:             'razorpay',
        status:              'captured',
        currency:            'INR',
        razorpay_order_id:   response.razorpay_order_id   || null,
        razorpay_payment_id: response.razorpay_payment_id || null,
        razorpay_signature:  response.razorpay_signature  || null,
        gateway_fee:         pricing.platformFee,
        metadata: {
        traveler_name:  form.name,
        traveler_email: form.email,
        traveler_phone: form.phone,
        num_travelers:  travelers,
        pay_mode:       payMode,
        base_amount:    pricing.baseTotal,
        gst:            pricing.gst,
        convenience_fee: pricing.convFee,
        balance_due:    payMode === 'advance' ? pricing.balanceDue : 0,
        trip_slug:      trip.slug,
        trip_title:     trip.title,
        },
        })
        
        if (paymentError) throw paymentError

        } catch (err) {
            console.error("Booking save error:", err)
        }
        setPaying(false)
        setSuccess(true)
        window.scrollTo(0, 0)
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
              <div className="flex justify-between"><span className="text-slate-500">Travel Date</span><span className="font-semibold text-slate-800">{new Date(form.travelDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div className="flex justify-between border-t border-violet-100 pt-2 mt-2">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-black text-violet-700 text-base">{formatINR(pricing.payNow)}</span>
              </div>
              {payMode === "advance" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance Due</span>
                  <span className="font-semibold text-slate-700">{formatINR(pricing.balanceDue)}</span>
                </div>
              )}
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

  const displayPrice = trip.price_per_person
    ? `₹${Number(trip.price_per_person).toLocaleString("en-IN")} / person`
    : trip.price || "On Request"

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
        .toggle-pill {
          flex: 1; padding: 0.625rem 1rem; border-radius: 1rem; font-size: 0.8125rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1.5px solid transparent; text-align: center;
        }
        .toggle-pill.active { background: white; border-color: #7c3aed; color: #7c3aed; box-shadow: 0 2px 8px rgba(124,58,237,0.12); }
        .toggle-pill.inactive { background: transparent; color: #6b7280; }
        .toggle-pill.inactive:hover { background: white/50; color: #374151; }
      `}} />

      <Navbar />

      <div className="max-w-6xl mx-auto px-5 pt-28 pb-16">

        {/* Back */}
        <Link to={`/itinerary/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 font-semibold mb-8 transition fade-up">
          <ArrowLeft className="w-4 h-4" /> Back to itinerary
        </Link>

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
                <button onClick={() => setTravelers(t => Math.min(trip.max_group_size || 20, t + 1))}
                  className="w-10 h-10 rounded-xl border border-violet-200 text-violet-700 font-black text-xl hover:bg-violet-50 transition cursor-pointer flex items-center justify-center">+</button>
                {trip.max_group_size && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                    <Users className="w-3.5 h-3.5" /> Max {trip.max_group_size}
                  </span>
                )}
              </div>
            </div>

            {/* ── Payment Mode ── */}
            <div className="bg-white rounded-2xl border border-violet-100 p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-1">Payment Option</h2>
              <p className="text-xs text-slate-400 mb-4">Choose how much you'd like to pay now</p>
              <div className="flex gap-2 bg-[#f8f5ff] rounded-xl p-1.5">
                <button onClick={() => setPayMode("advance")} className={`toggle-pill ${payMode === "advance" ? "active" : "inactive"}`}>
                  {ADVANCE_PERCENT}% Advance {pricing && `(${formatINR(pricing.advanceAmount)})`}
                </button>
                <button onClick={() => setPayMode("full")} className={`toggle-pill ${payMode === "full" ? "active" : "inactive"}`}>
                  Full Payment {pricing && `(${formatINR(pricing.grandTotal)})`}
                </button>
              </div>
              {payMode === "advance" && pricing && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Pay {ADVANCE_PERCENT}% ({formatINR(pricing.advanceAmount)}) now to confirm your slot. The remaining balance of <strong>{formatINR(pricing.balanceDue)}</strong> is due 7 days before departure.
                  </p>
                </div>
              )}
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
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">+91</span>
                      <input type="tel" maxLength={10}
                        className={`input-field pl-12 ${errors.phone ? "error" : ""}`}
                        placeholder="10-digit number"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="input-label">Preferred Travel Date *</label>
                  <input type="date" className={`input-field ${errors.travelDate ? "error" : ""}`}
                    min={new Date().toISOString().split("T")[0]}
                    value={form.travelDate} onChange={e => setForm({ ...form, travelDate: e.target.value })} />
                  {errors.travelDate && <p className="text-xs text-red-500 mt-1">{errors.travelDate}</p>}
                </div>

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
                    {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showBreakdown && (
                    <div className="bg-[#f8f5ff] rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">GST ({GST_PERCENT}%)</span>
                        <span className="text-slate-700">{formatINR(pricing.gst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                        <span className="text-slate-700">{formatINR(pricing.platformFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Convenience fee</span>
                        <span className="text-slate-700">{formatINR(pricing.convFee)}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-violet-100 pt-3 flex justify-between">
                    <span className="text-slate-500 text-xs">Total (incl. taxes)</span>
                    <span className="font-black text-slate-900">{formatINR(pricing.grandTotal)}</span>
                  </div>
                </div>

                {/* Pay now box */}
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-violet-700">
                      {payMode === "advance" ? `Pay Now (${ADVANCE_PERCENT}% Advance)` : "Pay Now (Full)"}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-black" style={{
                      background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                    }}>
                      {formatINR(pricing.payNow)}
                    </div>
                    {payMode === "advance" && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Balance due later</p>
                        <p className="text-sm font-bold text-slate-600">{formatINR(pricing.balanceDue)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pay button */}
                <button onClick={handlePay} disabled={paying}
                  className={`shimmer-button w-full mt-4 py-4 rounded-2xl text-white font-black text-base cursor-pointer transition ${paying ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:-translate-y-0.5"}`}>
                  {paying
                    ? <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Opening Payment...
                      </span>
                    : `Pay ${formatINR(pricing.payNow)} →`
                  }
                </button>

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
