import { Link, useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ArrowLeft, Star, MapPin, Clock, Wifi, Coffee, Flame,
  Anchor, Utensils, Shield, Users, Waves, Phone, MessageCircle,
  ChevronLeft, ChevronRight, Check, Share2, Heart, Calendar,
  Info, Tag, Minus, Plus
} from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from '../lib/seo'

// ─── Dummy data (mirrors BudgetStaysPage slugs exactly) ───────────────────────

const DUMMY_MAP = {
  'zostel-kasol': {
    id: 'd1', slug: 'zostel-kasol',
    title: 'Zostel Kasol',
    location: 'Kasol, Himachal Pradesh',
    duration_display: 'Per night', price_per_person: 699,
    tag: 'Hostel',
    blurb: 'Iconic backpacker hostel on the banks of Parvati river. Perfect base for Kheerganga treks, great vibe, bonfire nights guaranteed.',
    description: `Zostel Kasol sits on the banks of the Parvati river in the heart of the Parvati Valley — one of India's most beloved backpacker destinations. The hostel is just 5 minutes from the main village, surrounded by pine forests and the gentle sound of the river.

This is the launchpad for Kheerganga trek (12 km, 2,950 m), Pin Parvati Pass, and day hikes through Chalal and Tosh. After a day on the trails, the common room fills with travellers sharing stories, guitars, and the kind of easy conversation that only happens when you're far from home.

Dorms are clean with good mattresses, personal reading lights, and secure lockers. The café serves breakfast, Maggi, and chai from 7 am. Evening bonfires are practically a ritual.`,
    image: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85'],
    rating: 4.6, review_count: 312,
    amenities: ['Wifi', 'Cafe', 'Bonfire', 'Lockers', 'Hot water', 'Common room'],
    highlights: ['5 min walk to Parvati river', 'Kheerganga trek base camp', 'Evening bonfire ritual', 'Cafe open from 7 am'],
    what_included: ['Dorm bed / private room', 'Complimentary wi-fi', 'Locker access', 'Linen & towels', 'Hot water'],
    what_not_included: ['Meals (except stated plans)', 'Trek guide fees', 'Transport to Kasol'],
    cancellation: 'Free cancellation up to 48 hours before check-in. 50% charge within 48 hours.',
    is_dummy: true,
  },
  'gostops-mcleodganj': {
    id: 'd2', slug: 'gostops-mcleodganj',
    title: 'goStops McLeod Ganj',
    location: 'McLeodganj, Dharamsala',
    duration_display: 'Per night', price_per_person: 899,
    tag: 'Hostel',
    blurb: 'Tibetan-influenced hostel with mountain views. Walk to Dharamkot, monastery, and the best momos in town.',
    description: `goStops McLeodganj occupies a converted building right in the heart of the Tibetan quarter — a short walk from the Dalai Lama's temple, Bhagsu waterfall, and the famous momo stalls of McLeod market.

The rooftop has unobstructed views of the Dhauladhar range, especially spectacular at sunrise. Common areas are thoughtfully designed with Tibetan artwork and warm lighting. Weekly movie nights and community dinners are a regular feature.

The café downstairs serves local Tibetan dishes alongside continental breakfast options. Book in advance during peak season (March–June, September–November) as this fills up fast.`,
    image: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85'],
    rating: 4.4, review_count: 189,
    amenities: ['Wifi', 'Rooftop cafe', 'Lockers', 'Hot water', 'Common room', 'Laundry'],
    highlights: ['10 min to Dalai Lama temple', 'Panoramic Dhauladhar views', 'Weekly community dinners', 'Bhagsu Waterfall nearby'],
    what_included: ['Dorm bed / private room', 'Wi-fi', 'Locker access', 'Linen & towels'],
    what_not_included: ['Meals', 'Monastery visit fees', 'Transport'],
    cancellation: 'Free cancellation up to 72 hours before check-in.',
    is_dummy: true,
  },
  'hill-view-homestay-mukteshwar': {
    id: 'd3', slug: 'hill-view-homestay-mukteshwar',
    title: 'Hill View Homestay',
    location: 'Mukteshwar, Uttarakhand',
    duration_display: 'Per night', price_per_person: 1399,
    tag: 'Homestay',
    blurb: 'A warm family-run homestay with Himalayan panoramas. Home-cooked food, apple orchards, and total silence.',
    description: `Perched at 2,286 m in Mukteshwar, this family-run homestay offers some of the clearest views of the Nanda Devi range you'll find anywhere in Uttarakhand — on a clear morning, you can see peaks 200 km away.

The house is built in traditional Kumaoni style with a wrap-around veranda. Your hosts, the Bisht family, have run this property for 15 years and take quiet pride in the meals — breakfasts of fresh paranthas with homemade achaar, and evening thalis with dal, seasonal vegetables from their kitchen garden.

Apple orchards surround the property; during October, guests help with picking. The village temple and Mukteshwar Dham are a short walk uphill.`,
    image: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85'],
    rating: 4.8, review_count: 74,
    amenities: ['Home-cooked meals', 'Wifi', 'Bonfire', 'Mountain views', 'Garden', 'Hot water'],
    highlights: ['Nanda Devi range panorama', 'Authentic Kumaoni cuisine', 'Apple orchard walks', '5 min to Mukteshwar Dham'],
    what_included: ['Room with breakfast & dinner', 'Complimentary wi-fi', 'Bonfire on request', 'All linen'],
    what_not_included: ['Lunch', 'Transport', 'Guide fees'],
    cancellation: 'Free cancellation up to 5 days before check-in. No refund thereafter.',
    is_dummy: true,
  },
  'shivpuri-camp-rishikesh': {
    id: 'd4', slug: 'shivpuri-camp-rishikesh',
    title: 'Shivpuri Camp Resort',
    location: 'Shivpuri, Rishikesh',
    duration_display: 'Per night', price_per_person: 1799,
    tag: 'Camp',
    blurb: 'Swiss tents on the Ganges shore. White-water rafting package included. Fall asleep to river sounds every night.',
    description: `Shivpuri Camp Resort occupies 3 acres on the Ganges riverbank at Shivpuri — one of the most picturesque stretches of the river, 16 km upstream from Rishikesh. The Swiss-style canvas tents are well-furnished with real beds, not sleeping bags on the ground.

Rafting starts at Marine Drive and ends at Nimbechwala — a 16 km stretch rated Grade III–IV, with rapids like Three Blind Mice, Roller Coaster, and the famous Golf Course rapid. Trained WAFA-certified guides accompany every group.

Post-rafting, evenings wind down with a beach bonfire, BBQ dinner, and stargazing. The camp runs bungee jumping, giant swing, and cliff jumping activities at an additional cost.`,
    image: ['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&q=85','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85'],
    rating: 4.5, review_count: 201,
    amenities: ['Rafting included', 'All meals', 'Bonfire', 'Beach access', 'Hot showers', 'Volleyball'],
    highlights: ['16 km Grade III–IV rafting', 'Ganges beachfront tents', 'All meals included', 'WAFA-certified guides'],
    what_included: ['Tent accommodation', 'Rafting with safety equipment', 'All meals (dinner, breakfast)', 'Bonfire', 'Helmet & life jacket'],
    what_not_included: ['Bungee / swing / cliff jump', 'Transport from Rishikesh', 'Alcohol'],
    cancellation: 'Free cancellation up to 48 hours before check-in.',
    is_dummy: true,
  },
  'zostel-kaza-spiti': {
    id: 'd5', slug: 'zostel-kaza-spiti',
    title: 'Zostel Kaza',
    location: 'Kaza, Spiti Valley',
    duration_display: 'Per night', price_per_person: 749,
    tag: 'Hostel',
    blurb: "The world's highest Zostel at 12,500 ft. Surreal moonscape views, star-gazing nights, and a community of serious trekkers.",
    description: `Zostel Kaza sits at 3,800 m — high enough that the sky looks darker in the day and the Milky Way is plainly visible at night. Located in the heart of Kaza, the main town of Spiti Valley, it's the best base for exploring one of India's most remote regions.

The property has a warm interior despite the altitude — double-paned windows, good insulation, and a constantly stocked kitchen. Staff are incredibly helpful with arranging taxis to Key Monastery, Kibber village, Chandratal Lake, and the Pin Valley.

The common room is the social heart of the valley's traveller circuit. The altitude is real — spend your first day slow, drink plenty of water, and do NOT rush to trek.`,
    image: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85','https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1200&q=85'],
    rating: 4.7, review_count: 156,
    amenities: ['Wifi', 'Hot water', 'Cafe', 'Lockers', 'Oxygen cylinder', 'Tour desk'],
    highlights: ["World's highest Zostel (3,800 m)", 'Milky Way star-gazing', '30 min to Key Monastery', 'Chandratal day-trips available'],
    what_included: ['Dorm bed / private room', 'Wi-fi', 'Locker access', 'Linen', 'Oxygen cylinder on request'],
    what_not_included: ['Meals', 'Vehicle hire', 'Trek permits'],
    cancellation: 'Free cancellation up to 72 hours before check-in.',
    is_dummy: true,
  },
  'agonda-beach-shack-goa': {
    id: 'd6', slug: 'agonda-beach-shack-goa',
    title: 'Agonda Beach Shack',
    location: 'Agonda, South Goa',
    duration_display: 'Per night', price_per_person: 1200,
    tag: 'Guesthouse',
    blurb: 'Simple bamboo-and-tile guesthouse steps from the quietest beach in Goa. Hammocks, fresh coconut, zero pretension.',
    description: `Agonda Beach Shack is a collection of 8 cottages set 50 metres from Agonda beach — consistently rated one of the least-crowded beaches in Goa. Unlike Baga or Calangute, Agonda has no jet-skis, no trance parties, and no hawkers. Just sand, sea, and the occasional turtle nesting ground.

The cottages are built in a mix of bamboo and red Mangalore tile — airy, simple, with ceiling fans, mosquito nets, and good mattresses. Each opens onto a shared veranda with hammocks. The in-house shack serves fresh catch, kokum drinks, and Sol Kadhi all day.

Peak season: November–March. Book 3+ weeks ahead for Christmas and New Year.`,
    image: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85'],
    rating: 4.3, review_count: 98,
    amenities: ['Beach access', 'Wifi', 'Breakfast', 'Hammocks', 'Sea-facing rooms', 'In-house cafe'],
    highlights: ['50 m from Agonda beach', 'Turtle nesting zone nearby', 'Fresh catch daily', 'No crowds, no noise'],
    what_included: ['Room with breakfast', 'Wi-fi', 'Hammock access', 'Mosquito nets & fan'],
    what_not_included: ['Lunch & dinner', 'Scooter rental', 'Water sports'],
    cancellation: 'Free cancellation up to 3 days before check-in. No refund thereafter.',
    is_dummy: true,
  },
}

