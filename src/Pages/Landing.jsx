import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import React from "react"
import { ArrowRight, Search, Clock, Star } from "lucide-react"
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import subhagImg from "../assets/subhag.jpeg"
import pallaviImg from "../assets/pallavi1.jpeg"
import divyanshImg from "../assets/divyansh.jpeg"
import diwakarImg  from "../assets/diwakar.jpeg"
import startuplogo from "../assets/startuplogo.png"
import dpiitlogo from "../assets/DPIIT.png"
import { setPageSEO } from '../lib/seo'

function normaliseLanding(row) {
  return {
    ...row,
    image: row.images?.length ? row.images : (row.cover_image_url ? [row.cover_image_url] : []),
  }
}

const VIBE_CHIPS = [
  { label: '🏔️ Mountain high', q: 'mountain trek himalaya' },
  { label: '🌿 Offbeat hidden gem', q: 'offbeat hidden gem northeast' },
  { label: '🦁 Wildlife safari', q: 'wildlife safari national park' },
  { label: '🕉️ Spiritual journey', q: 'spiritual heritage temple' },
  { label: '📸 Photography paradise', q: 'photography landscape scenic' },
  { label: '⚡ Weekend getaway', q: 'weekend short trip' },
]

const STAY_CATEGORIES = [
  {
    slug: 'budget',
    label: 'Affordable',
    title: 'Budget stays',
    desc: "Honest, clean, and wallet-friendly — hostels, guesthouses, and homestays that don't cut corners.",
    count: '6 stays',
    icon: '🎒',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
    flagship: false,
  },
  {
    slug: 'signature',
    label: 'Boutique',
    title: 'Signature stays',
    desc: 'Handpicked properties with soul — treehouses, heritage havelis, hilltop cottages.',
    count: '6 stays',
    icon: '🏡',
    image: 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800&q=80',
    flagship: false,
  },
  {
    slug: 'flagship',
    label: 'FLAGSHIP',
    title: 'Flagship properties',
    desc: 'Our most iconic stays — personally walked through, slept in, and stood behind completely.',
    count: '6 stays',
    icon: '✦',
    image: 'https://images.unsplash.com/photo-1587922546307-776227941871?w=800&q=85',
    flagship: true,
    perks: [
      'Personally vetted by the Hoppity team',
      'Exclusive experiences not listed elsewhere',
    ],
  },
]

