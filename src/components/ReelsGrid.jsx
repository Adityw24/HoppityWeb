import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Play, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setReelLiked, deleteReel, fmtCount } from '../lib/reels'
import { useReelLive, mergeCounts } from '../hooks/useReelLive'
import ReelCard from './ReelCard'
import ReelComments from './ReelComments'

// Instagram-style 3-column grid of a creator's reels. Tapping a tile opens a
// full-screen viewer with the same card (likes + realtime comments) as Discover.
// `reels` must already be hydrated (creator + liked). Tile counts update live.
export default function ReelsGrid({ reels, setReels, user, isOwner, emptyAction }) {
  const navigate = useNavigate()
  const [openId, setOpenId]     = useState(null)
  const [commentsFor, setCommentsFor] = useState(null)
  const [muted, setMuted]       = useState(true)

  useReelLive(row => setReels(list => mergeCounts(list, row)))

  const open = reels.find(r => r.id === openId) || null

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !commentsFor) setOpenId(null) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, commentsFor])

  const toggleLike = async (reel) => {
    if (!user) { navigate('/auth'); return }
    const like = !reel.liked
    const apply = (liked, delta) => setReels(l => l.map(r => r.id === reel.id
      ? { ...r, liked, likes_count: Math.max(0, r.likes_count + delta) } : r))
    apply(like, like ? 1 : -1)
    try { await setReelLiked(reel.id, user.id, like) }
    catch (e) { console.error('like:', e); apply(!like, like ? -1 : 1) }
  }

  const remove = async (reel) => {
    if (!confirm('Delete this reel permanently? Its likes and comments go with it.')) return
    try {
      await deleteReel(reel)
      setReels(l => l.filter(r => r.id !== reel.id))
      setOpenId(null)
    } catch (e) { console.error('deleteReel:', e); alert('Could not delete reel. Try again.') }
  }

  if (!reels.length) return (
    <div className="rounded-2xl border border-violet-100 bg-white py-14 text-center">
      <div className="mb-4 text-5xl">🎬</div>
      <h3 className="font-bold text-slate-900">No reels yet</h3>
      <p className="mt-1 text-sm text-slate-500">{isOwner ? 'Share a short clip from your travels' : 'Nothing posted yet'}</p>
      {emptyAction}
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl sm:gap-1.5">
        {reels.map(r => (
          <button key={r.id} type="button" onClick={() => setOpenId(r.id)}
            className="group relative aspect-[3/4] overflow-hidden bg-slate-900 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            {r.thumbnail_url
              ? <img src={r.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              : <video src={`${r.video_url}#t=0.5`} preload="metadata" muted playsInline className="h-full w-full object-cover" />}
            <Play className="absolute right-2 top-2 h-4 w-4 fill-white text-white drop-shadow" />
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/45 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="flex items-center gap-1"><Heart className="h-4 w-4 fill-white" />{fmtCount(r.likes_count)}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4 fill-white" />{fmtCount(r.comments_count)}</span>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-0 sm:p-6">
          <button onClick={() => setOpenId(null)} aria-label="Close"
            className="absolute right-4 top-4 z-[65] grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
          <div className="h-full w-full sm:h-[min(92dvh,880px)] sm:w-auto">
            <ReelCard reel={open} muted={muted} onToggleMute={() => setMuted(m => !m)}
              onLike={toggleLike} onComments={setCommentsFor}
              isOwner={isOwner} onDelete={remove} />
          </div>
          {commentsFor && (
            <ReelComments reel={open} user={user}
              onClose={() => setCommentsFor(null)} onNeedAuth={() => navigate('/auth')} />
          )}
        </div>
      )}
    </>
  )
}