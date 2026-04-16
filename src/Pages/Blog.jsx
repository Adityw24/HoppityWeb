import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Heart, MessageCircle, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import { setPageSEO } from '../lib/seo'

const CATEGORIES = ['Heritage', 'Trekking', 'Adventure', 'Wildlife', 'Culinary', 'Spiritual', 'Cultural']

export default function BlogPage() {
  useEffect(() => {
    setPageSEO({
      title: 'Travel Stories – First-Hand India Travel Guides',
      description: "First-hand travel stories, honest guides, and hidden discoveries from India's most curious travellers. Real experiences from Northeast India, Ladakh, Rajasthan, and beyond.",
      canonical: '/blog',
    })
  }, [])

  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 12

  useEffect(() => {
    setPage(0)
    load(category, 0)
  }, [category, user])

  const load = async (cat, offset = 0) => {
    setLoading(true)
    const { data } = await supabase.rpc('personalized_blog_feed', {
      p_user_id:  user?.id ?? null,
      p_limit:    PER_PAGE,
      p_offset:   offset,
      p_category: cat ?? null,
    })
    if (offset === 0) {
      setPosts(data || [])
    } else {
      setPosts(prev => [...prev, ...(data || [])])
    }
    setLoading(false)
  }

  const filtered = search.trim()
    ? posts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase()))
    : posts

  const featured = filtered.filter(p => p.is_featured)
  const regular  = filtered.filter(p => !p.is_featured)

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      {/* Header */}
      <div className="bg-white border-b border-violet-100 pt-20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-violet-600 mb-2">The Stories</p>
              <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
                Travel Stories
              </h1>
              <p className="mt-3 text-lg text-slate-600 max-w-xl">
                First-hand accounts, hidden discoveries, and honest guides from India's most curious travellers.
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search stories…"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setCategory(null)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer border-2 ${
              !category ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? null : cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer border-2 ${
                category === cat ? 'bg-violet-700 text-white border-violet-700' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && posts.length === 0 ? (
          // Skeleton
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border border-violet-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-4xl mb-5 shadow-sm">
              {search || category ? '🔍' : '✍️'}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {search || category ? 'No stories found' : 'Stories — Coming Soon'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              {search || category
                ? 'Try a different category or clear your search.'
                : 'First-hand accounts, hidden discoveries, and honest guides from India\'s most curious travellers. Our first stories are on their way.'}
            </p>
            {!search && !category && (
              <div className="mt-5 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-2xl px-5 py-3">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-semibold text-violet-700">Launching soon</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Featured posts (full-width or 2-col) */}
            {featured.length > 0 && (
              <div className="mb-10">
                <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-4">Featured</p>
                <div className={`grid gap-6 ${featured.length === 1 ? '' : 'md:grid-cols-2'}`}>
                  {featured.map(post => (
                    <FeaturedCard key={post.id} post={post} large={featured.length === 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular grid */}
            {regular.length > 0 && (
              <>
                {featured.length > 0 && (
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-4">Latest Stories</p>
                )}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {regular.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              </>
            )}

            {/* Load more */}
            {!search && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => {
                    const next = page + 1
                    setPage(next)
                    load(category, next * PER_PAGE)
                  }}
                  disabled={loading}
                  className="rounded-2xl bg-white border border-violet-200 px-8 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Loading…' : 'Load more stories →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Featured card (large hero style) ─────────────────────────────────
function FeaturedCard({ post, large }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className={`group block rounded-3xl overflow-hidden bg-white border border-violet-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 ${large ? '' : ''}`}>
      <div className={`relative overflow-hidden ${large ? 'h-72' : 'h-52'}`}>
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-7xl">📝</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">⭐ Featured</span>
        </div>
      </div>
      <div className="p-6">
        {post.category && (
          <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">{post.category}</span>
        )}
        <h2 className={`font-black text-slate-950 mt-2 leading-snug ${large ? 'text-2xl' : 'text-lg'}`}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-slate-600 text-sm mt-2 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <PostMeta post={post} />
      </div>
    </Link>
  )
}

// ── Regular post card ─────────────────────────────────────────────────
function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className="group block rounded-3xl overflow-hidden bg-white border border-violet-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer">
      <div className="relative h-44 overflow-hidden">
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <span className="text-5xl">{categoryEmoji(post.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        {post.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/15 backdrop-blur border border-white/25 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {post.category}
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-950 leading-snug line-clamp-2 text-base">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-slate-500 text-sm mt-1.5 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <PostMeta post={post} />
      </div>
    </Link>
  )
}

// ── Post meta row ─────────────────────────────────────────────────────
function PostMeta({ post }) {
  return (
    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
      {/* Author */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-violet-700">
              {(post.author_name || 'H').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-xs text-slate-600 font-medium truncate">{post.author_name || 'Hoppity'}</span>
        {post.author_is_creator && (
          <span className="flex-shrink-0 bg-violet-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            CREATOR
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {post.read_time_minutes}m
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" /> {post.likes_count}
        </span>
      </div>
    </div>
  )
}

function categoryEmoji(cat) {
  const map = { Heritage: '🏛️', Trekking: '🥾', Adventure: '🏄', Wildlife: '🐘',
    Culinary: '🍛', Spiritual: '🕉️', Cultural: '🎭' }
  return map[cat] || '📝'
}