export default function LandingPage() {
  useEffect(() => {
    setPageSEO({
      title: 'Discover Real India – Curated Offbeat Travel',
      description: "Hoppity curates India's most extraordinary travel experiences — Northeast tribal journeys, Ladakh expeditions, wildlife safaris, and spiritual trails. Expert-guided, small-group, authentic.",
      canonical: '/',
    })
  }, [])
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    let didCancel = false

    const cacheKey = 'landing_trips_v1'
    const cached = typeof window !== 'undefined' && sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setTrips(parsed)
        setLoading(false)
      } catch (_) {
        // ignore
      }
    }

    const fetchTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('Itineraries')
          .select('id,slug,title,location,duration,price,price_per_person,tag,blurb,cover_image_url,images,is_active,rating')
          .eq('is_active', true)
          .order('id', { ascending: true })
          .limit(6)

        if (error) return
        if (didCancel) return
        const normalised = (data || []).map(normaliseLanding)
        setTrips(normalised)
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(normalised))
        } catch (_) {}

        // Preload all images in parallel
        const imageUrls = normalised.map(trip => trip.image?.[0]).filter(Boolean)
        if (imageUrls.length > 0) {
          await Promise.all(
            imageUrls.map(url => {
              return new Promise((resolve) => {
                const img = new Image()
                img.onload = resolve
                img.onerror = resolve
                img.src = url
              })
            })
          )
          // Mark all images as loaded at once
          const loadedMap = {}
          normalised.forEach(trip => {
            if (trip.image?.[0]) loadedMap[trip.id] = true
          })
          if (!didCancel) setImagesLoaded(loadedMap)
        }
      } finally {
        if (!didCancel) setLoading(false)
      }
    }

    fetchTrips()

    return () => { didCancel = true }
  }, [])

  const [testimonials, setTestimonials] = React.useState([
    { quote: "They helped us find a peaceful, off-beat place that wasn't crowded. The stay was cozy, well maintained, close to the beach. I'd absolutely recommend Hoppity.", author: "Subhag Dholke", image: subhagImg, rating: 5, location: "Mumbai" },
    { quote: "During our Northeast trip, the Hoppity team helped us find a beautiful property just two hours before we arrived. What stood out most was how supportive the team was.", author: "Pallavi Gondane", image: pallaviImg, rating: 5, location: "Pune" },
    { quote: "Working with Hoppity has been a great experience as a creator. They gave me the freedom to present my storytelling in my own style.", author: "Divyansh Gupta", image: divyanshImg, rating: 5, location: "Delhi" },
    {
      quote: "Our Coorg trip with Hoppity was smoothly planned with seamless bookings, excellent coordination and wonderful support, making our family vacation stress-free, memorable, and truly enjoyable.", author: "Diwakar Sharma", image: diwakarImg, rating: 5, location: "Bangalore"
    }
  ])

  React.useEffect(() => {
    supabase
      .from('Tour_Reviews')
      .select('id,rating,review_text,created_at,Users(full_name,username,profile_pic,location)')
      .gte('rating', 4)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (error) return
        if (data && data.length >= 3) {
          setTestimonials(data.map(r => ({
            quote: r.review_text.length > 180 ? r.review_text.slice(0, 180) + '…' : r.review_text,
            author: r.Users?.full_name || r.Users?.username || 'Hoppity Traveller',
            image: r.Users?.profile_pic || null,
            rating: r.rating,
            location: r.Users?.location || 'India',
          })))
        }
      })
  }, [])

  const [form, setForm] = useState({ name: "", email: "", contact: "" })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    let v = e.target.value
    if (e.target.name === 'contact') v = v.replace(/[^0-9]/g, "")
    setForm({ ...form, [e.target.name]: v })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await supabase.from('Contact_Inquiries').insert({
        name: form.name, email: form.email, phone: form.contact || null,
        subject: 'Early Access', message: 'Joined the early access waitlist.',
        source: 'waitlist',
      })
    } catch (_) {}
    setSubmitted(true)
  }

  const handleSearch = (q) => {
    const query = (q || searchQuery).trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-[#f7f1ff] text-slate-900">
      <Navbar />

      {/* ── HERO — tight, search-first ──────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-10 md:pt-28 md:pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,58,237,0.10),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-6 lg:px-10 text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-semibold text-violet-800 shadow-sm mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600 inline-block" />
            Discover Real India — offbeat, curated, unforgettable
          </div>

          <h1 className="font-black leading-snug tracking-tight text-slate-950 text-base sm:text-xl md:text-2xl lg:text-3xl mb-5">
            <span className="block">The trips you remember forever are rarely the ones everyone else is taking.</span>
          </h1>

          {/* ── Search bar ─────────────────────────────────────────── */}
          <div className="flex gap-2 mb-4 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Try 'solo trek Meghalaya' or 'wildlife weekend'…"
                className="w-full bg-white rounded-2xl border border-violet-200 pl-10 pr-4 py-3.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
              />
            </div>
            <button onClick={() => handleSearch()}
              className="flex-shrink-0 bg-slate-950 text-white rounded-2xl px-5 py-3.5 text-sm font-bold hover:-translate-y-0.5 transition shadow-lg cursor-pointer">
              Search
            </button>
          </div>

          {/* Vibe chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {VIBE_CHIPS.map(chip => (
              <button key={chip.q} onClick={() => handleSearch(chip.q)}
                className="text-xs font-semibold bg-white border border-violet-100 text-violet-700 px-3 py-1.5 rounded-full hover:bg-violet-50 hover:border-violet-300 transition cursor-pointer shadow-sm">
                {chip.label}
              </button>
            ))}
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
            {["100+ offbeat experiences", "4.9★ avg rating", "Curated not catalogued"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 inline-block" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAY CATEGORIES ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">
            Where to stay
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">
            Find your kind of stay.
          </h2>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAY_CATEGORIES.map((card) => (
            <Link
              key={card.slug}
              to={`/stays/${card.slug}`}
              className={`group relative overflow-hidden cursor-pointer rounded-[1.75rem] transition duration-300 hover:-translate-y-1 ${
                card.flagship ? 'h-[360px]' : 'h-[320px]'
              }`}
            >
              {/* Background image */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
 
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: card.flagship
                    ? 'linear-gradient(160deg, rgba(80,20,160,0.28) 0%, transparent 45%, rgba(0,0,0,0.82) 100%)'
                    : 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0.76) 100%)',
                }}
              />
 
              {/* Flagship: gold shimmer line at top */}
              {card.flagship && (
                <div
                  className="absolute top-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: '2.5px',
                    background: 'linear-gradient(90deg, transparent 0%, #c4a35a 35%, #f0d080 55%, transparent 100%)',
                  }}
                />
              )}
 
              {/* Top badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span
                  className="text-[10px] font-bold px-3 py-1 rounded-full border backdrop-blur-md tracking-wide"
                  style={{
                    background: card.flagship ? 'rgba(196,163,90,0.22)' : 'rgba(255,255,255,0.16)',
                    color: card.flagship ? '#f0d080' : '#fff',
                    borderColor: card.flagship ? 'rgba(196,163,90,0.40)' : 'rgba(255,255,255,0.28)',
                  }}
                >
                  {card.label}
                </span>
                {card.flagship && (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md"
                    style={{
                      background: 'rgba(255,255,255,0.13)',
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.22)',
                    }}
                  >
                    ⭐ Hoppity pick
                  </span>
                )}
              </div>
 
              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
 
                {/* Icon + Title */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-base backdrop-blur-md border"
                    style={{
                      background: card.flagship ? 'rgba(196,163,90,0.20)' : 'rgba(255,255,255,0.16)',
                      borderColor: card.flagship ? 'rgba(196,163,90,0.35)' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {card.icon}
                  </div>
                  <p className="text-[17px] font-black text-white tracking-tight drop-shadow-md">
                    {card.title}
                  </p>
                </div>
 
                {/* Description */}
                <p className="text-xs text-white/80 leading-relaxed mb-3 drop-shadow">
                  {card.desc}
                </p>
 
                {/* Flagship perks */}
                {card.flagship && card.perks && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {card.perks.map((perk) => (
                      <div key={perk} className="flex items-center gap-2">
                        <span style={{ color: '#f0d080', fontSize: '13px', flexShrink: 0 }}>✓</span>
                        <span className="text-[11.5px] text-white/85 drop-shadow">{perk}</span>
                      </div>
                    ))}
                  </div>
                )}
 
                {/* Count + Explore */}
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: card.flagship ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)' }}
                >
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full border backdrop-blur-md"
                    style={{
                      background: card.flagship ? 'rgba(196,163,90,0.20)' : 'rgba(255,255,255,0.15)',
                      color: card.flagship ? '#f0d080' : '#fff',
                      borderColor: card.flagship ? 'rgba(196,163,90,0.36)' : 'rgba(255,255,255,0.26)',
                    }}
                  >
                    {card.count}
                  </span>
                  <span
                    className="text-sm font-bold text-white flex items-center gap-1 drop-shadow"
                  >
                    Explore{' '}
                    <ArrowRight
                      className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: card.flagship ? '#f0d080' : '#fff' }}
                    />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-12">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">What this unlocks</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">Not escape. Expansion.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {testimonials.slice(0, 4).map((item, i) => (
            <div key={i} className="rounded-2xl bg-white border border-violet-100 p-5 shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                {item.image
                  ? <img src={item.image} alt={item.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-black flex-shrink-0">{(item.author || 'H').charAt(0)}</div>}
                <div>
                  <p className="font-semibold text-sm text-slate-900 leading-none">{item.author}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.location}</p>
                </div>
                <div className="ml-auto text-yellow-400 text-xs flex-shrink-0">{"★".repeat(item.rating)}</div>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">"{item.quote}"</p>
            </div>
          ))}
        </div>
      </section>

