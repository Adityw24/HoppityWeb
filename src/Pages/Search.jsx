import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Sparkles, X, TrendingUp, Clock, MapPin, ArrowRight, ArrowLeft, SlidersHorizontal, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { setPageSEO } from '../lib/seo'

const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlbmh1ZGN5dmxoaWxwZ2F6eWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTY0MTgsImV4cCI6MjA4NTA3MjQxOH0.Jdx993pFvb0JC87NaYhOQ6UR_7UIJBA1mkFQUeoK7bA'

/* Admin uploads sometimes land a video inside `images` — never use one as a cover. */
const isVideo = (url) => /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(String(url || ''))

const VIBE_CHIPS = [
  { emoji: '✨', label: 'Surprise me', q: 'surprise me with something extraordinary' },
  { emoji: '🌿', label: 'Offbeat northeast', q: 'offbeat northeast india hidden gem' },
  { emoji: '👨‍👩‍👧', label: 'Family trip', q: 'family friendly easy safe' },
  { emoji: '💸', label: 'Budget adventure', q: 'budget travel affordable' },
  { emoji: '🏔️', label: 'Himalayan trek', q: 'himalayan trek mountains altitude' },
  { emoji: '🕉️', label: 'Spiritual journey', q: 'spiritual heritage pilgrimage' },
  { emoji: '🐘', label: 'Wildlife safari', q: 'wildlife safari national park' },
  { emoji: '📸', label: 'Photography trip', q: 'photography landscape scenic photography paradise' },
  { emoji: '🌊', label: 'Monsoon magic', q: 'monsoon waterfalls rain lush green' },
  { emoji: '💑', label: 'Romantic escape', q: 'romantic couple honeymoon peaceful' },
]

const TRENDING = ['Meghalaya', 'Spiti Valley', 'Ladakh', 'Rajasthan', 'Kerala', 'Assam', 'Arunachal', 'Uttarakhand']

const BUDGETS = [
  { label: 'Any budget', min: null, max: null },
  { label: 'Under ₹15,000', min: null, max: 15000 },
  { label: '₹15,000 – ₹30,000', min: 15000, max: 30000 },
  { label: '₹30,000 – ₹60,000', min: 30000, max: 60000 },
  { label: '₹60,000+', min: 60000, max: null },
]

const SORTS = [
  { key: 'relevance', label: 'Best match' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
]

/* Postgrest's .or() takes a comma-separated filter string, so anything that
   could break that grammar has to come out of the user's words first. */
const safeTerm = (w) => w.replace(/[,()%*\\'"]/g, ' ').trim()

const priceOf = (t) => Number(t.price_per_person ?? t.price ?? 0) || 0

function normaliseTour(row) {
  const images = Array.isArray(row.images) ? row.images : []
  const cover =
    images.find(u => !isVideo(u)) ||
    (isVideo(row.cover_image_url) ? null : row.cover_image_url) ||
    null
  return { ...row, cover, duration_display: row.duration_display || row.duration || '' }
}

/* Relevance scoring. The database's full-text ranking is good at whole words
   but has no idea that a hit in the title matters more than one buried in a
   blurb, so results get re-ordered here before they're shown. */
function scoreTour(tour, terms) {
  const title = (tour.title || '').toLowerCase()
  const location = (tour.location || '').toLowerCase()
  const tag = `${tour.tag || ''} ${tour.category || ''}`.toLowerCase()
  const blurb = (tour.blurb || '').toLowerCase()
  let score = 0
  for (const t of terms) {
    if (!t) continue
    if (title.startsWith(t)) score += 6
    else if (title.includes(t)) score += 4
    if (location.includes(t)) score += 3
    if (tag.includes(t)) score += 2
    if (blurb.includes(t)) score += 1
  }
  if (tour.rating > 0) score += Math.min(Number(tour.rating), 5) / 10
  return score
}

async function aiSearch(query, history = []) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ANON_KEY
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ query, history, max_results: 8 }),
  })
  if (!res.ok) throw new Error('AI search failed')
  return res.json()
}

