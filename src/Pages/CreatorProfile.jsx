import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, MessageCircle, Film, BookOpen, Bookmark, Play, X, AlertTriangle, UserPlus, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { REEL_COLS, fetchAuthors, fmtCount, timeAgo } from '../lib/reels'
import { fetchSavedReelIds } from '../lib/reelsaves'
import Navbar from '../components/Navbar'

// Route: /creator/:id
// Assumed tables (rename below if yours differ):
//   Follows(follower_id, following_id)
//   Blogs(id, author_id, title, slug, excerpt, cover_url, status, created_at)
const FOLLOWS = 'Follows'
const BLOGS = 'Blogs'

const count = async (q) => {
  const { count: c, error } = await q
  if (error) { console.error('count:', error); return 0 }
  return c || 0
}

function Avatar({ u, size = 'h-10 w-10', text = 'text-xs' }) {
  const name = u?.full_name || u?.username || '?'
  return (
    <span className={`${size} ${text} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-purple-600 font-black text-white`}>
      {u?.profile_pic
        ? <img src={u.profile_pic} alt="" className="h-full w-full object-cover" />
        : name.slice(0, 2).toUpperCase()}
    </span>
  )
}

function Stat({ value, label, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`text-center ${onClick ? 'cursor-pointer transition hover:opacity-70' : ''}`}>
      <p className="text-xl font-black text-slate-950">{fmtCount(value)}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </Tag>
  )
}

