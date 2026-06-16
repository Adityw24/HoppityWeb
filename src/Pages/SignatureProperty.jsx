import { Link, useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ArrowLeft, Star, MapPin, Clock, Wifi, Coffee, Flame,
  Anchor, Utensils, Shield, Users, Waves, Phone, MessageCircle,
  Check, Share2, Heart, Calendar, Images, X, ChevronLeft, ChevronRight,
  ExternalLink
} from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

// ─── Amenity icons ────────────────────────────────────────────────────────────

const AMENITY_ICONS = {
  'Wifi':               Wifi,
  'Cafe':               Coffee,
  'Bonfire':            Flame,
  'Pool':               Waves,
  'Spa':                Shield,
  'Safari':             MapPin,
  'Snorkelling':        Anchor,
  'Naturalist':         Users,
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
  'Cultural shows':     Users,
  'Desert safari':      MapPin,
  'Rooftop bar':        Utensils,
  'Library':            Shield,
  'Heritage tour':      MapPin,
  'Gym':                Shield,
  'Pet friendly':       Users,
  'Airport transfer':   MapPin,
  'AC':                 Shield,
  'Parking':            Shield,
}

// ─── Image collection helper ───────────────────────────────────────────────────
// Gathers cover_image_url + images_url (array / JSON string / unquoted brackets /
// comma list / single URL) into one de-duplicated array.

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
// Prefer the admin-saved maps_url (validated as a real http/https link).
// Fall back to a Google Maps search built from address / title / location.

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

