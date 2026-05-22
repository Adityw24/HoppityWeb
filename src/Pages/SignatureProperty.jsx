import { Link, useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ArrowLeft, Star, MapPin, Clock, Wifi, Coffee, Flame,
  Anchor, Utensils, Shield, Users, Waves, Phone, MessageCircle,
  ChevronLeft, ChevronRight, Check, Share2, Heart, Calendar
} from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

const DUMMY_MAP = {
  'tiger-trail-lodge-corbett': {
    id: 's1', slug: 'tiger-trail-lodge-corbett',
    title: 'Tiger Trail Lodge',
    location: 'Jim Corbett, Uttarakhand',
    duration_display: 'Per night', price_per_person: 14500,
    tag: 'Jungle Lodge',
    blurb: 'A boutique jungle retreat on the edge of Corbett buffer zone. Morning safari, candlelit dining, and elephants in the wild.',
    description: `Tiger Trail Lodge sits on 4 acres of private buffer forest on the edge of Jim Corbett National Park — the oldest national park in India and home to over 200 Bengal tigers.

The property has 8 luxury cottages, each with a private sit-out facing the forest. Naturalists on staff run early-morning jeep safaris into the Dhikala zone, and evening walks along the property's own nature trail are a guest favourite.

Dinners are lit by lantern, served under a canopy of sal trees with a set menu of Kumaoni cuisine and garden-fresh vegetables. The salt-water pool is unheated but perfectly refreshing after a morning in the forest.

Best season: November to June. The park closes from July to mid-November.`,
    image: [
      'https://images.unsplash.com/photo-1549366021-9f761d450615?w=1200&q=85',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
    ],
    rating: 4.9, review_count: 67,
    amenities: ['Safari', 'Pool', 'Fine Dining', 'Bonfire', 'Spa', 'Naturalist'],
    highlights: ['Private buffer forest boundary','Expert naturalist-led safaris','Kumaoni cuisine by lantern light','Salt-water pool in the jungle'],
    what_included: ['Cottage stay', 'All meals', 'Morning safari', 'Nature walk', 'Naturalist guide'],
    what_not_included: ['Park entry fees', 'Jeep hire (separate tariff)', 'Alcohol', 'Transport'],
    cancellation: 'Free cancellation up to 7 days before check-in. 50% refund within 7–3 days. No refund under 3 days.',
    is_dummy: true,
  },
  'suryagarh-palace-jaisalmer': {
    id: 's2', slug: 'suryagarh-palace-jaisalmer',
    title: 'Suryagarh Palace',
    location: 'Jaisalmer, Rajasthan',
    duration_display: 'Per night', price_per_person: 22000,
    tag: 'Heritage Hotel',
    blurb: 'A modern fortress-hotel sculpted from golden Jaisalmer sandstone. Desert dunes at your doorstep, royal-to-the-bone hospitality.',
    description: `Suryagarh is built entirely from Jaisalmer's famous yellow limestone — a 112-room palace that looks like it emerged from the desert itself. It sits 7 km from the Sam Sand Dunes, with a private dune access path for guests.

The architecture is a meticulous recreation of a Rajput palace: jharokha windows, carved jaali screens, intricate frescoes. Rooms are designed as suites with traditional textiles, four-poster beds, and sandstone bathrooms.

The property runs a nightly cultural programme — folk music, puppet shows, and a desert campfire dinner with live performance. The Nao restaurant is considered one of Jaisalmer's finest, serving progressive Rajasthani cuisine with rare desert ingredients.

The spa uses local sesame and rose extracts. Book the rooftop pool at dawn — the dunes turn gold as the sun rises.`,
    image: [
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1200&q=85',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=85',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=85',
    ],
    rating: 4.9, review_count: 142,
    amenities: ['Pool', 'Spa', 'Cultural shows', 'Fine Dining', 'Desert safari', 'Rooftop bar'],
    highlights: ['7 km from Sam Sand Dunes','Nightly Rajasthani cultural programme','Award-winning Nao restaurant','Private dune access at dawn'],
    what_included: ['Suite stay', 'Breakfast & dinner', 'Cultural evening programme', 'Spa access'],
    what_not_included: ['Camel safari', 'Jeep safari', 'Lunch', 'Alcohol', 'Transport'],
    cancellation: 'Free cancellation up to 10 days before check-in. No refund within 10 days.',
    is_dummy: true,
  },
  'windermere-estate-munnar': {
    id: 's3', slug: 'windermere-estate-munnar',
    title: 'Windermere Estate',
    location: 'Munnar, Kerala',
    duration_display: 'Per night', price_per_person: 9800,
    tag: 'Estate Stay',
    blurb: "A planter's bungalow inside a working tea estate. Morning mist over endless green, estate tours, and colonial-era charm.",
    description: `Windermere Estate has been a working tea and cardamom plantation since 1875. The main bungalow — a colonial planter's residence — has been restored as a 14-room boutique stay while the estate continues to produce award-winning Munnar tea.

Wake to mist rolling over 3,000 acres of tea terraces. Mornings start with a self-guided estate walk and a cupping session where you compare three single-origin teas from the same hillside.

The dining room serves traditional Kerala sadya meals on banana leaf, with vegetables from the kitchen garden and fish from the Mattupetty reservoir. Evenings are quiet — board games, a well-stocked library, and a fire in the planter's lounge.

The estate is at 5,200 ft, so bring layers. Nearest airport: Cochin (4 hrs). Book the cardamom harvest season (October–November) for a completely different experience.`,
    image: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85',
    ],
    rating: 4.8, review_count: 88,
    amenities: ['Tea tours', 'Pool', 'Bonfire', 'Home-cooked meals', 'Wifi', 'Library'],
    highlights: ["1875 colonial planter's bungalow",'Live tea estate with daily tours','Kerala sadya on banana leaf','Cardamom harvest season visits'],
    what_included: ['Room with all meals', 'Tea estate tour & cupping', 'Complimentary wi-fi', 'All linen', 'Bonfire on request'],
    what_not_included: ['Transport', 'Cardamom picking activity (seasonal surcharge)', 'Alcohol'],
    cancellation: 'Free cancellation up to 7 days before check-in. 50% charge within 7–3 days.',
    is_dummy: true,
  },
  'kodai-treehouse-kodaikanal': {
    id: 's4', slug: 'kodai-treehouse-kodaikanal',
    title: 'The Kodai Treehouse',
    location: 'Kodaikanal, Tamil Nadu',
    duration_display: 'Per night', price_per_person: 8500,
    tag: 'Treehouse',
    blurb: 'Sleep among the clouds in a hand-crafted eucalyptus treehouse. Panoramic valley views, no screens, total disconnection.',
    description: `The Kodai Treehouse is a single-suite property — only one booking at a time — built 18 feet off the ground into a cluster of centurion eucalyptus trees on the Kodaikanal plateau.

The structure is entirely hand-built using traditional carpentry and rope joints, no metal fasteners in the main frame. Floor-to-ceiling glass on three sides means you wake to an uninterrupted panorama of the Palani Hills valley — on clear mornings, you can see 80 km across to the Western Ghats.

There is no TV, no in-room phone, and the kitchen serves only what the host harvests from the property: seasonal fruits, cold-pressed oils, wood-fired flatbreads. Nights here are genuinely dark and very quiet.

A resident naturalist takes guests on a 2-hour morning walk to spot Nilgiri langurs, shola birds, and the rare Kodai rose.`,
    image: [
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=85',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
    ],
    rating: 4.7, review_count: 54,
    amenities: ['Valley views', 'Meals', 'Nature walks', 'Bonfire', 'Wifi'],
    highlights: ['Exclusive single-suite property','18 ft hand-built eucalyptus treehouse','No TV · total digital detox','Nilgiri langur nature walks daily'],
    what_included: ['Treehouse suite', 'All meals (farm-to-table)', 'Morning nature walk', 'Evening bonfire'],
    what_not_included: ['Transport', 'Alcohol', 'Trekking guide (on request)'],
    cancellation: 'Free cancellation up to 14 days before check-in. No refund within 14 days (exclusive property).',
    is_dummy: true,
  },
  'barefoot-havelock-andaman': {
    id: 's5', slug: 'barefoot-havelock-andaman',
    title: 'Barefoot at Havelock',
    location: 'Havelock Island, Andaman',
    duration_display: 'Per night', price_per_person: 18000,
    tag: 'Beach Villa',
    blurb: "Pristine beach cottages on Radhanagar — Asia's finest beach. Snorkelling, bioluminescent nights, silence like nowhere else.",
    description: `Barefoot at Havelock occupies 7 acres of beachfront on Radhanagar Beach — rated Asia's best beach multiple years running by Time magazine. The 28 cottages are built from bamboo, palm thatch, and reclaimed timber, spaced far enough apart that you'll never hear a neighbour.

The house reef is 50 metres from the shore, rich with parrotfish, hawksbill turtles, and staghorn coral gardens. Snorkelling equipment is provided free. The dive centre runs PADI courses and liveaboard day trips to Lighthouse Reef and Jackson's Bar.

Bioluminescent plankton blooms appear most nights between October and March — wade knee-deep at midnight and watch the water glow around you. No other guest experience in India comes close.

The restaurant serves a daily changing menu of fresh Andaman catch — red snapper, lobster, barracuda. Catch your own fish on the sunset fishing trip and the kitchen will cook it for dinner.`,
    image: [
      'https://images.unsplash.com/photo-1540202404-d0c7fe46a1b6?w=1200&q=85',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',
    ],
    rating: 4.9, review_count: 213,
    amenities: ['Snorkelling', 'Beach access', 'Spa', 'All meals', 'Water sports', 'Dive centre'],
    highlights: ["Radhanagar — Asia's best beach",'Bioluminescent plankton nights','House reef 50 m from shore','Sunset fishing + cook your catch'],
    what_included: ['Beach cottage', 'All meals', 'Snorkelling equipment', 'Kayak access', 'Sunset fishing trip'],
    what_not_included: ['Scuba diving (extra)', 'Alcohol', 'Liveaboard day trips', 'Ferry transfers'],
    cancellation: 'Free cancellation up to 15 days before check-in. No refund within 15 days (remote island logistics).',
    is_dummy: true,
  },
  'nimmu-house-ladakh': {
    id: 's6', slug: 'nimmu-house-ladakh',
    title: 'Nimmu House',
    location: 'Nimmu, Ladakh',
    duration_display: 'Per night', price_per_person: 12000,
    tag: 'Heritage Stay',
    blurb: 'A 200-year-old royal residence in the Indus Valley. Stone walls, silk duvets, and the Zanskar confluence 5 min away.',
    description: `Nimmu House is a 200-year-old Ladakhi royal residence converted into a 10-room heritage stay without altering its mud-brick walls, carved wooden windows, or traditional Buddhist prayer room. The family who owns it — descendants of the Nimmu royal lineage — still lives on the upper floor.

The property sits in the Indus Valley at 3,250 m, 5 minutes from the Zanskar–Indus confluence — one of the most dramatic river junctions in the world, where turquoise Zanskar water meets the brown Indus in a visible line mid-river.

Rooms have hand-embroidered silk duvets, locally woven rugs, and electric blankets for the cold nights. Meals are prepared by the family — traditional Ladakhi thukpa, skyu, and butter tea are non-negotiable parts of every dinner.

Excursions include sunrise at the confluence, day trips to Likir Monastery, Magnetic Hill, and the Hall of Fame, all within 40 km.`,
    image: [
      'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85',
    ],
    rating: 4.8, review_count: 91,
    amenities: ['River views', 'All meals', 'Excursions', 'Wifi', 'Bonfire', 'Heritage tour'],
    highlights: ['200-year-old royal residence','Zanskar–Indus confluence 5 min away','Ladakhi family-cooked meals','Day trips to 5+ major sites'],
    what_included: ['Heritage room', 'All meals (Ladakhi cuisine)', 'Wi-fi', 'Excursion planning', 'Cultural heritage tour'],
    what_not_included: ['Vehicle hire', 'Entry fees', 'Alcohol', 'Transport from Leh'],
    cancellation: 'Free cancellation up to 7 days before check-in. 50% refund within 7–3 days.',
    is_dummy: true,
  },
}

