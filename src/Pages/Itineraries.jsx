import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, Star, ChevronDown, Check, SlidersHorizontal, X } from "lucide-react"
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

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading journeys…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      <style>{`
        @keyframes tripsIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        .trips-grid > * { animation: tripsIn 180ms ease-out both; }
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-4px) scale(.98); }
          to   { opacity: 1; transform: none; }
        }
        .filter-pop { animation: popIn 120ms ease-out both; transform-origin: top right; }
        @media (prefers-reduced-motion: reduce) {
          .trips-grid > *, .filter-pop { animation: none; }
        }
      `}</style>

      <div className="px-6 pt-24 pb-16 lg:px-10">
        <div className="max-w-7xl mx-auto mb-6">
          <Link to="/"
            aria-label="Back to home"
            title="Back to home"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#f7f1ff]">
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Back to home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            All Journeys
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Every trip here is designed to be remembered, not just completed.
          </p>
        </div>

        {/* One-line control bar: count on the left, filter dropdown on the right */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 mb-6">
          <p className="text-sm text-slate-400">
            {filtered.length} journey{filtered.length !== 1 ? 's' : ''}
          </p>
          <CategoryFilter
            categories={categories}
            value={filter}
            onChange={setFilter}
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{CAT_EMOJI[filter] || '🗺️'}</div>
            <h3 className="text-xl font-bold text-slate-900">Nothing here yet</h3>
            <p className="text-slate-500 mt-2">Check back soon — more are being added.</p>
            <button onClick={() => setFilter('all')}
              className="mt-4 text-violet-600 text-sm font-semibold hover:underline cursor-pointer">
              See all journeys →
            </button>
          </div>
        ) : (
          <div key={filter} className="trips-grid max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Compact category dropdown ──────────────────────────────────────────
  Replaces the 8-chip row. Collapses to a single pill that names the
  active filter; the options live in a popover so they cost no page height.
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
      {/* Clear button, only once something is actually filtered */}
      {isFiltered && (
        <button onClick={() => pick('all')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer">
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border-2 pl-4 pr-3 py-2 text-sm font-semibold transition cursor-pointer ${
          isFiltered
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:text-violet-700'
        }`}>
        {isFiltered
          ? <span>{CAT_EMOJI[active.key] ? `${CAT_EMOJI[active.key]} ` : ''}{active.label}</span>
          : <><SlidersHorizontal className="w-4 h-4" /><span>Filter</span></>}
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
          isFiltered ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
        }`}>{active.count}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="listbox"
          className="filter-pop absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-violet-100 shadow-xl shadow-violet-100/50 p-2 z-40 max-h-[70vh] overflow-y-auto">
          {categories.map(cat => {
            const selected = cat.key === value
            return (
              <button
                key={cat.key}
                role="option"
                aria-selected={selected}
                onClick={() => pick(cat.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer text-left ${
                  selected ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <span className="w-5 text-base flex-shrink-0">
                  {cat.key === 'all' ? '🗺️' : CAT_EMOJI[cat.key] || '•'}
                </span>
                <span className="flex-1 truncate">{cat.label}</span>
                <span className="text-xs font-bold text-slate-400">{cat.count}</span>
                {selected && <Check className="w-4 h-4 text-violet-700 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TripCard({ trip }) {
  const hasImage = !!trip.cover
  const primary = trip.categories?.[0]
  const gradient = CAT_GRADIENTS[primary] || 'from-violet-700 to-purple-900'
  const emoji = CAT_EMOJI[primary] || '🗺️'
  const duration = trip.duration_display || trip.duration || ''
  const price = trip.price_per_person
    ? `₹${Number(trip.price_per_person).toLocaleString('en-IN')}`
    : trip.price || 'On Request'

  return (
    <Link to={`/itinerary/${trip.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col">

      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-6xl opacity-40">{emoji}</span>
        </div>

        {hasImage && (
          <img
            src={trip.cover}
            alt={trip.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-110"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {trip.tag && (
          <div className="absolute top-4 left-4">
            <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {trip.tag}
            </span>
          </div>
        )}

        {trip.rating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">{Number(trip.rating).toFixed(1)}</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          {trip.location && (
            <p className="text-xs uppercase tracking-[0.15em] text-violet-200 truncate mb-1">
              {trip.location}
            </p>
          )}
          <h3 className="text-xl font-bold leading-snug text-white line-clamp-2">
            {trip.title}
          </h3>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-slate-500">{duration}</span>
          <span className="font-semibold text-violet-700">{price}</span>
        </div>

        {trip.blurb && (
          <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 flex-1">
            {trip.blurb}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 group-hover:text-violet-700 transition">
            Explore
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            Small-group feel
          </span>
        </div>
      </div>
    </Link>
  )
}