function ReelTile({ reel, creatorId }) {
  return (
    <Link to={`/discover?creator=${creatorId}&reel=${reel.id}`}
      className="group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-violet-200/50 ring-1 ring-violet-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-950/10">
      {reel.thumbnail_url
        ? <img src={reel.thumbnail_url} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        : <video src={reel.video_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <Play className="absolute right-2 top-2 h-4 w-4 fill-white text-white drop-shadow" />
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3 text-xs font-bold text-white drop-shadow">
        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{fmtCount(reel.likes_count || 0)}</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{fmtCount(reel.comments_count || 0)}</span>
      </div>
    </Link>
  )
}

function BlogCard({ blog }) {
  return (
    <Link to={blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`}
      className="group overflow-hidden rounded-2xl bg-white ring-1 ring-violet-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-950/10">
      {blog.cover_url && <img src={blog.cover_url} alt="" className="h-40 w-full object-cover" />}
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-black text-slate-900">{blog.title}</h3>
        {blog.excerpt && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{blog.excerpt}</p>}
        <p className="mt-2 text-[11px] text-slate-400">{timeAgo(blog.created_at)}</p>
      </div>
    </Link>
  )
}

function Empty({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon className="h-9 w-9 text-violet-400" />
      <p className="text-sm font-black text-slate-800">{title}</p>
      <p className="max-w-xs text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function FollowersModal({ creatorId, onClose }) {
  const [people, setPeople] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data } = await supabase.from(FOLLOWS).select('follower_id')
        .eq('following_id', creatorId).limit(100)
      const ids = (data || []).map(r => r.follower_id)
      const map = ids.length ? await fetchAuthors(ids) : {}
      if (alive) setPeople(ids.map(id => ({ id, ...(map[id] || {}) })))
    })().catch(e => { console.error('followers:', e); if (alive) setPeople([]) })
    return () => { alive = false }
  }, [creatorId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <button aria-label="Close followers" onClick={onClose} className="fixed inset-0 z-[70] cursor-default bg-black/40" />
      <div role="dialog" aria-label="Followers"
        className="fixed left-1/2 top-1/2 z-[71] flex max-h-[70dvh] w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-black text-slate-900">Followers</h3>
          <button onClick={onClose} className="cursor-pointer rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {people === null && <li className="text-xs text-slate-400">Loading…</li>}
          {people?.length === 0 && <li className="py-8 text-center text-xs text-slate-400">No followers yet.</li>}
          {people?.map(p => (
            <li key={p.id}>
              <Link to={`/creator/${p.id}`} onClick={onClose} className="flex items-center gap-3">
                <Avatar u={p} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-800">{p.full_name || p.username || 'Traveller'}</span>
                  {p.username && <span className="block truncate text-xs text-slate-400">@{p.username}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function CreatorProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.id === id

  const [creator, setCreator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ followers: 0, following: 0, reels: 0 })
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)

  const [tab, setTab] = useState('reels')
  const [tabData, setTabData] = useState({})        // { reels, blogs, saved }
  const [tabLoading, setTabLoading] = useState(false)

  // ---------- header + stats ----------
  const loadHeader = useCallback(async () => {
    setLoading(true); setError('')
    setTab('reels'); setTabData({})
    try {
      const map = await fetchAuthors([id])
      const c = map?.[id]
      if (!c) { setCreator(null); setError('This creator could not be found.'); return }
      setCreator(c)

      const [followers, followingN, reels] = await Promise.all([
        count(supabase.from(FOLLOWS).select('*', { count: 'exact', head: true }).eq('following_id', id)),
        count(supabase.from(FOLLOWS).select('*', { count: 'exact', head: true }).eq('follower_id', id)),
        count(supabase.from('Reels').select('id', { count: 'exact', head: true })
          .eq('creator_id', id).eq('status', 'published').not('video_url', 'is', null)),
      ])
      setStats({ followers, following: followingN, reels })

      if (user?.id && user.id !== id) {
        const { data } = await supabase.from(FOLLOWS).select('follower_id')
          .eq('follower_id', user.id).eq('following_id', id).maybeSingle()
        setFollowing(!!data)
      } else setFollowing(false)
    } catch (e) {
      console.error('creator load:', e)
      setError(e.message || 'Could not load this profile')
    } finally { setLoading(false) }
  }, [id, user?.id])

  useEffect(() => { loadHeader() }, [loadHeader])

  // ---------- tab content (loaded on first visit) ----------
  useEffect(() => {
    if (!creator || tabData[tab]) return
    let alive = true
    setTabLoading(true)
    ;(async () => {
      let rows = []
      if (tab === 'reels') {
        const { data, error } = await supabase.from('Reels').select(REEL_COLS)
          .eq('creator_id', id).eq('status', 'published').not('video_url', 'is', null)
          .order('created_at', { ascending: false }).limit(60)
        if (error) throw error
        rows = data || []
      } else if (tab === 'blogs') {
        const { data, error } = await supabase.from(BLOGS)
          .select('id,title,slug,excerpt,cover_url,created_at')
          .eq('author_id', id).eq('status', 'published')
          .order('created_at', { ascending: false }).limit(60)
        if (error) throw error
        rows = data || []
      } else if (tab === 'saved' && isOwner) {
        const ids = [...(await fetchSavedReelIds(user.id))]
        if (ids.length) {
          const { data, error } = await supabase.from('Reels').select(REEL_COLS)
            .in('id', ids).eq('status', 'published').not('video_url', 'is', null)
          if (error) throw error
          rows = data || []
        }
      }
      if (alive) setTabData(d => ({ ...d, [tab]: rows }))
    })()
      .catch(e => { console.error(`${tab} load:`, e); if (alive) setTabData(d => ({ ...d, [tab]: [] })) })
      .finally(() => { if (alive) setTabLoading(false) })
    return () => { alive = false }
  }, [tab, creator, id, isOwner, user?.id, tabData])

  // ---------- follow / unfollow (optimistic) ----------
  const toggleFollow = async () => {
    if (!user) { navigate('/auth'); return }
    if (followBusy || isOwner) return
    const next = !following
    setFollowBusy(true)
    setFollowing(next)
    setStats(s => ({ ...s, followers: Math.max(0, s.followers + (next ? 1 : -1)) }))
    const { error } = next
      ? await supabase.from(FOLLOWS).insert({ follower_id: user.id, following_id: id })
      : await supabase.from(FOLLOWS).delete().eq('follower_id', user.id).eq('following_id', id)
    if (error) {
      console.error('follow:', error)
      setFollowing(!next)
      setStats(s => ({ ...s, followers: Math.max(0, s.followers + (next ? -1 : 1)) }))
    }
    setFollowBusy(false)
  }

  const name = creator?.full_name || creator?.username || 'Traveller'
  const tabs = [
    { key: 'reels', label: 'Reels', icon: Film },
    { key: 'blogs', label: 'Blogs', icon: BookOpen },
    ...(isOwner ? [{ key: 'saved', label: 'Saved', icon: Bookmark }] : []),
  ]
  const rows = tabData[tab]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f1ff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(124,58,237,0.10),transparent_70%)]" />
      <Navbar />

      <main className="relative mx-auto max-w-4xl px-4 pb-16 pt-28">
        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-40 w-40 rounded-full bg-violet-200/50 sm:h-48 sm:w-48" />
              <div className="h-6 w-44 rounded bg-violet-200/50" />
              <div className="h-3 w-28 rounded bg-violet-200/40" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-2xl bg-violet-200/40" />)}</div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button onClick={loadHeader} className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200/70 hover:bg-violet-50">Retry</button>
          </div>
        )}

        {!loading && !error && creator && (
          <>
            {/* Header — centred */}
            <section className="flex flex-col items-center text-center">
              <span className="flex h-40 w-40 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-5xl font-black text-white shadow-xl shadow-violet-950/20 ring-4 ring-white sm:h-48 sm:w-48 sm:text-6xl">
                {creator.profile_pic
                  ? <img src={creator.profile_pic} alt={name} className="h-full w-full object-cover" />
                  : name.slice(0, 2).toUpperCase()}
              </span>

              <h1 className="mt-5 max-w-full truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{name}</h1>
              {creator.username && <p className="mt-0.5 text-sm font-medium text-slate-500">@{creator.username}</p>}
              {creator.bio && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{creator.bio}</p>}

              <div className="mt-5 flex items-center justify-center gap-10">
                <Stat value={stats.reels} label="Reels" />
                <Stat value={stats.followers} label="Followers" onClick={() => setShowFollowers(true)} />
                <Stat value={stats.following} label="Following" />
              </div>

              {!isOwner && (
                <button onClick={toggleFollow} disabled={followBusy}
                  className={`mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-2.5 text-sm font-black transition disabled:opacity-60 ${
                    following
                      ? 'bg-white text-violet-800 ring-1 ring-violet-200 hover:bg-violet-50'
                      : 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-950/20 hover:scale-105'}`}>
                  {following ? <><UserCheck className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
                </button>
              )}
            </section>

            {/* Tabs */}
            <div className="mt-10 flex justify-center gap-1 border-b border-violet-200/70">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
                    tab === t.key ? 'border-violet-600 text-violet-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="mt-6">
              {(tabLoading || !rows) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[...Array(6)].map((_, i) => <div key={i} className="aspect-[9/16] animate-pulse rounded-2xl bg-violet-200/40" />)}
                </div>
              )}

              {rows && !tabLoading && tab === 'reels' && (rows.length
                ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{rows.map(r => <ReelTile key={r.id} reel={r} creatorId={id} />)}</div>
                : <Empty icon={Film} title="No reels yet" hint={`${name} hasn't posted any reels.`} />)}

              {rows && !tabLoading && tab === 'blogs' && (rows.length
                ? <div className="grid gap-4 sm:grid-cols-2">{rows.map(b => <BlogCard key={b.id} blog={b} />)}</div>
                : <Empty icon={BookOpen} title="No blogs yet" hint={`${name} hasn't published any blogs.`} />)}

              {rows && !tabLoading && tab === 'saved' && (rows.length
                ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{rows.map(r => <ReelTile key={r.id} reel={r} creatorId={r.creator_id} />)}</div>
                : <Empty icon={Bookmark} title="Nothing saved" hint="Reels you save will show up here. Only you can see this tab." />)}
            </div>
          </>
        )}
      </main>

      {showFollowers && <FollowersModal creatorId={id} onClose={() => setShowFollowers(false)} />}
    </div>
  )
}