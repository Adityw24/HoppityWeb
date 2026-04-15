import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import React from "react"
import subhag from "../assets/subhag.jpeg"
import pallavi from "../assets/pallavi1.jpeg"
import divyansh from "../assets/divyansh.jpeg"
import { ArrowRight, MapPin, Clock, Star } from "lucide-react"
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"

function normaliseLanding(row) {
  return {
    ...row,
    image: row.images?.length ? row.images : (row.cover_image_url ? [row.cover_image_url] : []),
  }
}

export default function LandingPage() {

  /* ── Data ─────────────────────────────────────────────────────── */
  const [trips, setTrips] = useState([])

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
    { quote: "They helped us find a peaceful, off-beat place that wasn't crowded. The stay was cozy, well maintained, close to the beach. For seamless trips to lesser-known destinations, I'd absolutely recommend Hoppity.", author: "Subhag Dholke", image: subhag, rating: 5, location: "Mumbai" },
    { quote: "During our Northeast trip, the Hoppity team helped us find a beautiful property just two hours before we arrived. What stood out most was how supportive the team was. Truly grateful.", author: "Pallavi Gondane", image: pallavi, rating: 5, location: "Pune" },
    { quote: "Working with Hoppity has been a great experience as a creator. They gave me the freedom to present my storytelling in my own style. Supportive, clear with communication.", author: "Divyansh Gupta", image: divyansh, rating: 5, location: "Delhi" },
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
        if (error) { console.warn('Reviews fetch:', error.message); return; }
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

  /* ── Waitlist form ────────────────────────────────────────────── */
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
        name: form.name, email: form.email,
        phone: form.contact || null,
        subject: 'Early Access',
        message: 'Joined the early access waitlist from the landing page.',
        source: 'waitlist',
      })
      setSubmitted(true)
    } catch (_) {
      setSubmitted(true) // optimistic
    }
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f7f1ff] text-slate-900">

      {/* Floating navbar from shared component */}
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,58,237,0.13),transparent)]" />

        <div className="relative mx-auto max-w-5xl px-6 lg:px-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-800 shadow-sm mb-6">
            <span className="h-2 w-2 rounded-full bg-violet-600 inline-block" />
            For travellers who are done with overdone travel
          </div>

          {/* Headline */}
          <h1 className="font-black leading-[1.0] tracking-[-0.04em] text-slate-950 text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto mb-6">
            The trips you remember forever are rarely the ones everyone else is taking.
          </h1>

          {/* Manifesto line */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-8 mb-8">
            Hoppity finds the hidden side of India — soulful, unhurried journeys through places still thick with story, silence, and wonder.
            <span className="block mt-2 text-slate-500 text-base">Because ordinary trips make memories. Extraordinary trips change who comes back.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a href="#catalog"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5">
              Explore Itineraries <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#waitlist"
              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-white px-7 py-4 text-base font-semibold text-violet-800 shadow-sm transition hover:-translate-y-0.5">
              Join Early Access
            </a>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            {[
              "100+ offbeat experiences curated",
              "4.9★ average rating",
              "Real India, not tourist India",
            ].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 inline-block" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY STRIP (3 pillars, compact horizontal) ─────────────── */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 pb-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Not tourist India. Real India.", icon: "🧭" },
            { title: "Designed for wonder, not inventory.", icon: "✨" },
            { title: "Curated with trust, not clutter.", icon: "🎯" },
          ].map(p => (
            <div key={p.title} className="flex items-center gap-3 rounded-2xl bg-white border border-violet-100 px-5 py-4 shadow-sm">
              <span className="text-xl flex-shrink-0">{p.icon}</span>
              <p className="text-sm font-semibold text-slate-800 leading-snug">{p.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ITINERARIES ───────────────────────────────────────────── */}
      <section id="catalog" className="mx-auto max-w-7xl px-6 lg:px-10 pb-16">

        {/* Section header — tight */}
        <div className="flex items-end justify-between mb-8">
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

        {/* Trip cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.slice(0, 6).map(trip => (
            <Link to={`/itinerary/${trip.slug}`} key={trip.slug}
              className="group overflow-hidden rounded-[1.75rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer">

              <div className="relative h-48 overflow-hidden">
                <img src={trip.image?.[0] || trip.cover_image_url || ""} alt={trip.title}
                  className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  {trip.tag && (
                    <div className="inline-flex self-start rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {trip.tag}
                    </div>
                  )}
                  <div className="mt-auto">
                    <p className="text-xs uppercase tracking-[0.18em] text-violet-200 mb-1">{trip.location}</p>
                    <h3 className="text-lg font-bold leading-tight text-white">{trip.title}</h3>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" /> {trip.duration}
                  </span>
                  <span className="font-black text-violet-700">
                    {trip.price_per_person ? `₹${Number(trip.price_per_person).toLocaleString('en-IN')}` : trip.price}
                  </span>
                </div>
                {trip.blurb && (
                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">{trip.blurb}</p>
                )}
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

        <div className="mt-8 flex justify-center">
          <Link to="/itineraries"
            className="rounded-2xl bg-slate-950 px-8 py-3.5 text-sm text-white font-semibold shadow-lg hover:-translate-y-0.5 transition">
            See all itineraries →
          </Link>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────── */}
      <section id="stories" className="mx-auto max-w-7xl px-6 lg:px-10 pb-14">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-1">What this unlocks</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">
            Not escape. Expansion.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.slice(0, 3).map((item, i) => (
            <div key={i} className="rounded-2xl bg-white border border-violet-100 p-5 shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                {item.image ? (
                  <img src={item.image} alt={item.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-black flex-shrink-0">
                    {(item.author || 'H').charAt(0)}
                  </div>
                )}
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

      {/* ── FOMO + WAITLIST ───────────────────────────────────────── */}
      <section id="waitlist" className="mx-auto max-w-7xl px-6 lg:px-10 pb-16">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-800 px-8 py-12 text-white shadow-2xl lg:px-14 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300 mb-4">Early access</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">
                One day you'll either remember the trip you took — or the one you kept postponing.
              </h2>
              <p className="text-slate-300 text-base leading-7 mb-5">
                Be among the first to discover India before it gets over-discovered. Join the Hoppity list for first access to curated itineraries, limited drops, and journeys built for a richer life.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-violet-200">
                {["No spam, ever", "First access to new itineraries", "Community-only drops"].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" /> {t}
                  </span>
                ))}
              </div>
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email Address</label>
                  <input name="email" value={form.email} onChange={handleChange} required type="email"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">WhatsApp Number <span className="font-normal text-slate-400">(optional)</span></label>
                  <input name="contact" value={form.contact} onChange={handleChange} type="tel" maxLength={10}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
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
              <Link to="/contact" className="hover:text-violet-700 transition">Contact</Link>
              <a href="/privacy" className="hover:text-violet-700 transition">Privacy</a>
            </nav>

            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/hoppity_in" target="_blank" rel="noopener noreferrer"
                className="text-slate-400 hover:text-pink-500 text-xl transition hover:scale-110">
                <FaInstagram />
              </a>
              <a href="https://www.linkedin.com/company/triffair/posts/?feedView=all" target="_blank" rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 text-xl transition hover:scale-110">
                <FaLinkedin />
              </a>
              <a href="https://www.facebook.com/Hoppityin" target="_blank" rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-500 text-xl transition hover:scale-110">
                <FaFacebook />
              </a>
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
