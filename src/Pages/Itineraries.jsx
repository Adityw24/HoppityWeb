import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

function normalise(row) {
  return {
    ...row,
    image: row.images?.length
      ? row.images.filter(Boolean)
      : row.cover_image_url
        ? [row.cover_image_url]
        : [],
    cityStops: row.city_stops || [],
    itinerary: row.itinerary_days || [],
  }
}

// Category → gradient fallback when no photo exists
const CAT_GRADIENTS = {
  Cultural:   'from-amber-700 to-orange-900',
  Wildlife:   'from-green-700 to-emerald-900',
  Adventure:  'from-blue-700 to-indigo-900',
  Trekking:   'from-slate-600 to-slate-900',
  Heritage:   'from-rose-700 to-red-900',
  Spiritual:  'from-violet-700 to-purple-900',
  Culinary:   'from-yellow-600 to-amber-800',
}
const CAT_EMOJI = {
  Cultural: '🏛️', Wildlife: '🐘', Adventure: '🏄', Trekking: '🥾',
  Heritage: '🕌', Spiritual: '🕉️', Culinary: '🍛',
}

export default function Itineraries() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  const CATEGORIES = ['All', 'Cultural', 'Wildlife', 'Adventure', 'Trekking', 'Heritage', 'Spiritual', 'Culinary']

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title: 'All Itineraries – Curated India Travel Experiences',
      description: 'Browse Hoppity\'s full catalogue of curated India travel experiences — tribal Northeast India, Ladakh expeditions, wildlife safaris, heritage trails, spiritual journeys, and more.',
      canonical: '/itineraries',
    })
    supabase
      .from("Itineraries")
      .select("id,slug,title,location,state,duration,duration_display,price,price_per_person,tag,category,blurb,cover_image_url,images,is_active,rating,review_count")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .then(({ data }) => {
        setTrips((data || []).map(normalise))
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'All' ? trips : trips.filter(t => t.category === filter)

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
      <div className="px-6 pt-24 pb-16 lg:px-10">

        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-10">
          <Link to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 mb-5 transition">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            All Journeys
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Every trip here is designed to be remembered, not just completed.
          </p>
        </div>

        {/* Category filter */}
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer border-2 ${
                filter === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
              }`}>
              {cat !== 'All' && CAT_EMOJI[cat] ? `${CAT_EMOJI[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="max-w-7xl mx-auto text-sm text-slate-400 mb-5 px-1">
          {filtered.length} journey{filtered.length !== 1 ? 's' : ''}
          {filter !== 'All' && ` in ${filter}`}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{CAT_EMOJI[filter] || '🗺️'}</div>
            <h3 className="text-xl font-bold text-slate-900">No {filter} journeys yet</h3>
            <p className="text-slate-500 mt-2">Check back soon — more are being added.</p>
            <button onClick={() => setFilter('All')}
              className="mt-4 text-violet-600 text-sm font-semibold hover:underline cursor-pointer">
              See all journeys →
            </button>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(trip => (
              <TripCard key={trip.slug} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip }) {
  const hasImage = trip.image?.length > 0 && trip.image[0]
  const gradient = CAT_GRADIENTS[trip.category] || 'from-violet-700 to-purple-900'
  const emoji = CAT_EMOJI[trip.category] || '🗺️'
  const duration = trip.duration_display || trip.duration || ''
  const price = trip.price_per_person
    ? `₹${Number(trip.price_per_person).toLocaleString('en-IN')}`
    : trip.price || 'On Request'

  return (
    <Link to={`/itinerary/${trip.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col">

      {/* Image area */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">

        {/* Gradient fallback — always the base layer */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-6xl opacity-40">{emoji}</span>
        </div>

        {/* Photo on top — hides itself if URL broken or missing */}
        {hasImage && (
          <img
            src={trip.image[0]}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-110"
            onError={e => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* Tag pill — top left */}
        {trip.tag && (
          <div className="absolute top-4 left-4">
            <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {trip.tag}
            </span>
          </div>
        )}

        {/* Rating — top right */}
        {trip.rating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">{Number(trip.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Location + Title — bottom of image */}
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

      {/* Card body */}
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
