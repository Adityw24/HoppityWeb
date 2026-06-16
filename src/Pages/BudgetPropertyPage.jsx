import { Link, useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ArrowLeft, Star, MapPin, Clock, Wifi, Coffee, Flame,
  Anchor, Utensils, Shield, Users, Phone, MessageCircle,
  ChevronLeft, ChevronRight, Check, Share2, Heart, Calendar,
  Info, Tag, Minus, Plus, ExternalLink
} from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

// ─── Amenity icons ────────────────────────────────────────────────────────────

const AMENITY_ICONS = {
  'Wifi': Wifi, 'Cafe': Coffee, 'Rooftop cafe': Coffee, 'Bonfire': Flame,
  'Beach access': Anchor, 'Breakfast': Coffee, 'Home-cooked meals': Utensils,
  'All meals': Utensils, 'Meals': Utensils, 'Fine Dining': Utensils,
  'Rafting included': Anchor, 'Lockers': Shield, 'Hot water': Shield,
  'Hot showers': Shield, 'Common room': Users, 'Laundry': Shield,
  'Garden': MapPin, 'Mountain views': MapPin, 'Sea-facing rooms': MapPin,
  'In-house cafe': Coffee, 'Hammocks': Shield, 'Tour desk': MapPin,
  'Oxygen cylinder': Shield, 'Volleyball': Users, 'Beach': Anchor,
  'Pool': Shield, 'Spa': Shield, 'AC': Shield, 'Parking': Shield,
  'Safari': MapPin, 'Nature walks': MapPin, 'Snorkelling': Anchor,
  'Dive centre': Anchor, 'Heritage tour': MapPin, 'Library': Shield,
  'Gym': Shield, 'Pet friendly': Users, 'Airport transfer': MapPin,
}

// ─── Image collection helper ───────────────────────────────────────────────────
// Gathers every available image into a single, de-duplicated array.
// Handles cover_image_url + images_url where images_url may be a real array,
// a JSON-encoded array string, an unquoted bracket string, a comma list, or a single URL.

function collectImages(data) {
  const out = []
  if (data.cover_image_url) out.push(data.cover_image_url)

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

  pushFrom(data.images_url)
  pushFrom(data.images)
  return [...new Set(out.filter(Boolean))]
}

// ─── Maps link helper ───────────────────────────────────────────────────────────

