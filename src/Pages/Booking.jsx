import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, CheckCircle, MessageCircle, Shield, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlbmh1ZGN5dmxoaWxwZ2F6eWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTY0MTgsImV4cCI6MjA4NTA3MjQxOH0.Jdx993pFvb0JC87NaYhOQ6UR_7UIJBA1mkFQUeoK7bA'

const LOG_LEAD_URL = `${SUPABASE_URL}/functions/v1/log-lead`

// Keep in sync with create-razorpay-order pricing config
/*const PLATFORM_FEE_PERCENT = 0.03 */
const GST_PERCENT = 0.05

export default function BookingPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tour, setTour] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(null)

  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedScheduleId, setSelectedScheduleId] = useState(null)
  const [numPersons, setNumPersons] = useState(1)
  const [specialRequest, setSpecialRequest] = useState('')
  const [error, setError] = useState('')

  // ── Traveller / lead contact capture ───────────────────────────────
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [travellers, setTravellers] = useState([{ name: '', age: '' }])

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth', { state: { returnTo: `/booking/${slug}` } })
    }
  }, [user, loading, navigate, slug])

  useEffect(() => {
    if (!slug) return
    Promise.all([
      supabase
        .from('Itineraries')
        .select('id,slug,title,location,category,difficulty,duration_display,price_per_person,price,cover_image_url,images,max_group_size,meeting_point,inclusions,tag,blurb')
        .eq('slug', slug).eq('is_active', true).single(),
      supabase
        .from('Tour_Schedules')
        .select('*')
        .eq('tour_id', null) // will be set after tour loads
        .limit(0),
    ]).then(([{ data: tourData }]) => {
      if (tourData) {
        setTour(tourData)
        // Fetch schedules for this tour
        supabase
          .from('Tour_Schedules')
          .select('*')
          .eq('tour_id', tourData.id)
          .eq('status', 'available')
          .gte('date', new Date().toISOString().slice(0, 10))
          .order('date')
          .limit(12)
          .then(({ data }) => {
            setSchedules(data || [])
            if (data?.length > 0) {
              setSelectedScheduleId(data[0].id)
              setSelectedDate(data[0].date)
            }
          })
      }
      setLoading(false)
    })
  }, [slug])

  // Prefill lead contact from the signed-in user (editable afterwards)
  useEffect(() => {
    if (!user) return
    setLeadName(prev => prev || user.user_metadata?.full_name || '')
    setLeadEmail(prev => prev || user.email || '')
    setLeadPhone(prev => prev || user.phone || user.user_metadata?.phone || '')
  }, [user])

  // Keep the traveller rows in sync with the headcount
  useEffect(() => {
    setTravellers(prev => {
      const next = prev.slice(0, numPersons)
      while (next.length < numPersons) next.push({ name: '', age: '' })
      return next
    })
  }, [numPersons])

  const updateTraveller = (i, field, value) =>
    setTravellers(prev => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)))

  // ── Pricing — mirrors the edge function exactly (base + 3% + 5% GST) ─
  const pricePerPerson = Number(tour?.price_per_person || 0)
  const subtotal = pricePerPerson * numPersons
 /* const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT)*/
  const gst = Math.round(subtotal * GST_PERCENT)
  const total = subtotal + /*platformFee*/ + gst

  const travellerManifest = () =>
    travellers
      .map(t => ({ name: t.name.trim(), age: t.age ? Number(t.age) : null }))
      .filter(t => t.name)

  // ── Lead logging → Google Sheet (via Supabase function) ────────────
  // Fire-and-forget: logging must never block or break the booking flow.
  const logLead = async (status, extra = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(LOG_LEAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${session?.access_token || ANON_KEY}`,
        },
        body: JSON.stringify({
          status,
          tour: tour?.title || '',
          tour_date: selectedDate || null,
          travellers_count: numPersons,
          lead_name: leadName.trim(),
          phone: leadPhone.trim(),
          email: (leadEmail || user?.email || '').trim(),
          traveller_manifest: travellerManifest(),
          special_request: specialRequest || null,
          source: 'web',
          ...extra,
        }),
        keepalive: true, // let it complete even if the tab navigates (WhatsApp)
      })
    } catch (_) { /* swallow — non-blocking */ }
  }

  // WhatsApp enquiry text — carries lead + traveller info into the chat
  const whatsappMessage = () => {
    const lines = [`Hi Hoppity! I want to enquire about: ${tour?.title || ''}`]
    if (selectedDate) lines.push(`Date: ${selectedDate}`)
    lines.push(`Travellers: ${numPersons}`)
    if (leadName)  lines.push(`Name: ${leadName}`)
    if (leadPhone) lines.push(`Phone: ${leadPhone}`)
    return encodeURIComponent(lines.join('\n'))
  }

  // ── Load Razorpay SDK ──────────────────────────────────────────────
  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  // ── Confirm booking ────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedDate && schedules.length === 0) {
      // free-form OK
    } else if (!selectedDate) {
      setError('Please select a date'); return
    }

    // Require the essentials we need to follow up with the client
    if (!leadName.trim())  { setError('Please enter the lead traveller’s name'); return }
    if (!leadPhone.trim()) { setError('Please enter a contact phone number'); return }

    setError(''); setBooking(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/auth'); return }

      // Step 1: Create Razorpay order
      const orderRes = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tour_id: tour.id,
          num_persons: numPersons,
          booking_date: selectedDate,
          schedule_id: selectedScheduleId,
          special_request: specialRequest || null,
          // ── traveller / lead contact ──
          lead_name: leadName.trim(),
          lead_phone: leadPhone.trim(),
          lead_email: (leadEmail || user?.email || '').trim() || null,
          travellers: travellerManifest(),
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed')

      // grand_total is the authoritative amount actually charged (incl. GST).
      const { order_id, booking_id, amount, key_id, tour_title, grand_total } = orderData
      const chargedAmount = grand_total ?? total

      // Log the started booking BEFORE payment — this is the "abandoned" list.
      logLead('booking_started', { lead_id: booking_id, razorpay_order_id: order_id })

      // Step 2: Load Razorpay SDK and open checkout
      await loadRazorpay()

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: key_id,
          amount,
          currency: 'INR',
          order_id,
          name: 'Hoppity',
          description: tour_title,
          prefill: {
            name:    leadName || user?.user_metadata?.full_name || user?.email || '',
            email:   leadEmail || user?.email || '',
            contact: leadPhone || user?.phone || '',
          },
          theme: { color: '#7C3AED' },
          handler: async (response) => {
            // Step 3: Verify payment server-side
            const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                booking_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              // Flip the same lead row to paid.
              logLead('paid', { lead_id: booking_id, razorpay_order_id: order_id, amount: chargedAmount })
              setSuccess({ bookingId: booking_id, amount: chargedAmount })
              resolve()
            } else {
              reject(new Error(verifyData.error || 'Verification failed'))
            }
          },
          modal: {
            ondismiss: () => reject(new Error('cancelled')),
          },
        })
        rzp.open()
      })

    } catch (e) {
      if (e.message !== 'cancelled') setError(e.message)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-violet-600">Loading…</div>
    </div>
  )

  if (!tour) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold">Tour not found</h2>
        <Link to="/itineraries" className="text-violet-600 hover:underline mt-2 block">Browse all tours</Link>
      </div>
    </div>
  )

 {/* // On Request tours → WhatsApp
  if (pricePerPerson === 0) {
    const msg = encodeURIComponent(`Hi Hoppity! I want to enquire about: ${tour.title}`)
    window.location.href = `https://wa.me/919752377323?text=${msg}`
    return null
  } */}

  // Success screen
  if (success) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-violet-100 p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Booking Confirmed!</h1>
        <p className="text-slate-500 mt-2">{tour.title}</p>
        {selectedDate && (
          <p className="text-violet-700 font-semibold mt-2">
            📅 {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        <div className="mt-4 bg-green-50 rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-green-700 text-sm font-semibold">
          <CheckCircle className="w-4 h-4" /> Payment of ₹{success.amount.toLocaleString('en-IN')} successful
        </div>
        <div className="mt-6 space-y-3">
          <Link to="/profile" className="block w-full rounded-2xl bg-slate-900 text-white py-3.5 font-semibold hover:bg-slate-800 transition">
            View My Bookings
          </Link>
          <Link to="/itineraries" className="block w-full rounded-2xl border border-violet-200 text-violet-700 py-3.5 font-semibold hover:bg-violet-50 transition">
            Explore More Tours
          </Link>
        </div>
      </div>
    </div>
  )

  const img = tour.cover_image_url || (Array.isArray(tour.images) ? tour.images[0] : null)

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3 mt-20">
        <Link to={`/itinerary/${slug}`} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-bold text-slate-900">Review & Confirm</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        {/* Tour summary */}
        <div className="bg-white rounded-2xl border border-violet-100 p-4 flex gap-4">
          {img && <img src={img} alt={tour.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />}
          <div className="min-w-0">
            <span className="inline-block text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full mb-1">{tour.category}</span>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{tour.title}</h3>
            <p className="text-xs text-slate-500 mt-1">📍 {tour.location} · ⏱ {tour.duration_display}</p>
          </div>
        </div>

        {/* Date selection */}
        <div className="bg-white rounded-2xl border border-violet-100 p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" /> Select Date
          </h3>
          {schedules.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {schedules.map(s => {
                const spots = (s.available_spots || 0) - (s.booked_spots || 0)
                const full = spots <= 0
                const active = selectedScheduleId === s.id
                return (
                  <button key={s.id} onClick={() => { if (!full) { setSelectedScheduleId(s.id); setSelectedDate(s.date) } }}
                    disabled={full}
                    className={`flex flex-col items-center px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-2 ${
                      active ? 'bg-slate-900 text-white border-slate-900'
                      : full  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-violet-400'
                    }`}>
                    <span>{new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>
                      {full ? 'Full' : `${spots} left`}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <input
              type="date"
              min={new Date(Date.now() + 86400000).toISOString().slice(0,10)}
              value={selectedDate || ''}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 text-sm"
            />
          )}
        </div>

        {/* Group size */}
        <div className="bg-white rounded-2xl border border-violet-100 p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" /> Travellers
          </h3>
          <div className="flex items-center gap-4">
            <button onClick={() => setNumPersons(n => Math.max(1, n-1))}
              className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-lg font-bold hover:border-violet-400 transition cursor-pointer">−</button>
            <span className="text-2xl font-black text-slate-900 w-8 text-center">{numPersons}</span>
            <button onClick={() => setNumPersons(n => Math.min(tour.max_group_size || 20, n+1))}
              className="w-10 h-10 rounded-xl bg-violet-700 flex items-center justify-center text-lg font-bold text-white hover:bg-violet-800 transition cursor-pointer">+</button>
            <span className="text-xs text-slate-400 ml-2">Max {tour.max_group_size || 20} people</span>
          </div>
        </div>

        {/* Lead contact — who we follow up with */}
        <div className="bg-white rounded-2xl border border-violet-100 p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-600" /> Lead Contact
          </h3>
          <div className="space-y-3">
            <input
              type="text" value={leadName} onChange={e => setLeadName(e.target.value)}
              placeholder="Full name *"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
            <input
              type="tel" value={leadPhone} onChange={e => setLeadPhone(e.target.value)}
              placeholder="Phone number *"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
            <input
              type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
          </div>
        </div>

        {/* Traveller manifest — synced to headcount */}
        <div className="bg-white rounded-2xl border border-violet-100 p-5">
          <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" /> Traveller Details
          </h3>
          <p className="text-xs text-slate-400 mb-3">Names as per a valid ID. Helps us plan and follow up.</p>
          <div className="space-y-2">
            {travellers.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text" value={t.name}
                  onChange={e => updateTraveller(i, 'name', e.target.value)}
                  placeholder={`Traveller ${i + 1} name`}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                />
                <input
                  type="number" min="0" max="120" value={t.age}
                  onChange={e => updateTraveller(i, 'age', e.target.value)}
                  placeholder="Age"
                  className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Special request */}
        <div className="bg-white rounded-2xl border border-violet-100 p-5">
          <h3 className="font-bold text-slate-900 mb-3">Special Requests (optional)</h3>
          <textarea
            rows={3} value={specialRequest} onChange={e => setSpecialRequest(e.target.value)}
            placeholder="Dietary needs, accessibility requirements, questions…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 resize-none"
          />
        </div>

        {/* Price breakdown */}
        {pricePerPerson > 0 && (
          <div className="bg-white rounded-2xl border border-violet-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">₹{pricePerPerson.toLocaleString('en-IN')} × {numPersons} person{numPersons > 1 ? 's' : ''}</span>
                <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {/* {<div className="flex justify-between text-slate-400">
                <span>Platform fee (3%)</span>
                <span>₹{platformFee.toLocaleString('en-IN')}</span>
              </div> } */}
              <div className="flex justify-between text-slate-400">
                <span>GST (5%)</span>
                <span>₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-base">
                <span>Total</span>
                <span className="text-violet-700">₹{total.toLocaleString('en-IN')}</span>
              </div> 
            </div>
          </div>
        )}

        {/* Cancellation note */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Free cancellation up to 48 hours before the tour date.
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        {/* CTA */}
        <div className="pb-6">
          {user ? (
            <button onClick={handleConfirm} disabled={booking}
              className="w-full rounded-2xl bg-slate-900 text-white py-4 font-bold text-base shadow-xl hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer">
              {booking ? 'Processing…' : `Confirm & Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
          ) : (
            <Link to="/auth" className="block w-full rounded-2xl bg-violet-700 text-white py-4 font-bold text-base shadow-xl text-center hover:bg-violet-800 transition">
              Sign In to Book
            </Link>
          )}

          <a
            href={`https://wa.me/919752377323?text=${whatsappMessage()}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => logLead('enquiry', { lead_id: `enq_${(crypto?.randomUUID?.() || Date.now())}` })}
            className="flex items-center justify-center gap-2 w-full mt-3 rounded-2xl border border-green-200 bg-green-50 text-green-700 py-3.5 font-semibold hover:bg-green-100 transition text-sm">
            <MessageCircle className="w-4 h-4" /> Enquire on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}