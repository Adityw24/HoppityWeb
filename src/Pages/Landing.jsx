import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  MapPin, Star, ArrowRight, ChevronLeft, ChevronRight, Clock, BedDouble,
  ShieldCheck, Users, Compass, Headphones,
} from "lucide-react"
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import subhagImg from "../assets/subhag.jpeg"
import pallaviImg from "../assets/pallavi1.jpeg"
import divyanshImg from "../assets/divyansh.jpeg"
import diwakarImg from "../assets/diwakar.jpeg"
import poojaImg from "../assets/pooja.jpeg"
import startuplogo from "../assets/startuplogo.png"
import dpiitlogo from "../assets/DPIIT.png"
import { setPageSEO } from '../lib/seo'

/* ─────────────────────────────────────────────────────────────
   THREE SCREENS:
     1. Masthead — the featured / upcoming trip itself
     2. Best journeys + best stays
     3. Reviews + join-the-list + footer

   ── HOW TO SET THE MASTHEAD TRIPS ──────────────────────────
   Paste the slug of each trip you want, in the order you want
   them shown. The slug is the last part of its URL:
     /itinerary/satpura-on-foot-…  →  'satpura-on-foot-…'

   The masthead runs its OWN query against these slugs, so a trip
   shows here whether or not it is popular enough to appear in the
   grid below. The two are independent.

   • Up to MAX_FEATURED are used; extras are ignored.
   • Order here is the order they rotate in.
   • A slug that doesn't match a live trip is skipped silently,
     so an unpublished or renamed trip can't break the hero.
   • Featured trips are hidden from "Our best journeys" so the same
     trip never appears twice — delete the filter on HIDE_FEATURED
     below if you'd rather show them in both places.
   • Empty the array and the top-rated live trips take over.
   ───────────────────────────────────────────────────────────── */
const MAX_FEATURED = 5
const FEATURED_SLUGS = [
  'ziro-festival-2026',
  'nagaland-hornbill-festival-tour-dimapur-kohima',
  'ayodhya-prayagraj-varanasi-a-spiritual-journey-dev-deepawali-experience',
  'andaman-experience-by-hoppity',
  // 'your-fifth-best-trip-slug',
]
const SLIDE_MS = 6000
const HIDE_FEATURED_IN_GRID = true    // keep the masthead trips out of the grid below

/* Detail routes. Change ONLY these two lines if a path ever differs. */
const tripHref = (slug) => `/itinerary/${String(slug || '').replace(/^\/+/, '')}`
const stayHref = (slug) => `/stays/${String(slug || '').replace(/^\/+/, '')}`

const isVideo = (url) => /\.(mp4|mov|webm|m4v|avi|mkv|ogv|3gp)(\?|#|$)/i.test(String(url || ''))

const inr = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `₹${n.toLocaleString('en-IN')}` : null
}

/* Properties column names have shifted over time (images_url as array vs
   json string, name vs property_name), so read defensively rather than
   selecting exact columns and risking a 400. */
const toArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean)
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [v]
    } catch { return [v] }
  }
  return []
}

function normaliseTrip(row) {
  const images = row.images?.length ? row.images : (row.cover_image_url ? [row.cover_image_url] : [])
  return {
    ...row,
    cover: images.find(u => !isVideo(u)) || (isVideo(row.cover_image_url) ? null : row.cover_image_url) || null,
  }
}

function normaliseStay(row) {
  const media = [...toArray(row.images_url), ...toArray(row.images)]
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name || row.property_name || row.title || 'Stay',
    place: row.city || row.location || row.state || row.address || '',
    price: row.price_per_night ?? row.price ?? row.base_price ?? null,
    rating: Number(row.rating) || 0,
    category: row.property_category || '',
    cover: media.find(u => !isVideo(u)) || null,
    isLive: String(row.status || '').replace(/"/g, '').trim().toLowerCase() !== 'draft',
  }
}

