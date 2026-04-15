import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Clock, Star, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

const CATEGORIES = ['All', 'Heritage', 'Trekking', 'Adventure', 'Wildlife', 'Culinary', 'Spiritual', 'Cultural']

export default function HubPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('stories') // stories | creators | trending
  const [stories, setStories] = useState([])
  const [creators, setCreators] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')

  useEffect(() => { loadAll() }, [user])
  useEffect(() => { if (tab === 'stories') loadStories() }, [category])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadStories(), loadCreators(), loadTrending()])
    setLoading(false)
  }

  const loadStories = async () => {
    const { data } = await supabase.rpc('personalized_blog_feed', {
      p_user_id:  user?.id ?? null,
      p_limit:    12,
      p_offset:   0,
      p_category: category === 'All' ? null : category,
    })
    setStories(data || [])
  }

  const loadCreators = async () => {
    const { data } = await supabase
      .from('Users')
      .select('user_id, username, full_name, bio, profile_pic, followers_count, posts_count')
      .eq('is_creator', true)
      .order('followers_count', { ascending: false })
      .limit(12)
    setCreators(data || [])
  }

  const loadTrending = async () => {
    const { data } = await supabase
      .from('Trending_Destinations')
      .select('*')
      .order('trending_percent', { ascending: false })
      .limit(8)
    setTrending(data || [])
  }

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-violet-600 mb-2">Community</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-4">
          The Hub
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Stories, creators, and destinations from the Hoppity travel community.
        </p>
      </div>

      {/* Tab bar */}
      <div className="sticky top-20 z-30 bg-[#f7f1ff]/90 backdrop-blur border-b border-violet-100">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {[
            { id: 'stories',  label: '📖 Stories' },
            { id: 'creators', label: '🎬 Creators' },
            { id: 'trending', label: '🔥 Trending' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
                tab === t.id
                  ? 'border-violet-700 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* ── STORIES ── */}
        {tab === 'stories' && (
          <>
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-8">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer border-2 ${
                    category === cat
                      ? 'bg-violet-700 text-white border-violet-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <StoriesSkeleton />
            ) : stories.length === 0 ? (
              <ComingSoon icon="✍️" title="Stories — Coming Soon" sub="Travel stories, guides and first-hand accounts from Hoppity explorers. The first stories are on their way." />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {stories.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`}
                    className="group bg-white rounded-3xl border border-violet-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
                    {post.cover_image_url ? (
                      <div className="h-44 overflow-hidden">
                        <img src={post.cover_image_url} alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-5xl">
                        {categoryEmoji(post.category)}
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                          {post.category}
                        </span>
                      )}
                      <h3 className="mt-2 font-bold text-slate-900 leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                        {post.author_avatar ? (
                          <img src={post.author_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                            {(post.author_name || 'H').charAt(0)}
                          </div>
                        )}
                        <span className="text-xs text-slate-600 font-medium flex-1 truncate">{post.author_name || 'Hoppity'}</span>
                        {post.author_is_creator && (
                          <span className="bg-violet-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">CREATOR</span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />{post.read_time_minutes}m
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Heart className="w-3 h-3" />{post.likes_count}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CREATORS ── */}
        {tab === 'creators' && (
          <>
            <p className="text-slate-600 mb-8">Travel creators sharing real India with the world.</p>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-slate-100 mb-4" />
                    <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : creators.length === 0 ? (
              <ComingSoon icon="🎬" title="Creator Network — Coming Soon" sub="Meet the travel storytellers and photography explorers behind Hoppity's most inspiring journeys." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                {creators.map(creator => (
                  <div key={creator.user_id} className="bg-white rounded-3xl border border-violet-100 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                      {creator.profile_pic ? (
                        <img src={creator.profile_pic} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
                          {(creator.full_name || creator.username || 'C').charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{creator.full_name || creator.username}</p>
                        <p className="text-xs text-slate-400">@{creator.username}</p>
                        <span className="bg-violet-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block">★ CREATOR</span>
                      </div>
                    </div>
                    {creator.bio && (
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">{creator.bio}</p>
                    )}
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {creator.followers_count || 0} followers</span>
                      <span>{creator.posts_count || 0} posts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TRENDING ── */}
        {tab === 'trending' && (
          <>
            <p className="text-slate-600 mb-8">Destinations travellers are buzzing about right now.</p>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                    <div className="h-40 bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trending.length === 0 ? (
              <ComingSoon icon="🔥" title="Trending — Coming Soon" sub="Curated trending destinations based on what the Hoppity community is booking and exploring." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
                {trending.map(dest => (
                  <Link key={dest.id} to={`/itineraries?state=${encodeURIComponent(dest.location)}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-violet-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
                    <div className="relative h-40 overflow-hidden">
                      {dest.image_url ? (
                        <img src={dest.image_url} alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl">🏔️</div>
                      )}
                      {dest.trending_percent > 0 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ↑ {dest.trending_percent}%
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900">{dest.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{dest.location}</p>
                      {dest.rating > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="font-semibold">{Number(dest.rating).toFixed(1)}</span>
                          <span className="text-slate-400">· {dest.post_count} posts</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Write CTA */}
        <div className="mt-16 bg-gradient-to-br from-violet-700 to-purple-800 rounded-3xl p-8 text-white text-center">
          <h2 className="text-2xl font-black mb-3">Have a story to tell?</h2>
          <p className="text-violet-200 mb-6 max-w-xl mx-auto">
            Write about your travels, share hidden gems, and inspire the next wave of explorers.
          </p>
          <Link to="/auth"
            className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-6 py-3 rounded-2xl hover:bg-violet-50 transition">
            Start writing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StoriesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
          <div className="h-44 bg-slate-100" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function categoryEmoji(cat) {
  const map = { Heritage: '🏛️', Trekking: '🥾', Adventure: '🏄', Wildlife: '🐘', Culinary: '🍛', Spiritual: '🕉️', Cultural: '🎭' }
  return map[cat] || '📝'
}


function ComingSoon({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-4xl mb-5 shadow-sm">{icon}</div>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">{sub}</p>
      <div className="mt-5 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-2xl px-5 py-3">
        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        <span className="text-xs font-semibold text-violet-700">Launching soon</span>
      </div>
    </div>
  )
}