function isValidMapsLink(str) {
  if (!str?.trim()) return false
  try {
    const u = new URL(str.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

function buildMapsUrl(property) {
  if (isValidMapsLink(property.maps_url)) return property.maps_url.trim()
  const query = property.address
    || [property.title, property.location].filter(Boolean).join(', ')
    || property.location
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null
}

// ─── Time formatting helper ───────────────────────────────────────────────────
function formatTime(time) {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(hours, minutes)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Booking fee constants (MMT-style) ────────────────────────────────────────
const GST_RATE   = 0.12   // 12 % GST on accommodation
const HOPPITY_FEE_PER_BOOKING = 49  // flat convenience fee

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetPropertyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [property, setProperty]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [imgIndex, setImgIndex]   = useState(0)
  const [wishlist, setWishlist]   = useState(false)
  const [guests, setGuests]       = useState(1)
  const [nights, setNights]       = useState(1)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    supabase
      .from('Properties')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setProperty(null)
          setLoading(false)
          return
        }

        const norm = {
          ...data,
          title:             data.name,
          tag:               data.property_type,
          price_per_person:  data.price_per_night,
          duration_display:  'Per night',
          blurb:             data.description,
          description:       data.description,
          amenities:         Array.isArray(data.amenities) ? data.amenities : [],
          image:             collectImages(data),
          maps_url:          data.maps_url || null,
          checkin_time:      formatTime(data.checkin_time),
          checkout_time:     formatTime(data.checkout_time),
          rating:            data.rating       || 0,
          review_count:      data.review_count || 0,
          highlights:        data.highlights        || [],
          what_included:     data.what_included     || [],
          what_not_included: data.what_not_included || [],
          cancellation:      data.cancellation_policy || null,
        }

        setProperty(norm)
        setPageSEO({
          title:       `${data.name} – Budget Stay | Hoppity`,
          description: data.description,
          canonical:   `/stays/property/${slug}`,
        })
        setLoading(false)
      })
      .catch(() => { setProperty(null); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading property…</p>
      </div>
    </div>
  )

  if (!property) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🎒</p>
        <h2 className="text-xl font-bold text-slate-900">Property not found</h2>
        <p className="text-slate-500 mt-2 mb-6">This listing may have moved or been removed.</p>
        <Link to="/stays/budget"
          className="rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-violet-200 hover:shadow-xl transition">
          ← Back to Budget Stays
        </Link>
      </div>
    </div>
  )

  const images  = property.image?.length ? property.image : []
  const mapsUrl = buildMapsUrl(property)

  // ── Pricing math (MMT / Airbnb style) — base rate is per-person per-night ──
  const ratePerPersonPerNight = Number(property.price_per_person || 0)
  const accommodation         = ratePerPersonPerNight * guests * nights
  const gst                   = Math.round(accommodation * GST_RATE)
  const convenienceFee        = HOPPITY_FEE_PER_BOOKING
  const grandTotal            = accommodation + gst + convenienceFee

  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi! I'd like to book ${property.title} in ${property.location}.\n\n` +
      `Guests: ${guests}  |  Nights: ${nights}\n` +
      `Rate: ₹${ratePerPersonPerNight.toLocaleString('en-IN')} / person / night\n` +
      `Accommodation: ${fmt(accommodation)}\n` +
      `GST (12%): ${fmt(gst)}\n` +
      `Convenience fee: ${fmt(convenienceFee)}\n` +
      `Total: ${fmt(grandTotal)}\n\n` +
      `Please confirm availability and next steps.`
    )
    window.open(`https://wa.me/+919752377323?text=${msg}`, '_blank')
  }
  const handleCall = () => window.open('tel:+919752377323', '_self')

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="pt-20 pb-20">

        {/* ── Gallery ── */}
        <div className="relative w-full h-[55vh] min-h-[320px] max-h-[520px] overflow-hidden bg-slate-900 mt-4">
          {images.length > 0 ? (
            <img
              key={imgIndex}
              src={images[imgIndex]}
              alt={property.title}
              className="w-full h-full object-cover transition-opacity duration-500"
              onError={e => { e.currentTarget.style.opacity = '0' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-800 flex items-center justify-center">
              <span className="text-6xl opacity-20">✦</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />

          {images.length > 1 && (<>
            <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
              aria-label="Previous image"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setImgIndex(i => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
              aria-label="Next image"><ChevronRight className="w-5 h-5" /></button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === imgIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                  aria-label={`View image ${i + 1}`} />
              ))}
            </div>
          </>)}

          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-4 py-2 text-white text-sm font-medium hover:bg-black/60 transition cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
                onClick={() => navigator.share?.({ title: property.title, url: window.location.href })}
                aria-label="Share property"><Share2 className="w-4 h-4" /></button>
              <button onClick={() => setWishlist(w => !w)}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition ${wishlist ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
                aria-label="Save to wishlist"><Heart className={`w-4 h-4 ${wishlist ? 'fill-white' : ''}`} /></button>
            </div>
          </div>

          {/* Tag badges */}
          <div className="absolute bottom-12 left-5 flex items-center gap-2">
            {property.tag && (
              <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {property.tag}
              </span>
            )}
            <span className="inline-flex rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              🎒 Budget Stay
            </span>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── Left: Details ── */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-2">
                {property.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 mb-6">
                {property.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-violet-500" />
                    <span>{property.location}</span>
                  </div>
                )}
                {property.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-slate-800">{Number(property.rating).toFixed(1)}</span>
                    {property.review_count > 0 && <span className="text-slate-400">({property.review_count} reviews)</span>}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <span>{property.duration_display}</span>
                </div>
              </div>

              {mapsUrl && (
                <div className="flex items-center mb-6 -mt-2 gap-3">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-violet-200 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50 hover:border-violet-300 transition">
                    View on Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <hr className="border-slate-200 mb-6" />

              {/* Description */}
              {(property.description || property.blurb) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">About this property</h2>
                  <div className="text-slate-600 text-sm leading-[1.95] whitespace-pre-line">
                    {property.description || property.blurb}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {property.highlights?.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Highlights</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.highlights.map(h => (
                      <div key={h} className="flex items-start gap-2.5 rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-slate-700">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">What's available</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {property.amenities.map(a => {
                      const Icon = AMENITY_ICONS[a] || Shield
                      return (
                        <span key={a} className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                          <Icon className="w-4 h-4 text-violet-500" />{a}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Meals */}
              {property.meals_included && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Meals</h2>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
                    <Utensils className="w-4 h-4 flex-shrink-0" />{property.meals_included}
                  </div>
                </div>
              )}

              {/* Check-in / Check-out */}
              {(property.checkin_time || property.checkout_time) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Check-in & Check-out</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {property.checkin_time && (
                      <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
                        <p className="text-xs text-slate-400 mb-0.5">Check-in</p>
                        <p className="text-sm font-semibold text-slate-800">{property.checkin_time}</p>
                      </div>
                    )}
                    {property.checkout_time && (
                      <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
                        <p className="text-xs text-slate-400 mb-0.5">Check-out</p>
                        <p className="text-sm font-semibold text-slate-800">{property.checkout_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Included / Not included */}
              {(property.what_included?.length > 0 || property.what_not_included?.length > 0) && (
                <div className="mb-8 grid sm:grid-cols-2 gap-5">
                  {property.what_included?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </span>
                        Included
                      </h3>
                      <ul className="space-y-2">
                        {property.what_included.map(i => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {property.what_not_included?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                          <span className="text-rose-600 text-xs font-bold">✕</span>
                        </span>
                        Not included
                      </h3>
                      <ul className="space-y-2">
                        {property.what_not_included.map(i => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                            <span className="text-rose-400 flex-shrink-0 mt-0.5 text-xs">✕</span>{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation */}
              {property.cancellation && (
                <div className="mb-8 rounded-2xl bg-violet-50 border border-violet-200 px-5 py-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    Cancellation policy
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{property.cancellation}</p>
                </div>
              )}

              {/* Pet policy */}
              {property.pet_policy && (
                <div className="mb-8 rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Pet policy</h3>
                  <p className="text-sm text-slate-600">{property.pet_policy}</p>
                </div>
              )}

              {/* Address */}
              {property.address && (
                <div className="mb-8 rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />Address
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{property.address}</p>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white border border-violet-200 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50 hover:border-violet-300 transition">
                      <MapPin className="w-3.5 h-3.5" />
                      View on Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: Booking Sidebar ── */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="sticky top-24">
                <div className="rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50 overflow-hidden">

                  {/* Header strip */}
                  <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-4">
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-white">
                        {ratePerPersonPerNight > 0 ? fmt(ratePerPersonPerNight) : 'On Request'}
                      </span>
                      {ratePerPersonPerNight > 0 && (
                        <span className="text-violet-200 text-xs mb-1 font-medium">/ person / night</span>
                      )}
                    </div>
                    {property.rating > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        <span className="text-sm font-semibold text-white">{Number(property.rating).toFixed(1)}</span>
                        {property.review_count > 0 && <span className="text-xs text-violet-200">· {property.review_count} reviews</span>}
                      </div>
                    )}
                  </div>

                  <div className="p-6">

                    {/* ── Guest + Night selectors ── */}
                    <div className="space-y-3 mb-5">

                      {/* Guests */}
                      <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Guests</p>
                          <p className="text-xs text-slate-400">Adults</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setGuests(g => Math.max(1, g - 1))}
                            disabled={guests <= 1}
                            className="w-8 h-8 rounded-full border border-violet-200 bg-white flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white hover:border-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            aria-label="Remove guest"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-base font-bold text-slate-900">{guests}</span>
                          <button
                            onClick={() => setGuests(g => Math.min(20, g + 1))}
                            disabled={guests >= 20}
                            className="w-8 h-8 rounded-full border border-violet-200 bg-white flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white hover:border-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            aria-label="Add guest"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Nights */}
                      <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Nights</p>
                          <p className="text-xs text-slate-400">Duration</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setNights(n => Math.max(1, n - 1))}
                            disabled={nights <= 1}
                            className="w-8 h-8 rounded-full border border-violet-200 bg-white flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white hover:border-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            aria-label="Fewer nights"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-base font-bold text-slate-900">{nights}</span>
                          <button
                            onClick={() => setNights(n => Math.min(30, n + 1))}
                            disabled={nights >= 30}
                            className="w-8 h-8 rounded-full border border-violet-200 bg-white flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white hover:border-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            aria-label="More nights"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Price breakdown (MMT/Airbnb style) ── */}
                    {ratePerPersonPerNight > 0 && (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 mb-5">

                        {/* Accommodation line */}
                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Tag className="w-3.5 h-3.5 text-violet-500" />
                            <span>
                              {fmt(ratePerPersonPerNight)} × {guests} guest{guests > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800">{fmt(accommodation)}</span>
                        </div>

                        {/* Toggle full breakdown */}
                        <button
                          onClick={() => setShowBreakdown(v => !v)}
                          className="flex items-center gap-1 text-xs text-violet-600 font-medium hover:underline mb-3 cursor-pointer"
                        >
                          <Info className="w-3 h-3" />
                          {showBreakdown ? 'Hide' : 'Show'} taxes & fees
                        </button>

                        {showBreakdown && (
                          <div className="space-y-2 mb-3 border-t border-slate-200 pt-3">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>GST (12% on accommodation)</span>
                              <span>{fmt(gst)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                Hoppity convenience fee
                                <span className="bg-violet-100 text-violet-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">One-time</span>
                              </span>
                              <span>{fmt(convenienceFee)}</span>
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">Total</p>
                            {showBreakdown && (
                              <p className="text-[10px] text-slate-400 mt-0.5">Incl. taxes & fees</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-violet-700">{fmt(grandTotal)}</p>
                            {!showBreakdown && (
                              <p className="text-[10px] text-slate-400">+taxes & fees</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── CTAs ── */}
                    <div className="space-y-3">
                      <button
                        onClick={handleWhatsApp}
                        className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Book via WhatsApp
                      </button>
                      <button
                        onClick={handleCall}
                        className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                      >
                        <Phone className="w-5 h-5" />
                        Call to enquire
                      </button>
                      <p className="text-center text-xs text-slate-400 pt-1">
                        No payment collected here · We confirm availability first
                      </p>
                    </div>

                  </div>
                </div>

                {/* Trust strip */}
                <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
                  {[
                    { label: 'Free cancellation*', icon: Check },
                    { label: 'Instant response',   icon: Check },
                    { label: 'Budget-friendly',    icon: Check },
                  ].map(({ label, icon: Icon }) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-emerald-500" />{label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}