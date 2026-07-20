import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, Star, Search, X, MapPin, Wifi, Coffee, Flame, Anchor, Utensils, Shield, Users, Waves } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATION_ALL = 'All Locations'

const TAG_GRADIENTS = {
  Treehouse:        'from-green-700 to-emerald-900',
  Haveli:           'from-amber-700 to-orange-900',
  Cottage:          'from-slate-600 to-slate-800',
  Resort:           'from-violet-700 to-purple-900',
  Homestay:         'from-teal-600 to-teal-900',
  Camp:             'from-stone-600 to-stone-900',
  'Jungle Lodge':   'from-emerald-800 to-green-950',
  'Heritage Hotel': 'from-amber-700 to-orange-900',
  'Estate Stay':    'from-lime-700 to-green-900',
  'Beach Villa':    'from-cyan-600 to-blue-900',
  'Heritage Stay':  'from-indigo-700 to-slate-900',
  'Hotel':          'from-violet-700 to-purple-900',
  'Hostel':         'from-teal-600 to-teal-900',
  'Guesthouse':     'from-slate-600 to-slate-800',
  'Villa':          'from-cyan-600 to-blue-900',
  'Eco Lodge':      'from-green-700 to-emerald-900',
  'Boutique Hotel': 'from-violet-700 to-purple-900',
  'Jungle Stay':    'from-emerald-800 to-green-950',
  'Palace':         'from-amber-700 to-orange-900',
  'Tent / Glamping':'from-stone-600 to-stone-900',
}
const DEFAULT_GRADIENT = 'from-violet-700 to-purple-900'

const AMENITY_ICONS = {
  'Wifi':               Wifi,
  'Cafe':               Coffee,
  'Bonfire':            Flame,
  'Pool':               Waves,
  'Spa':                Shield,
  'Safari':             MapPin,
  'Snorkelling':        Anchor,
  'All meals':          Utensils,
  'Home-cooked meals':  Utensils,
  'Meals':              Utensils,
  'Fine Dining':        Utensils,
  'Breakfast':          Coffee,
  'Tea tours':          Coffee,
  'Beach access':       Anchor,
  'Water sports':       Anchor,
  'Dive centre':        Anchor,
  'Valley views':       MapPin,
  'River views':        MapPin,
  'Nature walks':       MapPin,
  'Excursions':         MapPin,
  'Heritage tour':      Users,
  'Cultural shows':     Users,
  'Desert safari':      MapPin,
  'Airport transfer':   MapPin,
  'Rooftop bar':        Utensils,
  'Gym':                Shield,
  'Library':            Shield,
  'Pet friendly':       Users,
}

// ─── Image collection helper ───────────────────────────────────────────────────
// Parse cover_image_url + images_url (array / JSON string / comma list / single URL)
// into a clean de-duplicated array.

