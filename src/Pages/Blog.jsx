import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Clock, Heart, PenLine, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import { setPageSEO } from '../lib/seo'

const CATEGORIES = ['Heritage', 'Trekking', 'Adventure', 'Wildlife', 'Culinary', 'Spiritual', 'Cultural']

export default function BlogPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 12

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title: 'Travel Stories – First-Hand India Travel Guides',
      description: "First-hand travel stories, honest guides, and hidden discoveries from India's most curious travellers. Real experiences from Northeast India, Ladakh, Rajasthan, and beyond.",
      canonical: '/blog',
    })
  }, [])

  useEffect(() => {
    setPage(0)
    load(category, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Deep links (WhatsApp, search engines) have no history to go back to.
  const goBack = () => {
    if (window.history.length > 2) navigate(-1)
    else navigate('/')
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
    /* One continuous surface, same as the home, search and itineraries pages */
    <div className="relative min-h-screen bg-[#f7f1ff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(124,58,237,0.12),transparent_70%)]" />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-1/3 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(217,70,239,0.07),transparent_70%)]" />

      <Navbar />

      <main className="relative mx-auto w-full max-w-[1500px] px-5 pb-20 pt-24 sm:px-8 lg:px-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link to ="/">
            <button
              type="button"
              aria-label="Go back"
              className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-white/50 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white/80 hover:text-violet-700 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            </Link>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Travel stories
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
              First-hand accounts and honest guides from India's most curious travellers.
            </p>
          </div>

          <div className="relative w-full flex-shrink-0 sm:w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stories…"
              aria-label="Search stories"
              className="w-full rounded-full bg-white/60 py-3 pl-11 pr-10 text-sm outline-none ring-1 ring-violet-200/70 backdrop-blur transition placeholder:text-slate-400 focus:bg-white/90 focus:ring-2 focus:ring-violet-400"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Category chips ─────────────────────────────────────── */}
        <div className="mb-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setCategory(null)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              !category
                ? 'bg-slate-950 text-white'
                : 'bg-white/60 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur hover:bg-white hover:text-violet-800'
            }`}
          >
            All stories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? null : cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                category === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/60 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur hover:bg-white hover:text-violet-800'
              }`}
            >
              {categoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>

        {loading && posts.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white/50 ring-1 ring-violet-200/50">
                <div className="aspect-[16/10] w-full bg-violet-200/50" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/3 rounded bg-violet-200/50" />
                  <div className="h-4 w-3/4 rounded bg-violet-100" />
                  <div className="h-3 w-full rounded bg-violet-100" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasPosts ? (
          /* ── Empty / coming soon ─────────────────────────────── */
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/70 text-3xl ring-1 ring-violet-200/70 backdrop-blur">
              {search || category ? '🔍' : '✍️'}
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {search || category ? 'No stories found' : 'Stories — coming soon'}
            </h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
              {search || category
                ? 'Try a different category or clear your search.'
                : "First-hand accounts and hidden discoveries from India's most curious travellers. Our first stories are on their way."}
            </p>

            {(search || category) && (
              <button onClick={() => { setSearch(''); setCategory(null) }}
                className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 cursor-pointer">
                Show all stories
              </button>
            )}

            {!search && !category && (
              <div className="mt-6 w-full max-w-sm">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 ring-1 ring-violet-200/70 backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                  <span className="text-xs font-semibold text-violet-700">Launching soon</span>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-900 px-6 py-7 text-center">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
                    <span className="text-xs text-yellow-400">✨</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-200">Be the first</span>
                  </div>
                  <p className="mb-5 text-sm font-semibold leading-relaxed text-white">
                    {user
                      ? "You're in. Start writing your first travel story."
                      : 'Log in or sign up to write your first travel story.'}
                  </p>
                  <Link to={user ? '/write' : '/auth'}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5">
                    <PenLine className="h-4 w-4" /> {user ? 'Write a story' : 'Log in / Sign up'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Write CTA ─────────────────────────────────────── */}
            <div className="mb-7">
              {user ? (
                <Link to="/write"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
                  <PenLine className="h-4 w-4" /> Write your own story
                </Link>
              ) : (
                <div className="flex w-fit items-center gap-3 rounded-full bg-white/70 px-5 py-3 ring-1 ring-violet-200/70 backdrop-blur">
                  <span className="text-sm text-slate-600">Want to share your journey?</span>
                  <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 transition hover:text-violet-900">
                    Log in or sign up <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-lg font-black tracking-tight text-slate-950">Featured</h2>
                <div className={`grid gap-4 sm:gap-5 ${featured.length === 1 ? '' : 'lg:grid-cols-2'}`}>
                  {featured.map(post => (
                    <FeaturedCard key={post.id} post={post} large={featured.length === 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Latest */}
            {regular.length > 0 && (
              <>
                {featured.length > 0 && (
                  <h2 className="mb-4 text-lg font-black tracking-tight text-slate-950">Latest stories</h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {regular.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              </>
            )}

            {!search && (
              <div className="mt-9 flex justify-center">
                <button
                  onClick={() => {
                    const next = page + 1
                    setPage(next)
                    load(category, next * PER_PAGE)
                  }}
                  disabled={loading}
                  className="rounded-full bg-white/70 px-8 py-3 text-sm font-bold text-violet-800 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Loading…' : 'Load more stories'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/* ── Featured card — photo wide, facts on glass ────────────────────── */
function FeaturedCard({ post, large }) {
  const [failed, setFailed] = useState(false)
  const cover = failed ? null : post.cover_image_url

  return (
    <Link to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/80 ring-1 ring-violet-200/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-violet-950/10">
      <div className={`relative overflow-hidden ${large ? 'aspect-[21/9]' : 'aspect-[16/9]'}`}>
        {cover
          ? <img src={cover} alt={post.title} loading="lazy" onError={() => setFailed(true)}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-400 to-fuchsia-400 text-6xl">
              {categoryEmoji(post.category)}
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-950 backdrop-blur-sm">
          ⭐ Featured
        </span>
        {post.category && (
          <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
            {post.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className={`font-black leading-snug text-slate-950 transition group-hover:text-violet-800 ${large ? 'text-xl' : 'text-lg'}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">{post.excerpt}</p>
        )}
        <PostMeta post={post} />
      </div>
    </Link>
  )
}

/* ── Regular card ──────────────────────────────────────────────────── */
function PostCard({ post }) {
  const [failed, setFailed] = useState(false)
  const cover = failed ? null : post.cover_image_url

  return (
    <Link to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/80 ring-1 ring-violet-200/70 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-violet-950/10 cursor-pointer">
      <div className="relative aspect-[16/10] overflow-hidden">
        {cover
          ? <img src={cover} alt={post.title} loading="lazy" onError={() => setFailed(true)}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-violet-200 to-fuchsia-200 text-5xl">
              {categoryEmoji(post.category)}
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
            {post.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-950 transition group-hover:text-violet-800">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">{post.excerpt}</p>
        )}
        <PostMeta post={post} />
      </div>
    </Link>
  )
}

/* ── Post meta ─────────────────────────────────────────────────────── */
function PostMeta({ post }) {
  return (
    <div className="mt-3 flex items-center gap-3 border-t border-violet-100 pt-3">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" loading="lazy" className="h-5 w-5 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-violet-100">
            <span className="text-[10px] font-bold text-violet-700">
              {(post.author_name || 'H').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="truncate text-xs font-medium text-slate-600">{post.author_name || 'Hoppity'}</span>
        {post.author_is_creator && (
          <span className="flex-shrink-0 rounded bg-violet-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
            CREATOR
          </span>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2.5 text-xs text-slate-400">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.read_time_minutes}m</span>
        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count}</span>
      </div>
    </div>
  )
}

function categoryEmoji(cat) {
  const map = { Heritage: '🏛️', Trekking: '🥾', Adventure: '🏄', Wildlife: '🐘',
    Culinary: '🍛', Spiritual: '🕉️', Cultural: '🎭' }
  return map[cat] || '📝'
}