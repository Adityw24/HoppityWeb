import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Heart, PenLine, Search, X } from 'lucide-react'
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
  const hasPosts = filtered.length > 0

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {/* ── Compact header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-violet-100 pt-16">
        <div className="max-w-6xl mx-auto px-5 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-1">The Stories</p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
                Travel Stories
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-sm leading-relaxed hidden sm:block">
                First-hand accounts and honest guides from India's most curious travellers.
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search stories…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 pt-5 pb-12">
        {/* ── Category chips ──────────────────────────────────────── */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          <button
            onClick={() => setCategory(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border-2 ${
              !category ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? null : cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border-2 ${
                category === cat ? 'bg-violet-700 text-white border-violet-700' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && posts.length === 0 ? (
          // Skeleton
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border border-violet-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasPosts ? (
          /* ── Coming Soon empty state ─────────────────────────── */
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
              {search || category ? '🔍' : '✍️'}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {search || category ? 'No stories found' : 'Stories — Coming Soon'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              {search || category
                ? 'Try a different category or clear your search.'
                : "First-hand accounts and hidden discoveries from India's most curious travellers. Our first stories are on their way."}
            </p>

            {!search && !category && (
              <div className="mt-5 w-full max-w-xs flex flex-col gap-3">
                {/* Launching badge */}
                <div className="flex items-center justify-center gap-2 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-xs font-semibold text-violet-700">Launching soon</span>
                </div>

                {/* Be the First — highlighted CTA */}
                <div className="relative overflow-hidden rounded-2xl shadow-xl">
                  {/* Glow border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 p-[2px]">
                    <div className="absolute inset-0 rounded-2xl" />
                  </div>
                  <div className="relative bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 rounded-2xl px-6 py-6 text-center">
                    {/* Decorative glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-violet-500/20 blur-2xl rounded-full" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-1.5 bg-violet-500/20 border border-violet-400/30 rounded-full px-3 py-1 mb-3">
                        <span className="text-yellow-400 text-xs">✨</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-violet-200">Be the First</span>
                      </div>
                      <p className="text-white font-semibold text-sm leading-relaxed mb-4">
                        {user
                          ? "You're in. Start writing your first travel story."
                          : 'Log in or sign up to write your first travel story.'}
                      </p>
                      {user ? (
                        <Link to="/write"
                          className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-violet-900/40">
                          <PenLine className="w-4 h-4" /> Write a Story
                        </Link>
                      ) : (
                        <Link to="/auth"
                          className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-violet-900/40">
                          ✍️ Log In / Sign Up
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Write CTA banner (when posts exist) ──────────── */}
            <div className="mb-6">
              {user ? (
                <Link to="/write"
                  className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition shadow-sm">
                  <PenLine className="w-4 h-4" /> Write your own story
                </Link>
              ) : (
                <div className="flex items-center gap-3 bg-white border border-violet-200 rounded-2xl px-5 py-3 shadow-sm w-fit">
                  <span className="text-sm text-slate-600">Want to share your journey?</span>
                  <Link to="/auth"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 hover:text-violet-900 transition">
                    Log in or Sign up <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Featured posts */}
            {featured.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Featured</p>
                <div className={`grid gap-5 ${featured.length === 1 ? '' : 'md:grid-cols-2'}`}>
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
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Latest Stories</p>
                )}
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {regular.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              </>
            )}

            {/* Load more */}
            {!search && (
              <div className="flex justify-center mt-8">
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

// ── Featured card ──────────────────────────────────────────────────────
function FeaturedCard({ post, large }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className="group block rounded-3xl overflow-hidden bg-white border border-violet-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
      <div className={`relative overflow-hidden ${large ? 'h-64' : 'h-48'}`}>
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-6xl">📝</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">⭐ Featured</span>
        </div>
      </div>
      <div className="p-5">
        {post.category && (
          <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">{post.category}</span>
        )}
        <h2 className={`font-black text-slate-950 mt-1.5 leading-snug ${large ? 'text-xl' : 'text-base'}`}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-slate-600 text-sm mt-1.5 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <PostMeta post={post} />
      </div>
    </Link>
  )
}

// ── Regular post card ──────────────────────────────────────────────────
function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`}
      className="group block rounded-3xl overflow-hidden bg-white border border-violet-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer">
      <div className="relative h-40 overflow-hidden">
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
      <div className="p-4">
        <h3 className="font-bold text-slate-950 leading-snug line-clamp-2 text-sm">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <PostMeta post={post} />
      </div>
    </Link>
  )
}

// ── Post meta ──────────────────────────────────────────────────────────
function PostMeta({ post }) {
  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-violet-700">
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
      <div className="flex items-center gap-2.5 text-xs text-slate-400 flex-shrink-0">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time_minutes}m</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count}</span>
      </div>
    </div>
  )
}

function categoryEmoji(cat) {
  const map = { Heritage: '🏛️', Trekking: '🥾', Adventure: '🏄', Wildlife: '🐘',
    Culinary: '🍛', Spiritual: '🕉️', Cultural: '🎭' }
  return map[cat] || '📝'
}
