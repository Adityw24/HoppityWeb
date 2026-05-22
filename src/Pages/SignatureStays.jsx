import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, Star, Search, X, MapPin, Clock, Wifi, Coffee, Flame, Anchor, Utensils, Shield, Users, Waves } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(row) {
  return {
    ...row,
    image: row.images?.length
      ? row.images.filter(Boolean)
      : row.cover_image_url
        ? [row.cover_image_url]
        : [],
  }
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_STAYS = [
  {
    id: 's1',
    slug: 'tiger-trail-lodge-corbett',
    title: 'Tiger Trail Lodge',
    location: 'Jim Corbett, Uttarakhand',
    duration: '2 nights',
    duration_display: 'Per night',
    price_per_person: 14500,
    tag: 'Jungle Lodge',
    blurb: 'A boutique jungle retreat on the edge of Corbett buffer zone. Morning safari, candlelit dining, and elephants in the wild.',
    image: ['https://images.unsplash.com/photo-1549366021-9f761d450615?w=800&q=80'],
    rating: 4.9,
    review_count: 67,
    amenities: ['Safari', 'Pool', 'Fine Dining', 'Bonfire', 'Spa'],
    is_dummy: true,
  },
  {
    id: 's2',
    slug: 'suryagarh-palace-jaisalmer',
    title: 'Suryagarh Palace',
    location: 'Jaisalmer, Rajasthan',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 22000,
    tag: 'Heritage Hotel',
    blurb: 'A modern fortress-hotel sculpted from golden Jaisalmer sandstone. Desert dunes at your doorstep, royal-to-the-bone hospitality.',
    image: ['https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80'],
    rating: 4.9,
    review_count: 142,
    amenities: ['Pool', 'Spa', 'Cultural shows', 'Fine Dining', 'Desert safari'],
    is_dummy: true,
  },
  {
    id: 's3',
    slug: 'windermere-estate-munnar',
    title: 'Windermere Estate',
    location: 'Munnar, Kerala',
    duration: '2 nights',
    duration_display: 'Per night',
    price_per_person: 9800,
    tag: 'Estate Stay',
    blurb: "A planter's bungalow inside a working tea estate. Morning mist over endless green, estate tours, and colonial-era charm.",
    image: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'],
    rating: 4.8,
    review_count: 88,
    amenities: ['Tea tours', 'Pool', 'Bonfire', 'Home-cooked meals', 'Wifi'],
    is_dummy: true,
  },
  {
    id: 's4',
    slug: 'kodai-treehouse-kodaikanal',
    title: 'The Kodai Treehouse',
    location: 'Kodaikanal, Tamil Nadu',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 8500,
    tag: 'Treehouse',
    blurb: 'Sleep among the clouds in a hand-crafted eucalyptus treehouse. Panoramic valley views, no screens, total disconnection.',
    image: ['https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80'],
    rating: 4.7,
    review_count: 54,
    amenities: ['Valley views', 'Meals', 'Nature walks', 'Bonfire'],
    is_dummy: true,
  },
  {
    id: 's5',
    slug: 'barefoot-havelock-andaman',
    title: 'Barefoot at Havelock',
    location: 'Havelock Island, Andaman',
    duration: '2 nights',
    duration_display: 'Per night',
    price_per_person: 18000,
    tag: 'Beach Villa',
    blurb: "Pristine beach cottages on Radhanagar — Asia's finest beach. Snorkelling, bioluminescent nights, silence like nowhere else.",
    image: ['https://images.unsplash.com/photo-1540202404-d0c7fe46a1b6?w=800&q=80'],
    rating: 4.9,
    review_count: 213,
    amenities: ['Snorkelling', 'Beach access', 'Spa', 'All meals', 'Water sports'],
    is_dummy: true,
  },
  {
    id: 's6',
    slug: 'nimmu-house-ladakh',
    title: 'Nimmu House',
    location: 'Nimmu, Ladakh',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 12000,
    tag: 'Heritage Stay',
    blurb: 'A 200-year-old royal residence in the Indus Valley. Stone walls, silk duvets, and the Zanskar confluence 5 min away.',
    image: ['https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=800&q=80'],
    rating: 4.8,
    review_count: 91,
    amenities: ['River views', 'All meals', 'Excursions', 'Wifi', 'Bonfire'],
    is_dummy: true,
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATION_ALL = 'All Locations'

const TAG_GRADIENTS = {
  Treehouse:      'from-green-700 to-emerald-900',
  Haveli:         'from-amber-700 to-orange-900',
  Cottage:        'from-slate-600 to-slate-800',
  Resort:         'from-violet-700 to-purple-900',
  Homestay:       'from-teal-600 to-teal-900',
  Camp:           'from-stone-600 to-stone-900',
  'Jungle Lodge': 'from-emerald-800 to-green-950',
  'Heritage Hotel':'from-amber-700 to-orange-900',
  'Estate Stay':  'from-lime-700 to-green-900',
  'Beach Villa':  'from-cyan-600 to-blue-900',
  'Heritage Stay':'from-indigo-700 to-slate-900',
}
const DEFAULT_GRADIENT = 'from-violet-700 to-purple-900'

const AMENITY_ICONS = {
  'Wifi': Wifi,
  'Cafe': Coffee,
  'Bonfire': Flame,
  'Pool': Waves,
  'Spa': Shield,
  'Safari': MapPin,
  'Snorkelling': Anchor,
  'All meals': Utensils,
  'Home-cooked meals': Utensils,
  'Meals': Utensils,
  'Fine Dining': Utensils,
  'Tea tours': Coffee,
  'Beach access': Anchor,
  'Water sports': Anchor,
  'Valley views': MapPin,
  'River views': MapPin,
  'Nature walks': MapPin,
  'Excursions': MapPin,
  'Cultural shows': Users,
  'Desert safari': MapPin,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignatureStaysPage() {
  const [stays, setStays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeLocation, setActiveLocation] = useState(LOCATION_ALL)
  const [locations, setLocations] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title: 'Signature Stays – Boutique Handpicked Properties | Hoppity',
      description: "Handpicked boutique properties with soul — treehouses, heritage havelis, hilltop cottages. Curated by Hoppity.",
      canonical: '/stays/signature',
    })

    supabase
      .from('Itineraries')
      .select('id,slug,title,location,duration,duration_display,price,price_per_person,tag,category,blurb,cover_image_url,images,is_active,rating,review_count')
      .eq('is_active', true)
      .eq('stay_category', 'signature')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Signature stays fetch error:', error)
        const normalised = (data || []).map(normalise)
        setStays(normalised)
        const locs = [...new Set(normalised.map(s => s.location).filter(Boolean))]
        setLocations(locs)
        setLoading(false)
      })
      .catch(err => {
        console.error('Signature stays fetch failed:', err)
        setLoading(false)
      })
  }, [])

  // Fall back to dummy cards while DB is empty
  const displayStays = stays.length > 0 ? stays : DUMMY_STAYS

  // Build location list from whichever source is active
  const displayLocations = stays.length > 0
    ? locations
    : [...new Set(DUMMY_STAYS.map(s => s.location).filter(Boolean))]

  const filtered = displayStays.filter(s => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      s.title?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.blurb?.toLowerCase().includes(q)
    const matchLocation = activeLocation === LOCATION_ALL || s.location === activeLocation
    return matchSearch && matchLocation
  })

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading stays…</p>
      </div>
    </div>
  )

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
            {[`${displayStays.length} properties`, 'Personally curated', 'Small & boutique only'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 inline-block" />{t}
              </span>
            ))}
          </div>

          {/* Dummy notice — disappears once DB is live */}
          {stays.length === 0 && !loading && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
              Showing sample properties — connect your database to display live listings
            </div>
          )}
        </div>

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
        {displayLocations.length > 0 && (
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2 mb-6">
            {[LOCATION_ALL, ...displayLocations].map(loc => (
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

        {/* Grid */}
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
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function SignatureStayCard({ stay, tagGradients, defaultGradient }) {
  const hasImage = stay.image?.length > 0 && stay.image[0]
  const gradient = tagGradients[stay.tag] || defaultGradient
  const duration = stay.duration_display || stay.duration || ''
  const price = stay.price_per_person
    ? `₹${Number(stay.price_per_person).toLocaleString('en-IN')}`
    : stay.price || 'On Request'
  const isTopRated = Number(stay.rating) >= 4.9

  return (
    <Link
      to={`/stays/signature/${stay.slug}`}
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
            {stay.review_count && (
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

        {/* Price + duration */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration}</span>
          </div>
          <div>
            <span className="font-black text-amber-700 text-base">{price}</span>
            <span className="text-xs text-slate-400 ml-1">/ person</span>
          </div>
        </div>

        {/* Blurb */}
        {stay.blurb && (
          <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 flex-1 mb-4">
            {stay.blurb}
          </p>
        )}

        {/* Amenity chips */}
        {stay.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {stay.amenities.slice(0, 3).map(a => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={a} className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs text-amber-800">
                  {Icon && <Icon className="w-3 h-3" />}
                  {a}
                </span>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
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