const AMENITY_ICONS = {
  'Wifi': Wifi, 'Cafe': Coffee, 'Bonfire': Flame, 'Pool': Waves,
  'Spa': Shield, 'Safari': MapPin, 'Snorkelling': Anchor, 'Naturalist': Users,
  'All meals': Utensils, 'Home-cooked meals': Utensils, 'Meals': Utensils,
  'Fine Dining': Utensils, 'Tea tours': Coffee, 'Beach access': Anchor,
  'Water sports': Anchor, 'Dive centre': Anchor, 'Valley views': MapPin,
  'River views': MapPin, 'Nature walks': MapPin, 'Excursions': MapPin,
  'Cultural shows': Users, 'Desert safari': MapPin, 'Rooftop bar': Coffee,
  'Library': Shield, 'Heritage tour': MapPin,
}

export default function SignaturePropertyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIndex, setImgIndex] = useState(0)
  const [wishlist, setWishlist] = useState(false)
  const [guests, setGuests] = useState(2)
  const [nights, setNights] = useState(2)

  useEffect(() => {
    window.scrollTo(0, 0)
    supabase
      .from('Itineraries')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        if (data) {
          const norm = {
            ...data,
            image: data.images?.length
              ? data.images.filter(Boolean)
              : data.cover_image_url ? [data.cover_image_url] : [],
          }
          setProperty(norm)
          setPageSEO({ title: `${data.title} – Signature Stay | Hoppity`, description: data.blurb, canonical: `/stays/property/${slug}` })
        } else {
          const dummy = DUMMY_MAP[slug]
          if (dummy) {
            setProperty(dummy)
            setPageSEO({ title: `${dummy.title} – Signature Stay | Hoppity`, description: dummy.blurb, canonical: `/stays/property/${slug}` })
          }
        }
        setLoading(false)
      })
      .catch(() => { setProperty(DUMMY_MAP[slug] || null); setLoading(false) })
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
        <p className="text-4xl mb-4">🏡</p>
        <h2 className="text-xl font-bold text-slate-900">Property not found</h2>
        <p className="text-slate-500 mt-2 mb-6">This listing may have moved or been removed.</p>
        <Link to="/stays/signature"
          className="rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-violet-200 hover:shadow-xl transition">
          ← Back to Signature Stays
        </Link>
      </div>
    </div>
  )

  const images = property.image?.length ? property.image : ['https://images.unsplash.com/photo-1549366021-9f761d450615?w=1200&q=85']
  const totalPrice = Number(property.price_per_person || 0) * guests * nights

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi! I'm interested in booking ${property.title} in ${property.location}.\n\nGuests: ${guests}\nNights: ${nights}\nTotal estimate: ₹${totalPrice.toLocaleString('en-IN')}\n\nPlease share availability and confirm the booking.`)
    window.open(`https://wa.me/+919752377323?text=${msg}`, '_blank')
  }
  const handleCall = () => window.open('tel:+919752377323', '_self')

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="pt-20 pb-20">

        {/* Gallery */}
        <div className="relative w-full h-[55vh] min-h-[320px] max-h-[520px] overflow-hidden bg-slate-900 mt-4">
          <img
            key={imgIndex}
            src={images[imgIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-opacity duration-500"
            onError={e => { e.currentTarget.style.opacity = '0' }}
          />
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

          {/* Badges over image */}
          <div className="absolute bottom-12 left-5 flex items-center gap-2">
            {property.tag && (
              <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {property.tag}
              </span>
            )}
            <span className="inline-flex rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              ✦ Signature
            </span>
          </div>
        </div>

        {/* Main */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Left: content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-2">
                {property.title}
              </h1>

              {/* Meta */}
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
                    {property.review_count && <span className="text-slate-400">({property.review_count} reviews)</span>}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <span>{property.duration_display || property.duration}</span>
                </div>
              </div>

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
                          <Icon className="w-4 h-4 text-violet-500" />
                          {a}
                        </span>
                      )
                    })}
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
                    <Calendar className="w-4 h-4 text-violet-500" />
                    Cancellation policy
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{property.cancellation}</p>
                </div>
              )}

              {/* Dummy notice */}
              {property.is_dummy && (
                <div className="rounded-2xl bg-violet-50 border border-violet-200 px-5 py-4 mb-6">
                  <p className="text-xs text-violet-700 font-medium">
                    🔧 Sample listing — connect your Supabase database to display live property data.
                  </p>
                </div>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="sticky top-24">
                <div className="rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50 p-6">

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-violet-700">
                        ₹{Number(property.price_per_person || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 text-sm mb-1">/ night</span>
                    </div>
                    {property.rating > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-slate-700">{Number(property.rating).toFixed(1)}</span>
                        {property.review_count && <span className="text-xs text-slate-400">· {property.review_count} reviews</span>}
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-100 mb-5" />

                  {/* Guests & nights */}
                  <div className="space-y-4 mb-5">
                    {[
                      { label: 'Guests', sub: 'Number of people', val: guests, set: setGuests, max: 20 },
                      { label: 'Nights', sub: 'Duration of stay', val: nights, set: setNights, max: 30 },
                    ].map(({ label, sub, val, set, max }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{label}</p>
                          <p className="text-xs text-slate-400">{sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => set(v => Math.max(1, v - 1))}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-violet-400 hover:text-violet-700 transition text-lg font-bold">−</button>
                          <span className="w-6 text-center text-sm font-bold text-slate-900">{val}</span>
                          <button onClick={() => set(v => Math.min(max, v + 1))}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-violet-400 hover:text-violet-700 transition text-lg font-bold">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3 mb-5 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>₹{Number(property.price_per_person || 0).toLocaleString('en-IN')} × {guests} guest{guests > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}</span>
                      <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <hr className="border-violet-200" />
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Total estimate</span>
                      <span className="text-violet-700">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="space-y-3">
                    <button onClick={handleWhatsApp}
                      className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl">
                      <MessageCircle className="w-5 h-5" />
                      Book via WhatsApp
                    </button>
                    <button onClick={handleCall}
                      className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl">
                      <Phone className="w-5 h-5" />
                      Call to enquire
                    </button>
                    <p className="text-center text-xs text-slate-400 pt-1">
                      No payment collected here · We confirm availability first
                    </p>
                  </div>
                </div>

                {/* Trust strip */}
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
    </div>
  )
}