{/* ── WAITLIST ──────────────────────────────────────────────── */}
      <section id="waitlist" className="mx-auto max-w-7xl px-6 lg:px-10 pb-14">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-800 px-8 py-12 text-white shadow-2xl lg:px-14 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300 mb-4">Early access</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">
                One day you'll either remember the trip you took — or the one you kept postponing.
              </h2>
              <p className="text-slate-300 text-base leading-7">
                Be among the first to discover India before it gets over-discovered.
              </p>
            </div>
            {submitted ? (
              <div className="rounded-2xl bg-white/10 border border-white/20 p-8 text-center backdrop-blur">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-black mb-2">You're on the list!</h3>
                <p className="text-violet-200 text-sm">We'll reach out when we have something worth your attention.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 transition"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email Address</label>
                  <input name="email" value={form.email} onChange={handleChange} required type="email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 transition"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">WhatsApp <span className="font-normal text-slate-400">(optional)</span></label>
                  <input name="contact" value={form.contact} onChange={handleChange} type="tel" maxLength={10}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 transition"
                    placeholder="9876543210" />
                </div>
                <button type="submit"
                  className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition cursor-pointer">
                  Get First Access →
                </button>
                <p className="text-xs text-slate-400 text-center">No spam. Just irresistible journeys.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-violet-100 bg-white">
  <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
      <div>
        <p className="font-black text-slate-900 text-lg">Hoppity</p>
        <p className="text-xs text-slate-500 mt-0.5">Discover Real Travel · India</p>
      </div>
      <nav className="flex flex-wrap gap-5 text-sm text-slate-500">
        <a href="#catalog" className="hover:text-violet-700 transition">Itineraries</a>
        <Link to="/itineraries" className="hover:text-violet-700 transition">All Tours</Link>
        <Link to="/blog" className="hover:text-violet-700 transition">Stories</Link>
        <Link to="/about" className="hover:text-violet-700 transition">About</Link>
        <Link to="/contact" className="hover:text-violet-700 transition">Contact</Link>
        <Link to="/privacy" className="hover:text-violet-700 transition">Privacy Policy</Link>
      </nav>
      <div className="flex items-center gap-4">
        <a href="https://www.instagram.com/hoppity_in" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500 text-xl transition hover:scale-110"><FaInstagram /></a>
        <a href="https://www.linkedin.com/company/triffair/posts/?feedView=all" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 text-xl transition hover:scale-110"><FaLinkedin /></a>
        <a href="https://www.facebook.com/Hoppityin" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 text-xl transition hover:scale-110"><FaFacebook /></a>
        <a href="https://wa.me/919752377323" target="_blank" rel="noopener noreferrer"
          className="ml-2 flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 hover:bg-green-100 transition">
          💬 WhatsApp us
        </a>
      </div>
    </div>

    {/* DPIIT & Startup India recognition badge row */}
    <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Recognised by</span>
        <div className="flex items-center gap-4">
          <img
            src={dpiitlogo}
            alt="DPIIT - Department for Promotion of Industry and Internal Trade"
            className="h-8 w-auto object-contain opacity-80 opacity-100 transition"
          />
          <img
            src={startuplogo}
            alt="Startup India"
            className="h-7 w-auto object-contain opacity-80 opacity-100 transition"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-400">
        <span>© 2026 Hoppity (Triffair). All rights reserved.</span>
        <a href="mailto:sales@hoppity.in" className="hover:text-violet-600 transition sm:ml-4">sales@hoppity.in</a>
      </div>
    </div>
  </div>
</footer>
    </div>
  )
}
