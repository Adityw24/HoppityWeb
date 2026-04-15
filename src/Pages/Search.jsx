import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Sparkles, X, TrendingUp, Clock, MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlbmh1ZGN5dmxoaWxwZ2F6eWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTY0MTgsImV4cCI6MjA4NTA3MjQxOH0.Jdx993pFvb0JC87NaYhOQ6UR_7UIJBA1mkFQUeoK7bA'

// Vibe chips for AI mode
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
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  
  const [mode, setMode] = useState('ai')
  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState([])
  const [aiReply, setAiReply] = useState(null)
  const [aiHistory, setAiHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [recentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hoppity_recent') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)

  // Auto-search if ?q= param present
  useEffect(() => {
    if (initialQ) {
      setMode('ai')
      handleSearch(initialQ)
    } else {
      inputRef.current?.focus()
    }
  }, [])

  const saveRecent = (q) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6)
    try { localStorage.setItem('hoppity_recent', JSON.stringify(updated)) } catch {}
  }

  const ftsSearch = async (q) => {
    const { data } = await supabase.rpc('search_itineraries', {
      p_query: q.trim(), p_limit: 20, p_offset: 0,
      p_category: null, p_state: null, p_difficulty: null,
      p_min_price: null, p_max_price: null,
    })
    return data || []
  }

  const handleSearch = async (q = query) => {
    const trimmed = (q || '').trim()
    if (!trimmed) return
    setLoading(true); setSearched(true); setAiReply(null)
    saveRecent(trimmed)

    if (mode === 'ai') {
      try {
        const res = await aiSearch(trimmed, aiHistory)
        setResults(res.tours || [])
        setAiReply({ explanation: res.explanation, followUps: res.follow_up_suggestions || [] })
        setAiHistory(h => [...h, { role: 'user', content: trimmed }, { role: 'assistant', content: res.explanation }])
      } catch {
        // fallback to FTS
        const data = await ftsSearch(trimmed)
        setResults(data)
        setAiReply({ explanation: `Showing results for "${trimmed}"`, followUps: [] })
      }
    } else {
      const data = await ftsSearch(trimmed)
      setResults(data)
    }
    setLoading(false)
  }

  const clearSearch = () => {
    setQuery(''); setResults([]); setSearched(false); setAiReply(null); setAiHistory([])
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {/* Search header */}
      <div className="sticky top-20 z-30 bg-[#f7f1ff]/95 backdrop-blur border-b border-violet-100 px-4 py-3 mt-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 relative">
              {mode === 'ai'
                ? <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                : <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={mode === 'ai' ? 'Describe your dream trip… try "peaceful solo trek in October"' : 'Search destinations, experiences…'}
                className="w-full bg-white rounded-2xl border border-violet-100 pl-10 pr-10 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
            <button onClick={() => handleSearch()} disabled={loading || !query.trim()}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition cursor-pointer disabled:opacity-40 ${
                mode === 'ai' ? 'bg-gradient-to-br from-violet-600 to-purple-500 text-white' : 'bg-slate-900 text-white'
              }`}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => { setMode('ai'); clearSearch() }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                mode === 'ai' ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'
              }`}>
              <Sparkles className="w-3 h-3" /> Ask AI
            </button>
            <button onClick={() => { setMode('fts'); clearSearch() }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                mode === 'fts' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}>
              <Search className="w-3 h-3" /> Keyword search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Empty state */}
        {!searched && (
          <>
            {/* Vibe chips (AI mode) */}
            {mode === 'ai' && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Describe what you're looking for</p>
                <div className="flex flex-wrap gap-2">
                  {VIBE_CHIPS.map(chip => (
                    <button key={chip.q} onClick={() => { setQuery(chip.q); handleSearch(chip.q) }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-violet-200 text-sm font-semibold text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition cursor-pointer shadow-sm">
                      <span>{chip.emoji}</span> {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent */}
            {recentSearches.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent
                </p>
                <div className="space-y-1">
                  {recentSearches.map(s => (
                    <button key={s} onClick={() => { setQuery(s); handleSearch(s) }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white transition text-left cursor-pointer">
                      <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Popular destinations
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map(t => (
                  <button key={t} onClick={() => { setQuery(t); handleSearch(t) }}
                    className="px-4 py-2 rounded-full bg-white border border-violet-100 text-sm font-medium text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition cursor-pointer shadow-sm">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* AI explanation card */}
        {aiReply && (
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-relaxed">{aiReply.explanation}</p>
                {aiReply.followUps?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {aiReply.followUps.map(s => (
                      <button key={s} onClick={() => { setQuery(s); handleSearch(s) }}
                        className="flex items-center gap-1 text-xs font-semibold text-violet-700 bg-white border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-50 transition cursor-pointer">
                        <ArrowRight className="w-3 h-3" /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          results.length > 0 ? (
            <>
              <p className="text-sm text-slate-500 mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''}
                {query && <> for <strong className="text-slate-800">"{query}"</strong></>}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map(tour => <TourCard key={tour.id} tour={tour} />)}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900">No trips found</h3>
              <p className="text-slate-500 text-sm mt-2 mb-4">Try different keywords or let AI find something for you</p>
              {mode === 'fts' && (
                <button onClick={() => setMode('ai')} className="text-violet-600 text-sm font-semibold hover:underline cursor-pointer">
                  Switch to AI search →
                </button>
              )}
            </div>
          )
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-violet-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TourCard({ tour }) {
  const img = tour.cover_image_url || (Array.isArray(tour.images) ? tour.images[0] : null)
  const price = tour.price_per_person ? `₹${Number(tour.price_per_person).toLocaleString('en-IN')}` : 'On Request'
  return (
    <Link to={`/itinerary/${tour.slug}`}
      className="group rounded-2xl bg-white border border-violet-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition duration-200 cursor-pointer">
      <div className="relative h-44 overflow-hidden">
        {img
          ? <img src={img} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          : <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center"><span className="text-4xl">🗺️</span></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {tour.tag || tour.category}
          </span>
        </div>
        {tour.rating > 0 && (
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
            ⭐ {Number(tour.rating).toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">{tour.title}</h3>
        <p className="flex items-center gap-1 text-xs text-slate-500 mt-1"><MapPin className="w-3 h-3" />{tour.location}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">{tour.duration_display}</span>
          <span className="text-sm font-bold text-violet-700">{price}</span>
        </div>
      </div>
    </Link>
  )
}