// ─── Amenity icons ────────────────────────────────────────────────────────────

const AMENITY_ICONS = {
  'Wifi': Wifi, 'Cafe': Coffee, 'Rooftop cafe': Coffee, 'Bonfire': Flame,
  'Beach access': Anchor, 'Breakfast': Coffee, 'Home-cooked meals': Utensils,
  'All meals': Utensils, 'Meals': Utensils, 'Rafting included': Anchor,
  'Lockers': Shield, 'Hot water': Shield, 'Hot showers': Shield,
  'Common room': Users, 'Laundry': Shield, 'Garden': MapPin,
  'Mountain views': MapPin, 'Sea-facing rooms': MapPin, 'In-house cafe': Coffee,
  'Hammocks': Shield, 'Tour desk': MapPin, 'Oxygen cylinder': Shield,
  'Volleyball': Users, 'Beach': Anchor,
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
          setPageSEO({ title: `${data.title} – Budget Stay | Hoppity`, description: data.blurb, canonical: `/stays/property/${slug}` })
        } else {
          const dummy = DUMMY_MAP[slug]
          if (dummy) {
            setProperty(dummy)
            setPageSEO({ title: `${dummy.title} – Budget Stay | Hoppity`, description: dummy.blurb, canonical: `/stays/property/${slug}` })
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

  const images = property.image?.length ? property.image : ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85']

  // ── Pricing math (MMT / Airbnb style) ──────────────────────────────────────
  // Base rate is per-person per-night
  const ratePerPersonPerNight = Number(property.price_per_person || 0)
  const accommodation         = ratePerPersonPerNight * guests * nights   // core cost
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
                          <Icon className="w-4 h-4 text-violet-500" />{a}
                        </span>
                      )
                    })}
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

              {property.is_dummy && (
                <div className="rounded-2xl bg-violet-50 border border-violet-200 px-5 py-4 mb-6">
                  <p className="text-xs text-violet-700 font-medium">
                    🔧 Sample listing — connect your Supabase database to display live property data.
                  </p>
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
                        {fmt(ratePerPersonPerNight)}
                      </span>
                      <span className="text-violet-200 text-xs mb-1 font-medium">/ person / night</span>
                    </div>
                    {property.rating > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        <span className="text-sm font-semibold text-white">{Number(property.rating).toFixed(1)}</span>
                        {property.review_count && <span className="text-xs text-violet-200">· {property.review_count} reviews</span>}
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