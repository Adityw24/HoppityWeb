import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useEffect, useRef } from "react"
import React from "react"
import { ArrowRight, Search, Clock, Star } from "lucide-react"
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
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

export default function Land
  useEffect(() => {
    setPageSEO({
      title: 'Discover Real India – Curated Offbeat Travel',
      description: "Hoppity curates India's most extraordinary travel experiences — Northeast tribal journeys, Ladakh expeditions, wildlife safaris, and spiritual trails. Expert-guided, small-group, authentic.",
      canonical: '/',
    })
  }, [])
ingPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    supabase
      .from("Itineraries")
      .select("id,slug,title,location,duration,price,price_per_person,tag,blurb,cover_image_url,images,is_active,rating")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(6)
      .then(({ data }) => setTrips((data || []).map(normaliseLanding)))
  }, [])

  const [testimonials, setTestimonials] = React.useState([
    { quote: "They helped us find a peaceful, off-beat place that wasn't crowded. The stay was cozy, well maintained, close to the beach. I'd absolutely recommend Hoppity.", author: "Subhag Dholke", image: null, rating: 5, location: "Mumbai" },
    { quote: "During our Northeast trip, the Hoppity team helped us find a beautiful property just two hours before we arrived. What stood out most was how supportive the team was.", author: "Pallavi Gondane", image: null, rating: 5, location: "Pune" },
    { quote: "Working with Hoppity has been a great experience as a creator. They gave me the freedom to present my storytelling in my own style.", author: "Divyansh Gupta", image: null, rating: 5, location: "Delhi" },
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

          <h1 className="font-black leading-[1.0] tracking-[-0.035em] text-slate-950 text-4xl sm:text-5xl md:text-6xl mb-5">
            The trips you remember forever are rarely the ones everyone else is taking.
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

      {/* ── ITINERARIES ───────────────────────────────────────────── */}
      <section id="catalog" className="mx-auto max-w-7xl px-6 lg:px-10 pb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">Curated catalog</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">
              Itineraries that make ordinary weekends feel too small.
            </h2>
          </div>
          <Link to="/itineraries"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-violet-700 transition flex-shrink-0 ml-8">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.slice(0, 6).map(trip => (
            <Link to={`/itinerary/${trip.slug}`} key={trip.slug}
              className="group overflow-hidden rounded-[1.75rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
              <div className="relative h-48 overflow-hidden">
                {/* Gradient fallback base */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-purple-900" />
                {/* Photo overlay */}
                {trip.image?.[0] && (
                  <img src={trip.image[0]} alt={trip.title}
                    className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  {trip.tag && (
                    <div className="inline-flex self-start rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">{trip.tag}</div>
                  )}
                  <div className="mt-auto">
                    <p className="text-xs uppercase tracking-[0.18em] text-violet-200 mb-1">{trip.location}</p>
                    <h3 className="text-lg font-bold leading-tight text-white">{trip.title}</h3>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3.5 h-3.5" /> {trip.duration}</span>
                  <span className="font-black text-violet-700">
                    {trip.price_per_person ? `₹${Number(trip.price_per_person).toLocaleString('en-IN')}` : trip.price}
                  </span>
                </div>
                {trip.blurb && <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">{trip.blurb}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition">
                    Explore <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                  {trip.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                      <Star className="w-3 h-3 fill-current" /> {Number(trip.rating).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7 flex justify-center">
          <Link to="/itineraries"
            className="rounded-2xl bg-slate-950 px-8 py-3.5 text-sm text-white font-semibold shadow-lg hover:-translate-y-0.5 transition">
            See all itineraries →
          </Link>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-12">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">What this unlocks</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">Not escape. Expansion.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.slice(0, 3).map((item, i) => (
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
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>© 2026 Hoppity (Triffair). All rights reserved.</span>
            <a href="mailto:sales@hoppity.in" className="hover:text-violet-600 transition">sales@hoppity.in</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
