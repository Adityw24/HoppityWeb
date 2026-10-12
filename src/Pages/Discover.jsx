import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Film, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useReelLive, mergeCounts } from '../hooks/useReelLive'
import { REEL_COLS, hydrateReels, setReelLiked } from '../lib/reels'
import { fetchSavedReelIds, setReelSaved } from '../lib/reelSaves'
import Navbar from '../components/Navbar'
import ReelCard from '../components/ReelCard'
import ReelComments from '../components/ReelComments'

const PAGE = 8
const NAV_H = 68   // fixed Navbar height in px

// Discover is watch-only. Uploading and deleting reels happens on the creator's profile page.
export default function Discover() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const deepLinkId = params.get('reel')

  const [reels, setReels]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [more, setMore]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]       = useState('')
  const [muted, setMuted]       = useState(true)
  const [commentsFor, setCommentsFor] = useState(null)
  const [savedIds, setSavedIds] = useState(() => new Set())

  const scroller = useRef(null)
  const sentinel = useRef(null)
  const busy = useRef(false)

  useReelLive(row => setReels(list => mergeCounts(list, row)))

  // Which reels this user has saved
  useEffect(() => {
    if (!user?.id) { setSavedIds(new Set()); return }
    fetchSavedReelIds(user.id).then(setSavedIds).catch(e => console.error('saved ids:', e))
  }, [user?.id])

  const fetchPage = useCallback(async (before) => {
    let q = supabase.from('Reels').select(REEL_COLS)
      .eq('status', 'published')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE)
    if (before) q = q.lt('created_at', before)
    const { data, error } = await q
    if (error) throw error
    return { rows: await hydrateReels(data || [], user?.id), exhausted: (data || []).length < PAGE }
  }, [user?.id])

  const loadFirst = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { rows, exhausted } = await fetchPage(null)
      let list = rows
      if (deepLinkId) {
        const { data } = await supabase.from('Reels').select(REEL_COLS).eq('id', deepLinkId).maybeSingle()
        if (data) {
          const [hit] = await hydrateReels([data], user?.id)
          list = [hit, ...rows.filter(r => r.id !== hit.id)]
        }
      }
      setReels(list); setMore(!exhausted)
    } catch (e) {
      console.error('discover load:', e)
      setError(e.message || 'Could not load reels')
    } finally { setLoading(false) }
  }, [fetchPage, deepLinkId, user?.id])

  useEffect(() => { loadFirst() }, [loadFirst])

  const loadMore = useCallback(async () => {
    if (busy.current || !more || !reels.length) return
    busy.current = true; setLoadingMore(true)
    try {
      const { rows, exhausted } = await fetchPage(reels[reels.length - 1].created_at)
      setReels(prev => {
        const seen = new Set(prev.map(r => r.id))
        return [...prev, ...rows.filter(r => !seen.has(r.id))]
      })
      setMore(!exhausted)
    } catch (e) { console.error('discover more:', e) }
    finally { busy.current = false; setLoadingMore(false) }
  }, [fetchPage, more, reels])

  useEffect(() => {
    const el = sentinel.current, root = scroller.current
    if (!el || !root) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore() }, { root, rootMargin: '0px 0px 200% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore, reels.length])

  const toggleLike = async (reel) => {
    if (!user) { navigate('/auth'); return }
    const like = !reel.liked
    const apply = (liked, d) => setReels(l => l.map(r => r.id === reel.id
      ? { ...r, liked, likes_count: Math.max(0, r.likes_count + d) } : r))
    apply(like, like ? 1 : -1)                              // optimistic
    try { await setReelLiked(reel.id, user.id, like) }
    catch (e) { console.error('like:', e); apply(!like, like ? -1 : 1) }
  }

  // Save / bookmark (optimistic)
  const toggleSave = async (reel) => {
    if (!user) { navigate('/auth'); return }
    const save = !savedIds.has(reel.id)
    const apply = (on) => setSavedIds(prev => {
      const next = new Set(prev)
      on ? next.add(reel.id) : next.delete(reel.id)
      return next
    })
    apply(save)
    try { await setReelSaved(reel.id, user.id, save) }
    catch (e) { console.error('save:', e); apply(!save) }
  }

  // Book now → checkout of the trip this reel is linked to.
  // The reel id is remembered (localStorage, 30-day window) so the booking can be attributed
  // to the creator even if the user logs in first or comes back later.
  const bookNow = (reel) => {
    const slug = reel.tour?.slug
    if (!slug) return
    try {
      localStorage.setItem('ref_reel', JSON.stringify({ id: reel.id, at: Date.now() }))
    } catch { /* storage blocked: the query param below still carries it */ }
    navigate(`/checkout/${slug}?ref_reel=${reel.id}`)
  }

  const sectionStyle = { height: '100%' }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e0f45] via-[#140a2e] to-[#0b0614]">
      <Navbar />

      {/* Scroller starts BELOW the navbar so snap points line up with the visible area */}
      <div ref={scroller}
        style={{ top: NAV_H, scrollbarWidth: 'none' }}
        className="fixed inset-x-0 bottom-0 snap-y snap-mandatory overflow-y-scroll overscroll-contain [&::-webkit-scrollbar]:hidden">

        {loading && (
          <div style={sectionStyle} className="flex items-center justify-center p-3 sm:p-6">
            <div className="h-full w-full animate-pulse rounded-3xl bg-white/5 sm:w-auto sm:aspect-[9/16]" />
          </div>
        )}

        {!loading && error && (
          <div style={sectionStyle} className="flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-bold">Couldn't load reels</p>
            <p className="max-w-sm break-words text-xs text-white/60">{error}</p>
            <button onClick={loadFirst} className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && reels.length === 0 && (
          <div style={sectionStyle} className="flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <Film className="h-10 w-10 text-violet-300" />
            <h2 className="text-lg font-black">No reels yet</h2>
            <p className="max-w-xs text-sm text-white/60">Creators haven't posted anything yet. Check back soon.</p>
          </div>
        )}

        {reels.map(r => (
          <section key={r.id} style={sectionStyle}
            className="flex snap-start snap-always items-center justify-center sm:py-3">
            <ReelCard reel={r} muted={muted} onToggleMute={() => setMuted(m => !m)}
              onLike={toggleLike} onComments={setCommentsFor}
              saved={savedIds.has(r.id)} onSave={toggleSave}
              onBook={bookNow} />
          </section>
        ))}

        {reels.length > 0 && (
          <div ref={sentinel} className="flex h-24 items-center justify-center text-xs text-white/40">
            {loadingMore ? 'Loading…' : more ? '' : "You're all caught up ✈️"}
          </div>
        )}
      </div>

      {commentsFor && (
        <ReelComments
          reel={reels.find(r => r.id === commentsFor.id) || commentsFor}
          user={user}
          onClose={() => setCommentsFor(null)}
          onNeedAuth={() => navigate('/auth')} />
      )}
    </div>
  )
}