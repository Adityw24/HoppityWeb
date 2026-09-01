import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, Star, ChevronDown, Check, SlidersHorizontal, X, MapPin, Clock } from "lucide-react"
import { useEffect, useState, useMemo, useRef } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

// Same extension test the rest of the app uses (TripDetails, MediaUpload,
// the app home-screen carousel) so a URL is classified as video everywhere.
const VIDEO_RE = /\.(mp4|mov|webm|m4v|avi|mkv|ogv|3gp)(\?|#|$)/i
const isVideo = (url) => VIDEO_RE.test(String(url || ''))

function normalise(row) {
  const media = row.images?.length
    ? row.images.filter(Boolean)
    : row.cover_image_url
      ? [row.cover_image_url]
      : []
  return {
    ...row,
    image: media,
    // First still image for the card — skips a video sitting at images[0],
    // then falls back to cover_image_url so a video-only gallery still gets a poster.
    cover: media.find(u => !isVideo(u)) || row.cover_image_url || null,
    cityStops: row.city_stops || [],
    itinerary: row.itinerary_days || [],
    // Normalised to a lowercase array. Handles "Cultural", " cultural ",
    // "Cultural, Heritage", ["Cultural","Heritage"].
    categories: toCategoryList(row.category),
  }
}

function toCategoryList(raw) {
  if (!raw) return []
  const parts = Array.isArray(raw) ? raw : String(raw).split(',')
  return parts.map(c => String(c).trim().toLowerCase()).filter(Boolean)
}

// Canonical display order. Anything outside this list still shows — appended,
// so a new category in the DB never silently disappears from the filter.
const CANONICAL = ['Cultural', 'Wildlife', 'Adventure', 'Trekking', 'Heritage', 'Spiritual', 'Culinary']

const CAT_GRADIENTS = {
  cultural:   'from-amber-700 to-orange-900',
  wildlife:   'from-green-700 to-emerald-900',
  adventure:  'from-blue-700 to-indigo-900',
  trekking:   'from-slate-600 to-slate-900',
  heritage:   'from-rose-700 to-red-900',
  spiritual:  'from-violet-700 to-purple-900',
  culinary:   'from-yellow-600 to-amber-800',
}
const CAT_EMOJI = {
  cultural: '🏛️', wildlife: '🐘', adventure: '🏄', trekking: '🥾',
  heritage: '🕌', spiritual: '🕉️', culinary: '🍛',
}

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const inr = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `₹${n.toLocaleString('en-IN')}` : null
}

