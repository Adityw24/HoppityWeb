import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Clock, Star, RefreshCw, ArrowRight, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

export default function ForYouPage() {
  const { user, loading: authLoading } = useAuth()
  const [tours, setTours] = useState([])
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    if (!authLoading) load()
  }, [user, authLoading])

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    await Promise.all([loadTours(), loadBlogs()])

    if (isRefresh) setRefreshing(false)
    else setLoading(false)
  }

  const loadTours = async () => {
    if (!user) {
      // Anonymous — show top-rated tours
      const { data } = await supabase
        .from('Itineraries')
        .select('id,slug,title,location,category,difficulty,duration_display,price_per_person,cover_image_url,rating,review_count,blurb')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(6)
      setTours(data || [])
      setExplanation('Sign in to get personalised recommendations based on your bookings and interests.')
      return
    }

    // Authenticated — call personalize-feed edge function
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`https://wenhudcyvlhilpgazylg.supabase.co/functions/v1/personalize-feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ limit: 6 }),
      })
      if (res.ok) {
        const json = await res.json()
        setTours(json.tours || json.recommendations || [])
        setExplanation(json.explanation || 'Personalised just for you based on your travel history.')
        return
      }
    } catch (_) {}

    // Fallback if edge function fails
    const { data } = await supabase
      .from('Itineraries')
      .select('id,slug,title,location,category,difficulty,duration_display,price_per_person,cover_image_url,rating,review_count,blurb')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(6)
    setTours(data || [])
    setExplanation('Top rated tours picked for you.')
  }

  const loadBlogs = async () => {
    const { data } = await supabase.rpc('personalized_blog_feed', {
      p_user_id:  user?.id ?? null,
      p_limit:    4,
      p_offset:   0,
      p_category: null,
    })
    setBlogs(data || [])
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f1ff]">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 pt-32">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-violet-200 rounded-full w-48" />
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden">
                  <div className="h-44 bg-slate-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-sm font-bold mb-3">
              <Sparkles className="w-4 h-4" />
              {user ? `For ${user.user_metadata?.full_name?.split(' ')[0] || 'You'}` : 'For You'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-3">
              Your personalised feed
            </h1>
            {explanation && (
              <p className="text-slate-600 max-w-2xl">{explanation}</p>
            )}
          </div>
          {user && (
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-violet-200 text-violet-700 rounded-2xl px-4 py-2.5 text-sm font-semibold hover:bg-violet-50 transition disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Sign-in nudge for anon users */}
        {!user && (
          <div className="bg-white border border-violet-100 rounded-3xl p-6 mb-10 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">Get truly personal recommendations</p>
              <p className="text-sm text-slate-500 mt-0.5">Sign in and your feed learns from your bookings, saves, and search history.</p>
            </div>
            <Link to="/auth" className="flex-shrink-0 bg-violet-700 text-white rounded-2xl px-5 py-2.5 text-sm font-semibold hover:bg-violet-800 transition">
              Sign In
            </Link>
          </div>
        )}

        {/* Recommended Tours */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900">
              {user ? '✨ Picked for you' : '⭐ Top rated tours'}
            </h2>
            <Link to="/itineraries" className="text-sm font-semibold text-violet-700 hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {tours.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-violet-100">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-slate-500">No recommendations yet — explore our itineraries!</p>
              <Link to="/itineraries" className="mt-4 inline-block bg-violet-700 text-white rounded-2xl px-6 py-3 text-sm font-semibold hover:bg-violet-800 transition">
                Browse tours
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tours.map(tour => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </section>

        {/* Recommended Stories */}
        {blogs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">📖 Stories you might like</h2>
              <Link to="/hub" className="text-sm font-semibold text-violet-700 hover:underline flex items-center gap-1">
                See all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
              {blogs.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-violet-100 hover:shadow-md transition cursor-pointer">
                  {post.cover_image_url ? (
                    <div className="h-32 overflow-hidden">
                      <img src={post.cover_image_url} alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </div>
                  ) : (
                    <div className="h-32 bg-violet-50 flex items-center justify-center text-4xl">📝</div>
                  )}
                  <div className="p-3">
                    <p className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{post.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{post.read_time_minutes} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function TourCard({ tour }) {
  return (
    <Link to={`/itinerary/${tour.slug}`}
      className="group bg-white rounded-3xl overflow-hidden border border-violet-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
      <div className="relative h-44 overflow-hidden">
        {tour.cover_image_url ? (
          <img src={tour.cover_image_url} alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-5xl">🏔️</div>
        )}
        {tour.category && (
          <div className="absolute top-3 left-3 bg-white/15 backdrop-blur border border-white/25 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {tour.category}
          </div>
        )}
        {tour.difficulty && (
          <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${
            tour.difficulty === 'Easy' ? 'bg-green-500 text-white' :
            tour.difficulty === 'Challenging' ? 'bg-red-500 text-white' :
            'bg-amber-500 text-white'
          }`}>
            {tour.difficulty}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-950 leading-snug line-clamp-2">{tour.title}</h3>
        {tour.blurb && (
          <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{tour.blurb}</p>
        )}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="w-3 h-3" /> {tour.location}
          </span>
          {tour.duration_display && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" /> {tour.duration_display}
            </span>
          )}
          <div className="ml-auto">
            {tour.price_per_person > 0 ? (
              <span className="font-black text-violet-700 text-sm">
                ₹{Number(tour.price_per_person).toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-xs text-slate-400">On Request</span>
            )}
          </div>
        </div>
        {tour.rating > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="font-semibold">{Number(tour.rating).toFixed(1)}</span>
            {tour.review_count > 0 && <span className="text-slate-400">({tour.review_count})</span>}
          </div>
        )}
      </div>
    </Link>
  )
}