export default function SearchPage() {
  useEffect(() => {
    setPageSEO({
      title: 'Search – Find Your Perfect India Trip',
      description: "Search Hoppity's curated catalogue of India travel experiences by destination, activity or budget — from tribal northeast journeys to Himalayan expeditions.",
      canonical: '/search',
    })
  }, [])

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialMode = searchParams.get('mode') === 'ai' ? 'ai' : 'fts'

  const [mode, setMode] = useState(initialMode)          // keyword search is the default
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState([])
  const [aiReply, setAiReply] = useState(null)
  const [aiHistory, setAiHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [budget, setBudget] = useState(0)
  const [sort, setSort] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hoppity_recent') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const runIdRef = useRef(0)

  useEffect(() => {
    if (initialQ) handleSearch(initialQ, initialMode)
    else inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goBack = () => {
    // Deep links (WhatsApp, search engines) have no history to go back to.
    if (window.history.length > 2) navigate(-1)
    else navigate('/')
  }

  const saveRecent = (q) => {
    const updated = [q, ...recentSearches.filter(s => s.toLowerCase() !== q.toLowerCase())].slice(0, 6)
    setRecentSearches(updated)
    try { localStorage.setItem('hoppity_recent', JSON.stringify(updated)) } catch {}
  }

  /* Database full-text search — precise, but only matches whole words. */
  const ftsSearch = async (q, range) => {
    const { data } = await supabase.rpc('search_itineraries', {
      p_query: q.trim(), p_limit: 24, p_offset: 0,
      p_category: null, p_state: null, p_difficulty: null,
      p_min_price: range?.min ?? null, p_max_price: range?.max ?? null,
    })
    return data || []
  }

  /* Partial-word fallback — catches "megh", phrases and misspellings the
     tsvector tokeniser drops. */
  const likeSearch = async (terms) => {
    const usable = terms.filter(t => t.length >= 3).slice(0, 4)
    if (usable.length === 0) return []
    const or = usable
      .flatMap(t => [`title.ilike.%${t}%`, `location.ilike.%${t}%`, `blurb.ilike.%${t}%`, `tag.ilike.%${t}%`])
      .join(',')
    const { data } = await supabase
      .from('Itineraries')
      .select('id,slug,title,location,duration,price,price_per_person,tag,blurb,cover_image_url,images,rating,is_active')
      .eq('is_active', true)
      .or(or)
      .limit(24)
    return data || []
  }

  const handleSearch = async (q = query, m = mode) => {
    const trimmed = (q || '').trim()
    if (!trimmed) return

    const runId = ++runIdRef.current          // ignore results from stale requests
    setLoading(true); setSearched(true); setAiReply(null)
    saveRecent(trimmed)
    setSearchParams(m === 'ai' ? { q: trimmed, mode: 'ai' } : { q: trimmed }, { replace: true })

    const range = BUDGETS[budget]
    const terms = trimmed.toLowerCase().split(/\s+/).map(safeTerm).filter(Boolean)

    try {
      if (m === 'ai') {
        try {
          const res = await aiSearch(trimmed, aiHistory)
          const tours = (res.tours || []).map(normaliseTour)
          if (tours.length > 0) {
            if (runId !== runIdRef.current) return
            setResults(tours)
            setAiReply({ explanation: res.explanation, followUps: res.follow_up_suggestions || [] })
            setAiHistory(h => [...h, { role: 'user', content: trimmed }, { role: 'assistant', content: res.explanation }])
            return
          }
        } catch (_) { /* AI unavailable — fall through to keyword */ }
      }

      const fts = (await ftsSearch(trimmed, range)).map(normaliseTour)
      let merged = fts
      if (fts.length < 6) {
        const loose = (await likeSearch(terms)).map(normaliseTour)
        const seen = new Set(fts.map(r => r.id))
        merged = [...fts, ...loose.filter(r => !seen.has(r.id))]
      }

      if (range?.min != null) merged = merged.filter(t => priceOf(t) >= range.min)
      if (range?.max != null) merged = merged.filter(t => priceOf(t) > 0 && priceOf(t) <= range.max)

      merged = merged
        .map(t => ({ ...t, _score: scoreTour(t, terms) }))
        .sort((a, b) => b._score - a._score)

      if (runId !== runIdRef.current) return
      setResults(merged)
      if (m === 'ai') setAiReply({ explanation: `AI didn't find a match, so these are keyword results for "${trimmed}".`, followUps: [] })
    } finally {
      if (runId === runIdRef.current) setLoading(false)
    }
  }

  // Keyword mode searches as you type; AI mode waits for Enter (each call costs).
  const onQueryChange = (value) => {
    setQuery(value)
    if (mode !== 'fts') return
    clearTimeout(debounceRef.current)
    if (value.trim().length < 3) return
    debounceRef.current = setTimeout(() => handleSearch(value, 'fts'), 350)
  }

  const switchMode = (m) => {
    setMode(m)
    setAiReply(null)
    if (query.trim()) handleSearch(query, m)
  }

  const clearSearch = () => {
    clearTimeout(debounceRef.current)
    runIdRef.current++
    setQuery(''); setResults([]); setSearched(false); setAiReply(null); setAiHistory([]); setLoading(false)
    setSearchParams({}, { replace: true })
    inputRef.current?.focus()
  }

  const sorted = (() => {
    const list = [...results]
    if (sort === 'price_asc') return list.sort((a, b) => (priceOf(a) || Infinity) - (priceOf(b) || Infinity))
    if (sort === 'price_desc') return list.sort((a, b) => priceOf(b) - priceOf(a))
    if (sort === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return list
  })()

  const filterActive = budget > 0 || sort !== 'relevance'

  return (
    /* One continuous surface for the whole page — the only "walls" are the
       trip photographs themselves. */
    <div className="relative min-h-screen bg-[#f7f1ff] text-slate-900">
      {/* Ambient wash, fixed so it never seams against a scrolling section */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(124,58,237,0.13),transparent_70%)]" />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-1/3 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(217,70,239,0.07),transparent_70%)]" />

      <Navbar />

      <main className="relative">
        {/* ── Search band — no card, no border, sits straight on the page ── */}
        <div className="sticky top-0 z-30 pt-24 pb-3">
          {/* Soft fade instead of a hard rule, so nothing reads as a box edge */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f7f1ff] via-[#f7f1ff]/95 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" />

          <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={goBack}
                aria-label="Go back"
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white/50 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white/80 hover:text-violet-700 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="relative flex-1">
                {mode === 'ai'
                  ? <Sparkles className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                  : <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => onQueryChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={mode === 'ai' ? 'Describe your dream trip…' : 'Where to? Meghalaya, Spiti, wildlife…'}
                  aria-label="Search trips"
                  className="w-full rounded-full bg-white/60 py-3.5 pl-12 pr-11 text-base font-medium tracking-tight text-slate-900 outline-none ring-1 ring-violet-200/70 backdrop-blur-xl transition placeholder:font-normal placeholder:text-slate-400 focus:bg-white/85 focus:ring-2 focus:ring-violet-400 sm:text-lg"
                />
                {query && (
                  <button onClick={clearSearch} aria-label="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                aria-label="Search"
                className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white shadow-md transition cursor-pointer disabled:opacity-40 ${
                  mode === 'ai' ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500' : 'bg-slate-950 hover:bg-violet-800'
                }`}
              >
                {loading
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Mode + filters — outlined pills, not raised boxes */}
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => switchMode('fts')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  mode === 'fts' ? 'bg-slate-950 text-white' : 'text-slate-600 ring-1 ring-violet-200/70 hover:bg-white/60'
                }`}>
                <Search className="h-3 w-3" /> Search
              </button>
              <button onClick={() => switchMode('ai')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  mode === 'ai' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white' : 'text-slate-600 ring-1 ring-violet-200/70 hover:bg-white/60'
                }`}>
                <Sparkles className="h-3 w-3" /> Ask AI
                <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${mode === 'ai' ? 'bg-white/20' : 'bg-violet-100 text-violet-600'}`}>BETA</span>
              </button>

              <button onClick={() => setShowFilters(o => !o)} aria-expanded={showFilters}
                className={`ml-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  showFilters || filterActive ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300' : 'text-slate-600 ring-1 ring-violet-200/70 hover:bg-white/60'
                }`}>
                <SlidersHorizontal className="h-3 w-3" /> Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                <select
                  value={budget}
                  onChange={e => { setBudget(Number(e.target.value)); if (query.trim()) handleSearch(query, mode) }}
                  aria-label="Budget"
                  className="cursor-pointer rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 outline-none ring-1 ring-violet-200/70 backdrop-blur focus:ring-violet-400"
                >
                  {BUDGETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
                </select>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  aria-label="Sort results"
                  className="cursor-pointer rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 outline-none ring-1 ring-violet-200/70 backdrop-blur focus:ring-violet-400"
                >
                  {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Body — full page width, four columns on a large screen ────── */}
        <div className="relative mx-auto w-full max-w-[1500px] px-5 pb-20 pt-2 sm:px-8 lg:px-10">

          {!searched && (
            <div className="mx-auto max-w-5xl pt-4 sm:pt-8">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {mode === 'ai' ? 'Tell us the trip you have in mind.' : 'Find your next journey.'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'ai'
                  ? 'A sentence is enough — mood, month, who you are travelling with.'
                  : 'Search by destination, activity or a state you have always wanted to see.'}
              </p>

              {mode === 'ai' && (
                <div className="mt-7 flex flex-wrap gap-2">
                  {VIBE_CHIPS.map(chip => (
                    <button key={chip.q} onClick={() => { setQuery(chip.q); handleSearch(chip.q, 'ai') }}
                      className="flex items-center gap-1.5 rounded-full bg-white/55 px-4 py-2 text-sm font-semibold text-violet-800 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white/90 hover:ring-violet-300 cursor-pointer">
                      <span>{chip.emoji}</span> {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {recentSearches.length > 0 && (
                <div className="mt-9">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Clock className="h-3 w-3" /> Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(s => (
                      <button key={s} onClick={() => { setQuery(s); handleSearch(s) }}
                        className="rounded-full px-3.5 py-1.5 text-sm text-slate-600 ring-1 ring-violet-200/60 transition hover:bg-white/70 hover:text-violet-800 cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-9">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <TrendingUp className="h-3 w-3" /> Popular right now
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map(t => (
                    <button key={t} onClick={() => { setQuery(t); handleSearch(t) }}
                      className="rounded-full bg-white/55 px-4 py-2 text-sm font-medium text-violet-800 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white/90 hover:ring-violet-300 cursor-pointer">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI note — tinted glass, no hard card */}
          {aiReply && (
            <div className="mb-6 flex items-start gap-3 rounded-3xl bg-violet-100/50 px-5 py-4 ring-1 ring-violet-200/70 backdrop-blur">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-slate-700">{aiReply.explanation}</p>
                {aiReply.followUps?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiReply.followUps.map(s => (
                      <button key={s} onClick={() => { setQuery(s); handleSearch(s, 'ai') }}
                        className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-white cursor-pointer">
                        {s} <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {searched && !loading && (
            sorted.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-slate-500">
                  {sorted.length} trip{sorted.length !== 1 ? 's' : ''}
                  {query && <> for <span className="font-semibold text-slate-800">{query}</span></>}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {sorted.map(tour => <TourCard key={tour.id} tour={tour} />)}
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-md py-20 text-center">
                <h3 className="text-lg font-bold text-slate-900">Nothing matches that yet</h3>
                <p className="mx-auto mb-5 mt-2 text-sm leading-relaxed text-slate-500">
                  Try a destination on its own — Meghalaya, Spiti, Coorg — or widen the budget.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {budget > 0 && (
                    <button onClick={() => { setBudget(0); handleSearch(query, mode) }}
                      className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-white cursor-pointer">
                      Clear budget
                    </button>
                  )}
                  {mode === 'fts' && (
                    <button onClick={() => switchMode('ai')}
                      className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white cursor-pointer">
                      Let AI try
                    </button>
                  )}
                  <Link to="/itineraries"
                    className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-white">
                    Browse all trips
                  </Link>
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-violet-200/40" />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* Photo-led tile: the image is the card. No white panel, so the page reads as
   one surface with pictures cut into it. */
function TourCard({ tour }) {
  const img = tour.cover || tour.cover_image_url || (Array.isArray(tour.images) ? tour.images.find(u => !isVideo(u)) : null)
  const amount = Number(tour.price_per_person ?? tour.price ?? 0)
  const price = amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'On request'

  return (
    <Link
      to={`/itinerary/${tour.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-violet-200/40 ring-1 ring-violet-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      {img
        ? <img src={img} alt={tour.title} loading="lazy" decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        : <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-violet-200 to-fuchsia-200 text-4xl">🗺️</div>}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {tour.rating > 0 && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />{Number(tour.rating).toFixed(1)}
        </span>
      )}
      {(tour.tag || tour.category) && (
        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
          {tour.tag || tour.category}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="flex items-center gap-1 text-[11px] font-medium text-white/75">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{tour.location}</span>
          {tour.duration_display && <><span className="text-white/40">·</span><span className="truncate">{tour.duration_display}</span></>}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-white">{tour.title}</h3>
        <p className="mt-2 text-sm font-black text-white">
          {price}
          {amount > 0 && <span className="text-[11px] font-medium text-white/60"> / person</span>}
        </p>
      </div>
    </Link>
  )
}