export default function Itineraries() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')   // lowercase key; 'all' = no filter

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title: 'All Itineraries – Curated India Travel Experiences',
      description: 'Browse Hoppity\'s full catalogue of curated India travel experiences — tribal Northeast India, Ladakh expeditions, wildlife safaris, heritage trails, spiritual journeys, and more.',
      canonical: '/itineraries',
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    supabase
      .from("Itineraries")
      .select("id,slug,title,location,state,duration,duration_display,price,price_per_person,tag,category,blurb,cover_image_url,images,is_active,rating,review_count")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Itineraries fetch error:', error)
        setTrips((data || []).map(normalise))
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Itineraries fetch failed:', err)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Categories built FROM the data, so a filter option always has cards behind it.
  const categories = useMemo(() => {
    const counts = new Map()
    for (const t of trips) {
      for (const c of t.categories) counts.set(c, (counts.get(c) || 0) + 1)
    }
    const canonical = CANONICAL.map(c => c.toLowerCase()).filter(c => counts.has(c))
    const extras = [...counts.keys()].filter(c => !canonical.includes(c)).sort()

    return [
      { key: 'all', label: 'All journeys', count: trips.length },
      ...[...canonical, ...extras].map(c => ({ key: c, label: titleCase(c), count: counts.get(c) })),
    ]
  }, [trips])

  const filtered = useMemo(() => {
    if (filter === 'all') return trips
    return trips.filter(t => t.categories.includes(filter))
  }, [trips, filter])

  return (
    /* One continuous surface, same as the home and search pages */
    <div className="relative min-h-screen bg-[#f7f1ff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(124,58,237,0.12),transparent_70%)]" />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-1/3 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(217,70,239,0.07),transparent_70%)]" />

      <Navbar />

      <style>{`
        @keyframes tripsIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .trips-grid > * { animation: tripsIn 220ms ease-out both; }
        .trips-grid > *:nth-child(2) { animation-delay: 30ms }
        .trips-grid > *:nth-child(3) { animation-delay: 60ms }
        .trips-grid > *:nth-child(4) { animation-delay: 90ms }
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-4px) scale(.98); }
          to   { opacity: 1; transform: none; }
        }
        .filter-pop { animation: popIn 120ms ease-out both; transform-origin: top right; }
        @media (prefers-reduced-motion: reduce) {
          .trips-grid > *, .filter-pop { animation: none; }
        }
      `}</style>

      <main className="relative mx-auto w-full max-w-[1500px] px-5 pb-20 pt-24 sm:px-8 lg:px-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Link to="/"
              aria-label="Back to home"
              className="mb-5 inline-grid h-11 w-11 place-items-center rounded-full bg-white/50 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white/80 hover:text-violet-700">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              All journeys
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
              Every trip here is designed to be remembered, not just completed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!loading && (
              <p className="hidden text-sm text-slate-400 sm:block">
                {filtered.length} journey{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
            <CategoryFilter categories={categories} value={filter} onChange={setFilter} />
          </div>
        </div>

        {/* ── Grid ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-[1.5rem] bg-white/50 ring-1 ring-violet-200/50">
                <div className="aspect-[4/3] w-full bg-violet-200/50" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/3 rounded bg-violet-200/50" />
                  <div className="h-3 w-full rounded bg-violet-100/70" />
                  <div className="h-3 w-2/3 rounded bg-violet-100/70" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-md py-24 text-center">
            <div className="mb-4 text-5xl">{CAT_EMOJI[filter] || '🗺️'}</div>
            <h3 className="text-xl font-bold text-slate-900">Nothing here yet</h3>
            <p className="mt-2 text-sm text-slate-500">More journeys are being added to this category.</p>
            <button onClick={() => setFilter('all')}
              className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 cursor-pointer">
              See all journeys
            </button>
          </div>
        ) : (
          <div key={filter} className="trips-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </main>
    </div>
  )
}

/* ── Compact category dropdown ──────────────────────────────────────────
  A single pill that names the active filter; the options live in a popover
  so they cost no page height.
--------------------------------------------------------------------- */
function CategoryFilter({ categories, value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const active = categories.find(c => c.key === value) || categories[0]
  const isFiltered = value !== 'all'

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey  = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (key) => { onChange(key); setOpen(false) }

  return (
    <div className="relative flex items-center gap-2" ref={wrapRef}>
      {isFiltered && (
        <button onClick={() => pick('all')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-700 cursor-pointer">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full py-2 pl-4 pr-3 text-sm font-semibold transition cursor-pointer ${
          isFiltered
            ? 'bg-slate-950 text-white shadow-md'
            : 'bg-white/60 text-slate-700 ring-1 ring-violet-200/70 backdrop-blur hover:bg-white/90 hover:text-violet-800'
        }`}>
        {isFiltered
          ? <span>{CAT_EMOJI[active.key] ? `${CAT_EMOJI[active.key]} ` : ''}{active.label}</span>
          : <><SlidersHorizontal className="h-4 w-4" /><span>Filter</span></>}
        <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
          isFiltered ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'
        }`}>{active.count}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="listbox"
          className="filter-pop absolute right-0 top-full z-40 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-2xl bg-white/90 p-2 shadow-xl shadow-violet-950/10 ring-1 ring-violet-200/70 backdrop-blur-xl">
          {categories.map(cat => {
            const selected = cat.key === value
            return (
              <button
                key={cat.key}
                role="option"
                aria-selected={selected}
                onClick={() => pick(cat.key)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition cursor-pointer ${
                  selected ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-violet-50'
                }`}>
                <span className="w-5 flex-shrink-0 text-base">
                  {cat.key === 'all' ? '🗺️' : CAT_EMOJI[cat.key] || '•'}
                </span>
                <span className="flex-1 truncate">{cat.label}</span>
                <span className="text-xs font-bold text-slate-400">{cat.count}</span>
                {selected && <Check className="h-4 w-4 flex-shrink-0 text-violet-700" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Trip card — photo carries the name, glass strip carries the facts ── */
function TripCard({ trip }) {
  const [imgFailed, setImgFailed] = useState(false)
  const primary = trip.categories?.[0]
  const gradient = CAT_GRADIENTS[primary] || 'from-violet-700 to-purple-900'
  const emoji = CAT_EMOJI[primary] || '🗺️'
  const duration = trip.duration_display || trip.duration || ''
  const price = inr(trip.price_per_person) || inr(trip.price)
  const showImage = trip.cover && !imgFailed

  return (
    <Link to={`/itinerary/${trip.slug}`}
      className="group flex flex-col overflow-hidden rounded-[1.5rem] bg-white/70 ring-1 ring-violet-200/60 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-xl hover:shadow-violet-950/10 cursor-pointer">

      <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden">
        <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradient}`}>
          <span className="text-6xl opacity-40">{emoji}</span>
        </div>

        {showImage && (
          <img
            src={trip.cover}
            alt={trip.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {trip.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
            {trip.tag}
          </span>
        )}

        {trip.rating > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
            {Number(trip.rating).toFixed(1)}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          {trip.location && (
            <p className="mb-1 flex items-center gap-1 text-[11px] font-medium text-white/75">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{trip.location}</span>
            </p>
          )}
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-white">
            {trip.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          {duration
            ? <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-violet-500" />{duration}
              </span>
            : <span />}
          <span className="text-sm font-black text-slate-950">
            {price || 'On request'}
            {price && <span className="text-[11px] font-medium text-slate-400"> / person</span>}
          </span>
        </div>

        {trip.blurb && (
          <p className="mt-2.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
            {trip.blurb}
          </p>
        )}

        <div className="mt-3 flex items-center gap-1.5 border-t border-violet-100 pt-3 text-xs font-bold text-violet-700">
          Explore this trip
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}