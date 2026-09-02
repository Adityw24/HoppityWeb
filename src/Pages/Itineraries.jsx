import { Link } from "react-router-dom"
import { ArrowLeft, Star, ChevronDown, Check, SlidersHorizontal, X, MapPin } from "lucide-react"
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

// Canonical display order. Categories outside this list can still make the
// cut, but only if they beat a canonical one on trip count — the filter is
// capped so the popover stays scannable.
const CANONICAL = ['Cultural', 'Wildlife', 'Adventure', 'Trekking', 'Heritage', 'Spiritual', 'Culinary']
const MAX_FILTERS = 7          // plus "All journeys" = 8 options total

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
    // Anything not in CANONICAL still competes, biggest first.
    const extras = [...counts.keys()]
      .filter(c => !canonical.includes(c))
      .sort((a, b) => counts.get(b) - counts.get(a))

    // Keep the canonical order, then top up with extras, then cut to the cap
    // by dropping the thinnest categories — a filter with two trips behind it
    // is noise on a phone.
    const shortlist = [...canonical, ...extras]
    const kept = shortlist.length > MAX_FILTERS
      ? [...shortlist].sort((a, b) => counts.get(b) - counts.get(a)).slice(0, MAX_FILTERS)
      : shortlist
    const ordered = shortlist.filter(c => kept.includes(c))

    return [
      { key: 'all', label: 'All journeys', count: trips.length },
      ...ordered.map(c => ({ key: c, label: titleCase(c), count: counts.get(c) })),
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
              <ArrowLeft className="h-4 w-4 cursor-pointer" />
            </Link>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              All journeys
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
              Every trip here is designed to be remembered, not just completed.
            </p>
          </div>

          {/* Right-aligned on every width, including phones */}
          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            {!loading && (
              <p className="text-sm text-slate-400">
                {filtered.length} journey{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
            <CategoryFilter categories={categories} value={filter} onChange={setFilter} />
          </div>
        </div>

        {/* ── Grid ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-violet-200/40 sm:rounded-3xl" />
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
          <div key={filter} className="trips-grid grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
        <button onClick={() => pick('all')} aria-label="Clear filter"
          className="flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-slate-700 cursor-pointer sm:text-xs">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex max-w-[52vw] items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-xs font-semibold transition cursor-pointer sm:max-w-none sm:gap-2 sm:py-2 sm:pl-4 sm:pr-3 sm:text-sm ${
          isFiltered
            ? 'bg-slate-950 text-white shadow-md'
            : 'bg-white/60 text-slate-700 ring-1 ring-violet-200/70 backdrop-blur hover:bg-white/90 hover:text-violet-800'
        }`}>
        {isFiltered
          ? <span className="truncate">{CAT_EMOJI[active.key] ? `${CAT_EMOJI[active.key]} ` : ''}{active.label}</span>
          : <>
              <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
              <span>Filter</span>
            </>}
        <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition-transform sm:h-4 sm:w-4 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="listbox"
          className="filter-pop absolute right-0 top-full z-40 mt-2 max-h-[70vh] w-56 max-w-[calc(100vw-2.5rem)] overflow-y-auto sm:w-64 rounded-2xl bg-white/90 p-2 shadow-xl shadow-violet-950/10 ring-1 ring-violet-200/70 backdrop-blur-xl">
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

/* ── Trip card — the photograph IS the card, same as the search page.
   Category gradient + emoji stays as the fallback when a cover is missing
   or 404s, so a trip without artwork still reads as its category. ────── */
function TripCard({ trip }) {
  const [imgFailed, setImgFailed] = useState(false)
  const primary = trip.categories?.[0]
  const gradient = CAT_GRADIENTS[primary] || 'from-violet-700 to-purple-900'
  const emoji = CAT_EMOJI[primary] || '🗺️'
  const duration = trip.duration_display || trip.duration || ''
  const price = inr(trip.price_per_person) || inr(trip.price)
  const showImage = trip.cover && !imgFailed

  return (
    <Link
      to={`/itinerary/${trip.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-violet-200/40 ring-1 ring-violet-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:rounded-3xl"
    >
      <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradient}`}>
        <span className="text-5xl opacity-40 sm:text-6xl">{emoji}</span>
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {trip.tag && (
        <span className="absolute left-2 top-2 max-w-[60%] truncate rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
          {trip.tag}
        </span>
      )}

      {trip.rating > 0 && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm sm:right-3 sm:top-3 sm:py-1 sm:text-[11px]">
          <Star className="h-2.5 w-2.5 fill-yellow-300 text-yellow-300 sm:h-3 sm:w-3" />
          {Number(trip.rating).toFixed(1)}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p className="flex min-w-0 items-center gap-1 text-[10px] font-medium text-white/75 sm:text-[11px]">
          <MapPin className="h-2.5 w-2.5 flex-shrink-0 sm:h-3 sm:w-3" />
          <span className="truncate">{trip.location || 'India'}</span>
          {duration && <><span className="text-white/40">·</span><span className="truncate">{duration}</span></>}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[13px] font-bold leading-tight text-white sm:text-[15px] sm:leading-snug">
          {trip.title}
        </h3>
        <p className="mt-1.5 text-[13px] font-black text-white sm:mt-2 sm:text-sm">
          {price || 'On request'}
          {price && <span className="text-[10px] font-medium text-white/60 sm:text-[11px]"> / person</span>}
        </p>
      </div>
    </Link>
  )
}