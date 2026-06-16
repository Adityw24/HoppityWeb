import { Link } from "react-router-dom"
import { ArrowLeft, Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import BudgetStayCard from "../components/BudgetStayCard"
import { setPageSEO } from '../lib/seo'

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

// ─── Normalise a Properties row into the shape BudgetStayCard expects ─────────

function normalise(row) {
  return {
    ...row,
    id:               row.id,
    slug:             row.slug,
    title:            row.name,
    tag:              row.property_type,
    price_per_person: row.price_per_night,
    duration_display: 'Per night',
    blurb:            row.description,
    image:            collectImages(row),
    rating:           row.rating       || 0,
    review_count:     row.review_count || 0,
  }
}

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
  Hostel:     'from-sky-600 to-blue-900',
  Guesthouse: 'from-teal-600 to-teal-900',
  Homestay:   'from-green-700 to-emerald-900',
  Camp:       'from-stone-600 to-stone-900',
  Dorm:       'from-slate-600 to-slate-800',
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
      .from('Properties')
      .select('*')
      .eq('is_active', true)
      .eq('property_category', 'budget')
      .order('price_per_night', { ascending: true })
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

  const filtered = stays.filter(s => {
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
            {[`${stays.length} ${stays.length === 1 ? 'property' : 'properties'}`, 'Best value picks', 'Sorted by price'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-violet-400 inline-block" />{t}
              </span>
            ))}
          </div>
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
            <h3 className="text-xl font-bold text-slate-900">
              {stays.length === 0 ? 'No budget stays yet' : 'No stays found'}
            </h3>
            <p className="text-slate-500 mt-2">
              {stays.length === 0
                ? 'Budget properties will appear here once they are published.'
                : 'Try a different search or price range.'}
            </p>
            {stays.length > 0 && priceFilter.label !== 'All prices' && (
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