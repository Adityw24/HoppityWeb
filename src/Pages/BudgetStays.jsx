import { Link } from "react-router-dom"
import { ArrowLeft, Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import BudgetStayCard from "../components/BudgetStayCard"
import { setPageSEO } from '../lib/seo'

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

// ─── Dummy data (shown when Supabase returns 0 results) ───────────────────────

const DUMMY_STAYS = [
  {
    id: 'd1',
    slug: 'zostel-kasol',
    title: 'Zostel Kasol',
    location: 'Kasol, Himachal Pradesh',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 699,
    tag: 'Hostel',
    blurb: 'Iconic backpacker hostel on the banks of Parvati river. Perfect base for Kheerganga treks, great vibe, bonfire nights guaranteed.',
    image: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'],
    rating: 4.6,
    review_count: 312,
    amenities: ['Wifi', 'Cafe', 'Bonfire'],
    is_dummy: true,
  },
  {
    id: 'd2',
    slug: 'gostops-mcleodganj',
    title: 'goStops McLeod Ganj',
    location: 'McLeodganj, Dharamsala',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 899,
    tag: 'Hostel',
    blurb: 'Tibetan-influenced hostel with mountain views. Walk to Dharamkot, monastery, and the best momos in town.',
    image: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'],
    rating: 4.4,
    review_count: 189,
    amenities: ['Wifi', 'Rooftop', 'Cafe'],
    is_dummy: true,
  },
  {
    id: 'd3',
    slug: 'hill-view-homestay-mukteshwar',
    title: 'Hill View Homestay',
    location: 'Mukteshwar, Uttarakhand',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 1399,
    tag: 'Homestay',
    blurb: 'A warm family-run homestay with Himalayan panoramas. Home-cooked food, apple orchards, and total silence.',
    image: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'],
    rating: 4.8,
    review_count: 74,
    amenities: ['Home food', 'Wifi', 'Bonfire'],
    is_dummy: true,
  },
  {
    id: 'd4',
    slug: 'shivpuri-camp-rishikesh',
    title: 'Shivpuri Camp Resort',
    location: 'Shivpuri, Rishikesh',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 1799,
    tag: 'Camp',
    blurb: 'Swiss tents on the Ganges shore. White-water rafting package included. Fall asleep to river sounds every night.',
    image: ['https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80'],
    rating: 4.5,
    review_count: 201,
    amenities: ['Rafting', 'Meals', 'Bonfire'],
    is_dummy: true,
  },
  {
    id: 'd5',
    slug: 'zostel-kaza-spiti',
    title: 'Zostel Kaza',
    location: 'Kaza, Spiti Valley',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 749,
    tag: 'Hostel',
    blurb: "The world's highest Zostel at 12,500 ft. Surreal moonscape views, star-gazing nights, and a community of serious trekkers.",
    image: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'],
    rating: 4.7,
    review_count: 156,
    amenities: ['Wifi', 'Hot water', 'Cafe'],
    is_dummy: true,
  },
  {
    id: 'd6',
    slug: 'agonda-beach-shack-goa',
    title: 'Agonda Beach Shack',
    location: 'Agonda, South Goa',
    duration: '1 night',
    duration_display: 'Per night',
    price_per_person: 1200,
    tag: 'Guesthouse',
    blurb: 'Simple bamboo-and-tile guesthouse steps from the quietest beach in Goa. Hammocks, fresh coconut, zero pretension.',
    image: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'],
    rating: 4.3,
    review_count: 98,
    amenities: ['Beach access', 'Wifi', 'Breakfast'],
    is_dummy: true,
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_FILTERS = [
  { label: 'All prices',        min: 0,     max: Infinity },
  { label: 'Under ₹2,000',      min: 0,     max: 2000 },
  { label: '₹2,000 – ₹5,000',  min: 2000,  max: 5000 },
  { label: '₹5,000 – ₹10,000', min: 5000,  max: 10000 },
  { label: 'Above ₹10,000',     min: 10000, max: Infinity },
]

const DEFAULT_GRADIENT = 'from-teal-600 to-teal-900'
const TAG_GRADIENTS = {
  Hostel:   'from-sky-600 to-blue-900',
  Hostel:   'from-sky-600 to-blue-900',
  Guesthouse: 'from-teal-600 to-teal-900',
  Homestay: 'from-green-700 to-emerald-900',
  Camp:     'from-stone-600 to-stone-900',
  Dorm:     'from-slate-600 to-slate-800',
}

export default function BudgetStaysPage() {
  const [stays, setStays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priceFilter, setPriceFilter] = useState(PRICE_FILTERS[0])

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title: 'Budget Stays – Affordable Properties | Hoppity',
      description: "Honest, clean, wallet-friendly stays — hostels, guesthouses and homestays that never cut corners on experience.",
      canonical: '/stays/budget',
    })

    supabase
      .from('Itineraries')
      .select('id,slug,title,location,duration,duration_display,price,price_per_person,tag,category,blurb,cover_image_url,images,is_active,rating,review_count')
      .eq('is_active', true)
      .eq('stay_category', 'budget')
      .order('price_per_person', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Budget stays fetch error:', error)
        setStays((data || []).map(normalise))
        setLoading(false)
      })
      .catch(err => {
        console.error('Budget stays fetch failed:', err)
        setLoading(false)
      })
  }, [])

  // Use real data if available, fall back to dummy cards while DB is empty
  const displayStays = stays.length > 0 ? stays : DUMMY_STAYS

  const filtered = displayStays.filter(s => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      s.title?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.blurb?.toLowerCase().includes(q)
    const p = Number(s.price_per_person) || 0
    const matchPrice = p >= priceFilter.min && p < priceFilter.max
    return matchSearch && matchPrice
  })

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
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
            Affordable · No compromise
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            Budget Stays
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Honest, clean, wallet-friendly — hostels, guesthouses and homestays that never cut corners on experience.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 mt-5">
            {[`${displayStays.length} properties`, 'Best value picks', 'Sorted by price'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 inline-block" />{t}
              </span>
            ))}
          </div>

          {/* Dummy data notice — remove once DB is populated */}
          {stays.length === 0 && !loading && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
              Showing sample properties — connect your database to display live listings
            </div>
          )}
        </div>

        {/* Search */}
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

        {/* Price filter chips */}
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 mb-6">
          {PRICE_FILTERS.map(pf => (
            <button key={pf.label} onClick={() => setPriceFilter(pf)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer border-2 ${
                priceFilter.label === pf.label
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
              }`}>
              {pf.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="max-w-7xl mx-auto text-sm text-slate-400 mb-5 px-1">
          {filtered.length} {filtered.length !== 1 ? 'properties' : 'property'}
          {priceFilter.label !== 'All prices' && ` · ${priceFilter.label}`}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎒</div>
            <h3 className="text-xl font-bold text-slate-900">No stays found</h3>
            <p className="text-slate-500 mt-2">Try a different search or price range.</p>
            {priceFilter.label !== 'All prices' && (
              <button onClick={() => setPriceFilter(PRICE_FILTERS[0])}
                className="mt-4 text-violet-600 text-sm font-semibold hover:underline cursor-pointer">
                See all budget stays →
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(stay => (
              <BudgetStayCard key={stay.id} stay={stay} tagGradients={TAG_GRADIENTS} defaultGradient={DEFAULT_GRADIENT} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}