// ─── Lightbox / Slider ──────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose, onPrev, onNext, onSelect }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 text-white" onClick={e => e.stopPropagation()}>
        <span className="text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          aria-label="Close gallery">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image + nav */}
      <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition z-10"
            aria-label="Previous image">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={images[index]}
          alt={`Image ${index + 1}`}
          className="max-h-[72vh] max-w-[92vw] object-contain rounded-2xl select-none"
          draggable={false}
        />

        {images.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition z-10"
            aria-label="Next image">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto px-5 py-4 justify-start sm:justify-center"
          onClick={e => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                i === index ? 'border-violet-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}>
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Photo Grid (Airbnb-style) ──────────────────────────────────────────────────
// 5+ images → 1 big left + 2×2 right grid, with a "Show all photos" button.
// Degrades cleanly for 1–4 images. Every tile opens the Lightbox carousel.

function BentoGallery({ images, title, onOpen }) {
  const [errored, setErrored] = useState({})
  const mark = (i) => setErrored(p => ({ ...p, [i]: true }))

  const Fallback = ({ className }) => (
    <div className={`${className} bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-800 flex items-center justify-center`}>
      <span className="text-5xl opacity-20">✦</span>
    </div>
  )

  const Tile = ({ index, className = "", rounded = "" }) => {
    const src = images[index]
    return (
      <div
        onClick={() => src && onOpen(index)}
        className={`relative overflow-hidden ${rounded} ${src ? 'cursor-zoom-in' : ''} ${className} group`}>
        {src && !errored[index] ? (
          <img
            src={src}
            alt={`${title} ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => mark(index)}
          />
        ) : (
          <Fallback className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none" />
      </div>
    )
  }

  const count = images.length
  const wrap = "relative mt-4 mx-auto max-w-7xl px-6 lg:px-10"
  const frame = "grid gap-2 overflow-hidden rounded-3xl"
  const h = { height: 'clamp(340px, 58vh, 560px)' }

  if (count <= 1) {
    return (
      <div className={wrap}>
        <div className={frame} style={h}>
          <Tile index={0} rounded="rounded-3xl" />
        </div>
        <TopBar title={title} count={count} onShowAll={() => count && onOpen(0)} />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className={wrap}>
        <div className={frame} style={{ ...h, gridTemplateColumns: '1fr 1fr' }}>
          <Tile index={0} rounded="rounded-l-3xl" />
          <Tile index={1} rounded="rounded-r-3xl" />
        </div>
        <TopBar title={title} count={count} onShowAll={() => onOpen(0)} />
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className={wrap}>
        <div className={frame} style={{ ...h, gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}>
          <Tile index={0} rounded="rounded-l-3xl" className="row-span-2" />
          <Tile index={1} rounded="rounded-tr-3xl" />
          <Tile index={2} rounded="rounded-br-3xl" />
        </div>
        <TopBar title={title} count={count} onShowAll={() => onOpen(0)} />
      </div>
    )
  }

  if (count === 4) {
    return (
      <div className={wrap}>
        <div className={frame} style={{ ...h, gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
          <Tile index={0} rounded="rounded-l-3xl" className="row-span-2" />
          <Tile index={1} />
          <Tile index={2} rounded="rounded-tr-3xl" />
          <Tile index={3} />
        </div>
        <TopBar title={title} count={count} onShowAll={() => onOpen(0)} />
      </div>
    )
  }

  // 5+ images: classic Airbnb — 1 big left + 2×2 right
  return (
    <div className={wrap}>
      <div
        className={frame}
        style={{ ...h, gridTemplateColumns: '1fr 0.5fr 0.5fr', gridTemplateRows: '1fr 1fr' }}>
        <Tile index={0} rounded="rounded-l-3xl" className="row-span-2" />
        <Tile index={1} />
        <Tile index={2} rounded="rounded-tr-3xl" />
        <Tile index={3} />
        <Tile index={4} rounded="rounded-br-3xl" />
      </div>

      <button
        onClick={() => onOpen(0)}
        className="absolute bottom-4 right-10 lg:right-14 flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-md hover:shadow-lg hover:bg-slate-50 transition">
        <Images className="w-4 h-4" />
        Show all photos{count > 5 ? ` (${count})` : ''}
      </button>

      <TopBar title={title} count={count} onShowAll={() => onOpen(0)} />
    </div>
  )
}

// Shared top-bar (Back / Share / Wishlist) — floats over whatever gallery layout
function TopBar({ title, onShowAll, count }) {
  const navigate  = useNavigate()
  const [wish, setWish] = useState(false)
  return (
    <div className="absolute top-4 left-10 right-10 lg:left-16 lg:right-16 flex items-center justify-between z-10 pointer-events-none">
      <button
        onClick={() => navigate(-1)}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-4 py-2 text-white text-sm font-medium hover:bg-black/60 transition cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-2 pointer-events-auto">
        {count > 1 && (
          <button
            onClick={onShowAll}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-4 py-2 text-white text-sm font-medium hover:bg-black/60 transition cursor-pointer"
            aria-label="View all photos">
            <Images className="w-4 h-4" /> All photos
          </button>
        )}
        <button
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition cursor-pointer"
          onClick={() => navigator.share?.({ title, url: window.location.href })}
          aria-label="Share">
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setWish(w => !w)}
          className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition cursor-pointer ${wish ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
          aria-label="Wishlist">
          <Heart className={`w-4 h-4 ${wish ? 'fill-white' : ''}`} />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignaturePropertyPage() {
  const { slug }     = useParams()
  const [property,   setProperty]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [guests,     setGuests]     = useState(1)
  const [nights,     setNights]     = useState(1)
  const [lightbox,   setLightbox]   = useState({ open: false, index: 0 })

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
          setFetchError('Property not found or not available.')
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
          title:       `${data.name} – Signature Stay | Hoppity`,
          description: data.description,
          canonical:   `/stays/${slug}`,
        })
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err.message)
        setLoading(false)
      })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading property…</p>
      </div>
    </div>
  )

  if (fetchError || !property) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🏡</p>
        <h2 className="text-xl font-bold text-slate-900">Property not found</h2>
        <p className="text-slate-500 mt-2 mb-6 text-sm">{fetchError || 'This listing may have moved or been removed.'}</p>
        <Link to="/stays/signature"
          className="rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-violet-200 hover:shadow-xl transition">
          ← Back to Signature Stays
        </Link>
      </div>
    </div>
  )

  const images     = property.image?.length ? property.image : []
  const totalPrice = Number(property.price_per_person || 0) * guests * nights
  const mapsUrl    = buildMapsUrl(property)

  // Lightbox controls
  const openLightbox  = (i = 0) => setLightbox({ open: true, index: Math.min(i, images.length - 1) })
  const closeLightbox = () => setLightbox(l => ({ ...l, open: false }))
  const prevImg = () => setLightbox(l => ({ ...l, index: (l.index - 1 + images.length) % images.length }))
  const nextImg = () => setLightbox(l => ({ ...l, index: (l.index + 1) % images.length }))
  const selectImg = (i) => setLightbox(l => ({ ...l, index: i }))

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi! I'm interested in booking ${property.title} in ${property.location}.\n\n` +
      `Guests: ${guests} and Nights: ${nights}\n` +
      `Could you please share:\n` +
      `• Availability for this stay\n` +
      `• Best available pricing`
    )
    window.open(`https://wa.me/+919752377323?text=${msg}`, '_blank')
  }
  const handleCall = () => window.open('tel:+919752377323', '_self')

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="pt-20 pb-20">

        {/* ── Gallery ──────────────────────────────────────────────────────── */}
        <BentoGallery
          images={images}
          title={property.title}
          onOpen={openLightbox}
        />

        {/* Category + tag badges row — below gallery */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-4 flex items-center gap-2 flex-wrap">
          {property.tag && (
            <span className="inline-flex rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
              {property.tag}
            </span>
          )}
          {property.property_category && (
            <span className="inline-flex rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              ✦ {property.property_category.charAt(0).toUpperCase() + property.property_category.slice(1)}
            </span>
          )}
        </div>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-6">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── Left ─────────────────────────────────────────────────── */}
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
              </div>

              {mapsUrl && (
                <div className="flex items-center mb-6 -mt-2 gap-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-violet-200 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50 hover:border-violet-300 transition">
                    View on Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <hr className="border-slate-200 mb-6" />

              {/* Description */}
              {property.blurb && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">About this property</h2>
                  <div className="text-slate-600 text-sm leading-[1.95] whitespace-pre-line">{property.blurb}</div>
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

              {/* Included / not included */}
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
                    <Calendar className="w-4 h-4 text-violet-500" />Cancellation policy
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
              {(property.address || mapsUrl) && (
                <div className="mb-8 rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />Address
                  </h3>
                  {property.address && (
                    <p className="text-sm text-slate-600 leading-relaxed">{property.address}</p>
                  )}
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white border border-violet-200 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50 hover:border-violet-300 transition">
                      <MapPin className="w-3.5 h-3.5" />
                      View on Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: booking sidebar ────────────────────────────────── */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="sticky top-24">
                <div className="rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50 p-6">

                  <div className="mb-5">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-violet-700">
                        {property.price_per_person
                          ? `₹${Number(property.price_per_person).toLocaleString('en-IN')}`
                          : 'On Request'}
                      </span>
                      {property.price_per_person > 0 && (
                        <span className="text-slate-400 text-sm mb-1">/ night</span>
                      )}
                    </div>
                    {property.rating > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-slate-700">{Number(property.rating).toFixed(1)}</span>
                        {property.review_count > 0 && <span className="text-xs text-slate-400">· {property.review_count} reviews</span>}
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-100 mb-5" />

                  <div className="space-y-4 mb-5">
                    {[
                      { label: 'Guests', sub: 'Number of people', val: guests, setVal: setGuests, max: 20 },
                      { label: 'Nights', sub: 'Duration of stay',  val: nights, setVal: setNights, max: 30 },
                    ].map(({ label, sub, val, setVal, max }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          <p className="text-xs text-slate-400">{sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setVal(v => Math.max(1, v - 1))}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-violet-400 hover:text-violet-700 transition text-lg font-bold">−</button>
                          <span className="w-6 text-center text-sm font-bold text-slate-900">{val}</span>
                          <button onClick={() => setVal(v => Math.min(max, v + 1))}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-violet-400 hover:text-violet-700 transition text-lg font-bold">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {property.price_per_person > 0 && (
                    <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3 mb-5 space-y-2">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>₹{Number(property.price_per_person).toLocaleString('en-IN')} × {guests} guest{guests > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}</span>
                        <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <hr className="border-violet-200" />
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Total estimate</span>
                        <span className="text-violet-700">₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button onClick={handleWhatsApp}
                      className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl cursor-pointer">
                      <MessageCircle className="w-5 h-5" />Book via WhatsApp
                    </button>
                    <button onClick={handleCall}
                      className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl cursor-pointer">
                      <Phone className="w-5 h-5" />Call to enquire
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
                  {['Free cancellation*', 'Instant response', 'Personally curated'].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-500" />{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Lightbox / Slider ──────────────────────────────────────────────── */}
      {lightbox.open && images.length > 0 && (
        <Lightbox
          images={images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImg}
          onNext={nextImg}
          onSelect={selectImg}
        />
      )}
    </div>
  )
}