function collectImages(row) {
  const out = []
  if (row.cover_image_url) out.push(row.cover_image_url)

  const pushFrom = (val) => {
    if (!val) return
    if (Array.isArray(val)) { out.push(...val); return }
    if (typeof val !== 'string') return
    const trimmed = val.trim()
    if (!trimmed) return
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) { out.push(...parsed.filter(Boolean)); return }
      } catch { /* fall through */ }
    }
    const inner = trimmed.startsWith('[') && trimmed.endsWith(']')
      ? trimmed.slice(1, -1)
      : trimmed
    out.push(...inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean))
  }

  pushFrom(row.images_url)
  pushFrom(row.images)
  return [...new Set(out.filter(Boolean))]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignatureStaysPage() {
  const [stays,          setStays]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [fetchError,     setFetchError]     = useState(null)
  const [search,         setSearch]         = useState('')
  const [activeLocation, setActiveLocation] = useState(LOCATION_ALL)
  const [locations,      setLocations]      = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title:       'Signature Stays – Boutique Handpicked Properties | Hoppity',
      description: 'Handpicked boutique properties with soul — treehouses, heritage havelis, hilltop cottages. Curated by Hoppity.',
      canonical:   '/stays/signature',
    })

    supabase
      .from('Properties')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Signature stays fetch error:', error)
          setFetchError(error.message)
          setLoading(false)
          return
        }

        // Some records use different casing or field names for the category, so
        // we normalize them client-side instead of relying on a single exact match.
        const normalised = (data || [])
          .filter(row => {
            const category = String(row.property_category || row.property_type || row.category || '')
              .trim()
              .toLowerCase()
            return category === 'signature' || category.includes('signature')
          })
          .map(row => ({
            id:               row.id,
            title:            row.name,
            slug:             row.slug,
            location:         row.location,
            tag:              row.property_type,
            price_per_person: row.price_per_night,
            duration_display: 'Per night',
            blurb:            row.description,
            amenities:        Array.isArray(row.amenities) ? row.amenities : [],
            rating:           row.rating       || 0,
            review_count:     row.review_count || 0,
            image:            collectImages(row),
          }))

        setStays(normalised)
        const locs = [...new Set(normalised.map(s => s.location).filter(Boolean))]
        setLocations(locs)
        setLoading(false)
      })
      .catch(err => {
        console.error('Signature stays fetch failed:', err)
        setFetchError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = stays.filter(s => {
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      s.title?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.blurb?.toLowerCase().includes(q)
    const matchLocation = activeLocation === LOCATION_ALL || s.location === activeLocation
    return matchSearch && matchLocation
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading stays…</p>
      </div>
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (fetchError) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 font-semibold mb-2">Failed to load stays</p>
        <p className="text-slate-500 text-sm font-mono">{fetchError}</p>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="px-6 pt-24 pb-16 lg:px-10">

        {/* Back button */}
        <div className="max-w-7xl mx-auto mb-6">
          <Link to="/"
            aria-label="Back to home"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#f7f1ff]">
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Back to home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-semibold text-violet-800 shadow-sm mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600 inline-block" />
            Boutique · Handpicked
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            Signature Stays
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Properties with soul — treehouses, heritage havelis, hilltop cottages. Every stay chosen for its character.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 mt-5">
            {[`${stays.length} ${stays.length === 1 ? 'property' : 'properties'}`, 'Personally curated', 'Small & boutique only'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 inline-block" />{t}
              </span>
            ))}
          </div>
        </div>

        {/* Empty state — no properties in DB yet */}
        {stays.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏡</div>
            <h3 className="text-xl font-bold text-slate-900">No signature stays yet</h3>
            <p className="text-slate-500 mt-2 text-sm">
              Properties marked as <strong>Signature</strong> and set to <strong>Live</strong> will appear here.
            </p>
          </div>
        )}

        {stays.length > 0 && (
          <>
            {/* Search bar */}
            <div className="max-w-7xl mx-auto mb-5">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or location…"
                  className="w-full bg-white rounded-2xl border border-violet-200 pl-10 pr-10 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Location filter chips */}
            {locations.length > 0 && (
              <div className="max-w-7xl mx-auto flex flex-wrap gap-2 mb-6">
                {[LOCATION_ALL, ...locations].map(loc => (
                  <button key={loc} onClick={() => setActiveLocation(loc)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer border-2 ${
                      activeLocation === loc
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
                    }`}>
                    {loc}
                  </button>
                ))}
              </div>
            )}

            {/* Results count */}
            <p className="max-w-7xl mx-auto text-sm text-slate-400 mb-5 px-1">
              {filtered.length} {filtered.length !== 1 ? 'properties' : 'property'}
              {activeLocation !== LOCATION_ALL && ` in ${activeLocation}`}
            </p>

            {/* No results from filter/search */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏡</div>
                <h3 className="text-xl font-bold text-slate-900">No stays found</h3>
                <p className="text-slate-500 mt-2">Try a different search or location filter.</p>
                {activeLocation !== LOCATION_ALL && (
                  <button onClick={() => setActiveLocation(LOCATION_ALL)}
                    className="mt-4 text-violet-600 text-sm font-semibold hover:underline cursor-pointer">
                    See all signature stays →
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map(stay => (
                  <SignatureStayCard
                    key={stay.id}
                    stay={stay}
                    tagGradients={TAG_GRADIENTS}
                    defaultGradient={DEFAULT_GRADIENT}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function SignatureStayCard({ stay, tagGradients, defaultGradient }) {
  const hasImage   = stay.image?.length > 0 && stay.image[0]
  const gradient   = tagGradients[stay.tag] || defaultGradient
  const price      = stay.price_per_person
    ? `₹${Number(stay.price_per_person).toLocaleString('en-IN')}`
    : 'On Request'
  const isTopRated = Number(stay.rating) >= 4.9

  return (
    <Link
      to={`/stays/${stay.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-100 cursor-pointer flex flex-col"
    >
      {/* Image area */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">

        {/* Gradient fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-6xl opacity-30">✦</span>
        </div>

        {/* Photo */}
        {hasImage && (
          <img
            src={stay.image[0]}
            alt={stay.title}
            className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Top left: tag + top rated badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
          {stay.tag && (
            <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {stay.tag}
            </span>
          )}
          {isTopRated && (
            <span className="inline-flex rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              ✦ Top Rated
            </span>
          )}
        </div>

        {/* Top right: rating */}
        {stay.rating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">{Number(stay.rating).toFixed(1)}</span>
            {stay.review_count > 0 && (
              <span className="text-[10px] text-white/60 ml-0.5">({stay.review_count})</span>
            )}
          </div>
        )}

        {/* Bottom: location + title */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {stay.location && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-violet-300 flex-shrink-0" />
              <p className="text-xs text-violet-200 truncate">{stay.location}</p>
            </div>
          )}
          <h3 className="text-xl font-bold leading-snug text-white line-clamp-2">
            {stay.title}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">

        {/* Price */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-violet-700 text-base">{price}</span>
            {stay.price_per_person > 0 && (
              <span className="text-xs text-slate-400">/ night</span>
            )}
          </div>
        </div>

        {/* Blurb */}
        {stay.blurb && (
          <p className="text-sm leading-relaxed text-gray-700 line-clamp-3 flex-1 mb-4">
            {stay.blurb}
          </p>
        )}

        {/* Amenity chips */}
        {stay.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {stay.amenities.slice(0, 3).map(a => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={a} className="flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs text-violet-800">
                  {Icon && <Icon className="w-3 h-3" />}
                  {a}
                </span>
              )
            })}
            {stay.amenities.length > 3 && (
              <span className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs text-slate-500">
                +{stay.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 group-hover:text-violet-700 transition">
            View property
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
          <span className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            ✦ Signature
          </span>
        </div>
      </div>
    </Link>
  )
}