const VIBES = [
  { label: '🏔️ Mountains', q: 'mountain trek himalaya' },
  { label: '🐘 Wildlife', q: 'wildlife safari national park' },
  { label: '🌿 Offbeat', q: 'offbeat hidden gem northeast' },
  { label: '🌊 Beaches', q: 'beach coast backwaters' },
  { label: '🕉️ Heritage', q: 'spiritual heritage temple' },
  { label: '⚡ Weekend', q: 'weekend short trip' },
]

const PROMISES = [
  { icon: Compass, title: 'Scouted in person', blurb: 'We travel every route before we sell it.' },
  { icon: Users, title: 'Small groups', blurb: 'Most departures cap at 12 travellers.' },
  { icon: ShieldCheck, title: 'Clear pricing', blurb: 'The final number, before you pay.' },
  { icon: Headphones, title: 'Always reachable', blurb: 'A real person on WhatsApp, all trip.' },
]

/* ── Compact tile — smaller than before, five to a row on desktop ───── */
function MediaCard({ href, image, title, place, meta, price, priceSuffix, rating, badge }) {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : image
  return (
    <Link
      to={href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-violet-200/50 ring-1 ring-violet-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      {src
        ? <img src={src} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        : <div className="absolute inset-0 bg-gradient-to-br from-violet-300 to-fuchsia-300" />}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {rating > 0 ? (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300" />{rating.toFixed(1)}
        </span>
      ) : badge ? (
        <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
          {badge}
        </span>
      ) : null}

      {price && (
        <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-950 shadow-sm">
          {price}{priceSuffix && <span className="font-medium text-slate-500">{priceSuffix}</span>}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-white">{title}</h3>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-white/75">
          {place && <><MapPin className="h-2.5 w-2.5 flex-shrink-0" /><span className="truncate">{place}</span></>}
          {meta && <><span className="text-white/40">·</span><span className="truncate">{meta}</span></>}
        </p>
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return <div className="aspect-[4/3] animate-pulse rounded-xl bg-violet-200/40" />
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [featuredTrips, setFeaturedTrips] = useState([])
  const [stays, setStays] = useState([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [loadingStays, setLoadingStays] = useState(true)
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setPageSEO({
      title: 'Discover Real India – Curated Offbeat Travel',
      description: "Hoppity curates India's most extraordinary travel experiences and places to stay — Northeast tribal journeys, Ladakh expeditions, wildlife safaris and spiritual trails. Expert-guided, small-group, authentic.",
      canonical: '/',
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('Itineraries')
          .select('id,slug,title,location,duration,duration_display,price,price_per_person,tag,blurb,cover_image_url,images,is_active,rating')
          .eq('is_active', true)
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(12)
        if (error || cancelled) return
        setTrips((data || []).map(normaliseTrip))
      } finally {
        if (!cancelled) setLoadingTrips(false)
      }
    }

    /* The masthead gets its own query: exactly the pinned slugs, regardless
       of rating or of what the grid below happens to be showing. */
    const loadFeatured = async () => {
      if (FEATURED_SLUGS.length === 0) return
      const { data, error } = await supabase
        .from('Itineraries')
        .select('id,slug,title,location,duration,duration_display,price,price_per_person,tag,blurb,cover_image_url,images,is_active,rating')
        .in('slug', FEATURED_SLUGS)
        .eq('is_active', true)
      if (error || cancelled) return
      const bySlug = new Map((data || []).map(normaliseTrip).map(t => [t.slug, t]))
      // Keep the order written in FEATURED_SLUGS, drop misses and coverless trips.
      setFeaturedTrips(
        FEATURED_SLUGS.map(slug => bySlug.get(slug)).filter(t => t?.cover).slice(0, MAX_FEATURED)
      )
    }

    /* select('*') on purpose — Properties has changed shape more than once
       and a named column that no longer exists would fail the whole query. */
    const loadStays = async () => {
      try {
        const { data, error } = await supabase.from('Properties').select('*').limit(12)
        if (error || cancelled) return
        setStays((data || []).map(normaliseStay).filter(s => s.isLive && s.cover).slice(0, 5))
      } finally {
        if (!cancelled) setLoadingStays(false)
      }
    }

    loadTrips()
    loadFeatured()
    loadStays()
    return () => { cancelled = true }
  }, [])

  const withCover = trips.filter(t => t.cover)

  /* The masthead IS the featured trip: the pinned slugs from their own
     query, or — only when nothing is pinned — the top-rated live trips. */
  const featured = FEATURED_SLUGS.length
    ? featuredTrips
    : withCover.slice(0, MAX_FEATURED)

  /* Grid trips, minus anything already on the masthead. */
  const gridTrips = HIDE_FEATURED_IN_GRID
    ? trips.filter(t => !FEATURED_SLUGS.includes(t.slug))
    : trips
  const active = featured[slide % (featured.length || 1)] || null

  useEffect(() => { if (slide >= featured.length) setSlide(0) }, [featured.length, slide])

  // Preload the next cover so the swap never lands on a blank frame.
  useEffect(() => {
    const next = featured[(slide + 1) % (featured.length || 1)]
    if (next?.cover) { const img = new Image(); img.src = next.cover }
  }, [slide, featured])

  useEffect(() => {
    if (featured.length <= 1 || paused) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setSlide(s => (s + 1) % featured.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [featured.length, paused])

  const go = (dir) => setSlide(s => (s + dir + featured.length) % featured.length)

  const [testimonials, setTestimonials] = useState([
    { quote: "They found us a peaceful, off-beat place that wasn't crowded. Cozy, well maintained, close to the beach. I'd absolutely recommend Hoppity.", author: "Subhag Dholke", image: subhagImg, rating: 5, location: "Mumbai" },
    { quote: "During our Northeast trip the team found us a beautiful property two hours before we arrived. What stood out was how supportive they were.", author: "Pallavi Gondane", image: pallaviImg, rating: 5, location: "Pune" },
    { quote: "Our Kerala journey was unforgettable — every detail across Munnar, Thekkady, Alleppey and Kochi was handled. We'll travel with them again.", author: "Pooja Hingorani", image: poojaImg, rating: 5, location: "Mumbai" },
    { quote: "Our Coorg trip was smoothly planned with seamless bookings and excellent coordination — a stress-free family vacation.", author: "Diwakar Sharma", image: diwakarImg, rating: 5, location: "Bangalore" },
    { quote: "Working with Hoppity has been great as a creator. They gave me the freedom to tell the story in my own style.", author: "Divyansh Gupta", image: divyanshImg, rating: 5, location: "Delhi" },
  ])

  useEffect(() => {
    supabase
      .from('Tour_Reviews')
      .select('id,rating,review_text,created_at,Users(full_name,username,profile_pic,location)')
      .gte('rating', 4)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (error || !data || data.length < 3) return
        setTestimonials(data.map(r => ({
          quote: r.review_text.length > 165 ? r.review_text.slice(0, 165) + '…' : r.review_text,
          author: r.Users?.full_name || r.Users?.username || 'Hoppity Traveller',
          image: r.Users?.profile_pic || null,
          rating: r.rating,
          location: r.Users?.location || 'India',
        })))
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

  const goSearch = (q) => navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  const offerImage = withCover[1]?.cover || withCover[0]?.cover || null

  const heroPrice = active ? inr(active.price_per_person ?? active.price) : null

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f1ff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(124,58,237,0.10),transparent_70%)]" />

      <style>{`
        /* Hero copy rises in, one line after another, each time the trip changes */
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: none; }
        }
        .hero-copy > * { animation: heroUp 650ms cubic-bezier(.22,.68,.36,1) both; }
        .hero-copy > *:nth-child(2) { animation-delay: 90ms }
        .hero-copy > *:nth-child(3) { animation-delay: 160ms }
        .hero-copy > *:nth-child(4) { animation-delay: 220ms }
        .hero-copy > *:nth-child(5) { animation-delay: 280ms }

        /* Slow push on the active photograph so the masthead never sits still */
        @keyframes kenBurns {
          from { transform: scale(1.02); }
          to   { transform: scale(1.12); }
        }
        .hero-kenburns { animation: kenBurns 9s ease-out both; }

        /* Tiles fade up as the grid fills */
        @keyframes tileIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .tile-grid > * { animation: tileIn 420ms ease-out both; }
        .tile-grid > *:nth-child(2) { animation-delay: 60ms }
        .tile-grid > *:nth-child(3) { animation-delay: 120ms }
        .tile-grid > *:nth-child(4) { animation-delay: 180ms }
        .tile-grid > *:nth-child(5) { animation-delay: 240ms }

        @media (prefers-reduced-motion: reduce) {
          .hero-copy > *, .hero-kenburns, .tile-grid > * { animation: none !important; }
        }
      `}</style>

      <Navbar />

      <main className="relative">

        {/* ═══ FOLD 1 — the masthead IS the featured trip ═════════════ */}
        <section className="px-3 pt-20 sm:px-5 sm:pt-24">
          <div
            className="relative mx-auto w-full max-w-[1500px] overflow-hidden rounded-[2rem] bg-violet-950"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
{/* Only real trips are ever painted here. Until they arrive the panel
                holds a violet wash, so no placeholder photo flashes on load. */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-violet-800 to-fuchsia-800" />

            {featured.map((t, i) => (
              <div
                key={t.id}
                aria-hidden={i !== slide}
                className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ease-out ${
                  i === slide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={t.cover}
                  alt=""
                  aria-hidden="true"
                  fetchpriority={i === 0 ? 'high' : 'auto'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className={`h-full w-full object-cover object-center ${i === slide ? 'hero-kenburns' : 'scale-105'}`}
                />
              </div>
            ))}

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/25" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 to-transparent" />

            {/* The whole masthead opens the trip; the buttons sit above it */}
            {active && (
              <Link to={tripHref(active.slug)} aria-label={`Open ${active.title}`}
                className="absolute inset-0 z-0" />
            )}

            <div className="pointer-events-none relative z-10 flex min-h-[calc(100svh-7rem)] flex-col justify-end px-6 pb-8 pt-24 sm:px-10 lg:px-14 lg:pb-10">
              {/* key = the trip, so the copy replays its entrance on every change */}
              <div key={active?.id || 'hero'} className="hero-copy max-w-2xl">
                <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-fuchsia-300" />
                  {active?.tag || 'Featured departure'} · Discover Real India
                </span>

                <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                  {active ? active.title : 'The trips you remember forever are rarely the ones everyone else is taking.'}
                </h1>

                {active && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-violet-300" />{active.location || 'India'}</span>
                    {(active.duration_display || active.duration) && (
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-violet-300" />{active.duration_display || active.duration}</span>
                    )}
                    {active.rating > 0 && (
                      <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />{Number(active.rating).toFixed(1)}</span>
                    )}
                    {heroPrice && (
                      <span className="rounded-full bg-white/15 px-3 py-1 font-bold text-white ring-1 ring-white/25">
                        {heroPrice} <span className="font-medium text-white/70">per person</span>
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-4 line-clamp-2 max-w-lg text-base leading-relaxed text-white/80">
                  {active?.blurb || 'Small-group journeys and hand-picked places to stay, planned by people who have actually been there.'}
                </p>

                <div className="pointer-events-auto mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link to={active ? tripHref(active.slug) : '/itineraries'}
                    className="rounded-full bg-white px-7 py-4 text-center text-base font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-50">
                    Book now
                  </Link>
                  <a href="#explore"
                    className="rounded-full bg-white/15 px-7 py-4 text-center text-base font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25">
                    See all trips &amp; stays
                  </a>
                </div>
              </div>

              {/* Why us — inside the hero, so fold one holds the whole pitch */}
              <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/15 pt-5 lg:grid-cols-4">
                {PROMISES.map(({ icon: Icon, title, blurb }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/70">{blurb}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide controls, only when more than one trip is featured */}
            {featured.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Previous featured trip"
                  className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/35 cursor-pointer">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next featured trip"
                  className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/35 cursor-pointer">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 right-5 z-20 flex items-center gap-1.5">
                  {featured.map((t, i) => (
                    <button key={t.id} type="button" onClick={() => setSlide(i)}
                      aria-label={`Featured trip ${i + 1}`} aria-current={i === slide}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ═══ FOLD 2 — smaller tiles, five to a row ══════════════════ */}
        <section id="explore" className="mx-auto w-full max-w-[1500px] scroll-mt-24 px-5 pt-12 sm:px-8 lg:px-10">

          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {VIBES.map(v => (
              <button key={v.q} onClick={() => goSearch(v.q)}
                className="whitespace-nowrap rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-violet-800 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white hover:ring-violet-300 cursor-pointer">
                {v.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Our best journeys</h2>
              <p className="mt-1 text-sm text-slate-500">Fixed departures, small groups, everything arranged.</p>
            </div>
            <Link to="/itineraries" className="flex items-center gap-1.5 text-sm font-bold text-violet-700 transition hover:text-violet-900">
              See all trips <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div key={gridTrips.length} className="tile-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {loadingTrips && gridTrips.length === 0
              ? [0, 1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
              : gridTrips.slice(0, 5).map(t => (
                  <MediaCard
                    key={t.id}
                    href={tripHref(t.slug)}
                    image={t.cover}
                    title={t.title}
                    place={t.location}
                    meta={t.duration_display || t.duration}
                    price={inr(t.price_per_person ?? t.price)}
                    priceSuffix=" pp"
                    rating={Number(t.rating) || 0}
                    badge={t.tag}
                  />
                ))}
          </div>

          {/* Stays — hidden entirely if none come back, rather than an empty row */}
          {(loadingStays || stays.length > 0) && (
            <>
              <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    <BedDouble className="h-6 w-6 text-violet-600" /> Places to stay
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Homestays, boutique lodges and quiet corners we've checked ourselves.</p>
                </div>
                <Link to="/stays" className="flex items-center gap-1.5 text-sm font-bold text-violet-700 transition hover:text-violet-900">
                  See all stays <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div key={stays.length} className="tile-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {loadingStays && stays.length === 0
                  ? [0, 1, 2, 3, 4].map(i => <CardSkeleton key={i} />)
                  : stays.map(s => (
                      <MediaCard
                        key={s.id}
                        href={stayHref(s.slug)}
                        image={s.cover}
                        title={s.name}
                        place={s.place}
                        price={inr(s.price)}
                        priceSuffix=" /night"
                        rating={s.rating}
                        badge={s.category}
                      />
                    ))}
              </div>
            </>
          )}
        </section>

        {/* ═══ FOLD 3 — proof, then the ask ═══════════════════════════ */}
        <section className="mx-auto w-full max-w-[1500px] px-5 pb-12 pt-14 sm:px-8 lg:px-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Travellers on their trips</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-2 ring-1 ring-violet-200/70 backdrop-blur">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-slate-950">4.9</span>
              <span className="text-sm text-slate-500">from real travellers</span>
            </div>
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {testimonials.slice(0, 3).map((item, i) => (
              <figure key={i}
                className="flex w-[85%] shrink-0 snap-start flex-col rounded-2xl bg-white/80 p-4 ring-1 ring-violet-200/60 backdrop-blur sm:w-[55%] md:w-auto">
                <div className="mb-2 text-sm text-yellow-400">{"★".repeat(item.rating)}</div>
                <blockquote className="flex-1 text-sm leading-relaxed text-slate-700">{item.quote}</blockquote>
                <figcaption className="mt-3 flex items-center gap-3 border-t border-violet-100 pt-3">
                  {item.image
                    ? <img src={item.image} alt={item.author} loading="lazy" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                    : <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-violet-100 font-black text-violet-600">{(item.author || 'H').charAt(0)}</div>}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{item.author}</p>
                    <p className="truncate text-xs text-slate-400">{item.location}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="waitlist" className="mx-auto w-full max-w-[1500px] px-5 pb-12 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-violet-950">
            {offerImage && <img src={offerImage} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-950/95 via-violet-950/88 to-fuchsia-900/75 lg:from-violet-950/75 lg:via-violet-950/92 lg:to-violet-950/95" />

            <div className="relative grid gap-6 p-6 text-white sm:p-9 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:p-10">
              <div>
                <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                  Get new departures before they fill up
                </h2>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-violet-200">
                  Trips cap at twelve travellers, so seats go quickly. One short note when we
                  open a departure — nothing else.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl bg-white/10 p-6 text-center ring-1 ring-white/20 backdrop-blur">
                  <p className="text-xl font-black">You're on the list</p>
                  <p className="mt-1.5 text-sm text-violet-200">We'll write when we have something worth your attention.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input name="name" value={form.name} onChange={handleChange} required aria-label="Your name" placeholder="Your name"
                      className="rounded-full bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-fuchsia-400" />
                    <input name="email" value={form.email} onChange={handleChange} required type="email" aria-label="Email address" placeholder="Email address"
                      className="rounded-full bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-fuchsia-400" />
                    <input name="contact" value={form.contact} onChange={handleChange} type="tel" maxLength={10} aria-label="Phone number" placeholder="Phone (optional)"
                      className="rounded-full bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-fuchsia-400" />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button type="submit"
                      className="rounded-full bg-white px-7 py-3 text-base font-bold text-slate-950 shadow transition hover:-translate-y-0.5 cursor-pointer">
                      Join the list
                    </button>
                    <p className="text-sm text-violet-300">No spam. Unsubscribe any time.</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="relative mx-auto w-full max-w-[1500px] px-5 pb-8 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-violet-200/70 py-5 text-sm text-slate-500">
          <span><strong className="font-black text-slate-950">100+</strong> curated experiences</span>
          <span><strong className="font-black text-slate-950">4.9★</strong> average rating</span>
          <span><strong className="font-black text-slate-950">12</strong> travellers per group</span>
          <span><strong className="font-black text-slate-950">24/7</strong> trip support</span>
        </div>

        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-black text-slate-950">Hoppity</p>
            <p className="mt-1 text-xs text-slate-500">Discover Real Travel · India</p>
            <div className="mt-4 flex items-center gap-4">
              <a href="https://www.instagram.com/hoppity_in" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 transition hover:scale-110 hover:text-pink-500"><FaInstagram className="text-xl" /></a>
              <a href="https://www.linkedin.com/company/triffair/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 transition hover:scale-110 hover:text-blue-600"><FaLinkedin className="text-xl" /></a>
              <a href="https://www.facebook.com/Hoppityin" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 transition hover:scale-110 hover:text-blue-500"><FaFacebook className="text-xl" /></a>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">Explore</p>
            <nav className="mt-3 flex flex-col gap-2.5 text-sm text-slate-500">
              <Link to="/itineraries" className="transition hover:text-violet-700">All trips</Link>
              <Link to="/stays" className="transition hover:text-violet-700">Stays</Link>
              <Link to="/blog" className="transition hover:text-violet-700">Stories</Link>
              <Link to="/for-you" className="transition hover:text-violet-700">For you</Link>
            </nav>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">Company</p>
            <nav className="mt-3 flex flex-col gap-2.5 text-sm text-slate-500">
              <Link to="/about" className="transition hover:text-violet-700">About us</Link>
              <Link to="/contact" className="transition hover:text-violet-700">Contact</Link>
              <Link to="/privacy" className="transition hover:text-violet-700">Privacy policy</Link>
            </nav>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">Talk to us</p>
            <div className="mt-3 flex flex-col items-start gap-3 text-sm text-slate-500">
              <a href="mailto:sales@hoppity.in" className="transition hover:text-violet-700">sales@hoppity.in</a>
              <a href="https://wa.me/919752377323" target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 ring-1 ring-green-200 transition hover:bg-green-100">
                💬 WhatsApp us
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-violet-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-xs font-medium text-slate-400">Recognised by</span>
            <div className="flex items-center gap-4">
              <img src={dpiitlogo} alt="DPIIT - Department for Promotion of Industry and Internal Trade" className="h-8 w-auto object-contain" />
              <img src={startuplogo} alt="Startup India" className="h-7 w-auto object-contain" />
            </div>
          </div>
          <p className="text-xs text-slate-400">© 2026 Hoppity (Triffair). All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}