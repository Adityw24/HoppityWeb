import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Play, MapPin, Ticket } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmtCount, timeAgo } from '../lib/reels'
import { shareReel } from '../lib/reelshare'
import ReelMenu from './ReelMenu'

// Same look for every rail button. On mobile they sit on the video (dark pill),
// on desktop they sit outside it on the page background.
const RAIL_BTN =
  'grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition active:scale-90 ' +
  'sm:bg-white/10 sm:hover:bg-white/20 cursor-pointer'

// Creator, caption, trip + location, Book now.
// Module scope on purpose (a component defined inside ReelCard would remount on every render).
function ReelInfo({ reel, name, creator, expanded, onToggleExpand, onBook }) {
  const trip = reel.tour
  return (
    <div className="text-white">
      <Link to={`/creator/${reel.creator_id}`} className="inline-flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-black ring-2 ring-white/80">
          {creator?.profile_pic
            ? <img src={creator.profile_pic} alt="" className="h-full w-full object-cover" />
            : name.slice(0, 2).toUpperCase()}
        </span>
        <span className="text-sm font-bold drop-shadow">{name}</span>
        <span className="text-xs text-white/70">· {timeAgo(reel.created_at)}</span>
      </Link>

      {reel.caption && (
        <p onClick={onToggleExpand}
          className={`mt-2 cursor-pointer text-sm leading-snug drop-shadow ${expanded ? '' : 'line-clamp-2'}`}>
          {reel.caption}
        </p>
      )}

      {(trip?.title || reel.location) && (
        <div className="mt-3 space-y-1">
          {trip?.title && (
            trip.slug
              ? <Link to={`/itinerary/${trip.slug}`} className="block text-sm font-black leading-tight drop-shadow hover:underline">{trip.title}</Link>
              : <p className="text-sm font-black leading-tight drop-shadow">{trip.title}</p>
          )}
          {reel.location && (
            <p className="flex items-center gap-1 text-xs font-medium text-white/80">
              <MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate">{reel.location}</span>
            </p>
          )}
        </div>
      )}

      {/* Book now only appears when the reel is linked to a trip */}
      {trip?.slug && (
        <button type="button" onClick={() => onBook?.(reel)}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition hover:scale-105 cursor-pointer">
          <Ticket className="h-4 w-4" /> Book now
        </button>
      )}
    </div>
  )
}

// One full-height reel. Plays while ≥60% visible, pauses otherwise.
// Tap = play/pause, double-tap = like. Counts are controlled by the parent (kept live via useReelLive).
export default function ReelCard({
  reel, muted, onToggleMute, onLike, onComments, onSave, saved, onBook, autoPlay = true,
}) {
  const wrapRef  = useRef(null)
  const videoRef = useRef(null)
  const barRef   = useRef(null)
  const viewed   = useRef(false)
  const lastTap  = useRef(0)
  const tapTimer = useRef(null)
  const noteTimer = useRef(null)

  const [paused, setPaused]     = useState(false)
  const [burst, setBurst]       = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [failed, setFailed]     = useState(false)
  const [note, setNote]         = useState('')

  const c = reel.creator
  const name = c?.full_name || c?.username || 'Traveller'

  const flash = (msg) => {
    setNote(msg)
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 1800)
  }
  useEffect(() => () => clearTimeout(noteTimer.current), [])

  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted }, [muted])

  useEffect(() => {
    const el = wrapRef.current, v = videoRef.current
    if (!el || !v || !autoPlay) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        v.play().then(() => setPaused(false)).catch(() => setPaused(true))
        if (!viewed.current) {
          viewed.current = true
          supabase.rpc('increment_reel_view', { p_reel_id: reel.id }).then(() => {}, () => {})
        }
      } else {
        v.pause()
        v.currentTime = 0
      }
    }, { threshold: [0, 0.6, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [reel.id, autoPlay])

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return
    if (v.paused) { v.play().then(() => setPaused(false)).catch(() => {}) }
    else { v.pause(); setPaused(true) }
  }

  const onSurfaceClick = () => {
    const now = Date.now()
    if (now - lastTap.current < 280) {
      clearTimeout(tapTimer.current)
      lastTap.current = 0
      if (!reel.liked) onLike(reel)
      setBurst(true); setTimeout(() => setBurst(false), 700)
      return
    }
    lastTap.current = now
    tapTimer.current = setTimeout(togglePlay, 285)
  }
  useEffect(() => () => clearTimeout(tapTimer.current), [])

  const onTime = () => {
    const v = videoRef.current
    if (v && barRef.current && v.duration) barRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`
  }

  const handleShare = async () => {
    const r = await shareReel(reel)
    if (r === 'copied') flash('Link copied')
    else if (r === 'failed') flash('Could not share')
  }

  const handleSave = () => {
    onSave?.(reel)
    flash(saved ? 'Removed from saved' : 'Saved')
  }

  const infoProps = {
    reel, name, creator: c, expanded, onBook,
    onToggleExpand: () => setExpanded(e => !e),
  }

  return (
    // Not overflow-hidden: the action rail (and, on wide screens, the info block) sit OUTSIDE the video.
    <div ref={wrapRef} className="relative h-full w-full sm:w-auto sm:aspect-[9/16]">

      {/* Video clip */}
      <div className="absolute inset-0 overflow-hidden bg-black sm:rounded-3xl sm:shadow-2xl sm:shadow-violet-950/50">
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/70">
            This video couldn't be played.
          </div>
        ) : (
          <video ref={videoRef} src={reel.video_url} poster={reel.thumbnail_url || undefined}
            loop playsInline muted={muted} preload="metadata"
            onTimeUpdate={onTime} onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover" />
        )}

        <button type="button" aria-label={paused ? 'Play' : 'Pause'} onClick={onSurfaceClick}
          className="absolute inset-0 z-10 cursor-pointer focus:outline-none" />

        {paused && !failed && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-black/45 backdrop-blur"><Play className="h-7 w-7 fill-white text-white" /></div>
          </div>
        )}
        {burst && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
            <Heart className="h-24 w-24 animate-ping fill-white text-white drop-shadow-lg" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Info ON the video (mobile, tablet, small laptops) */}
        <div className="absolute bottom-5 left-4 right-16 z-30 xl:hidden">
          <ReelInfo {...infoProps} />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 h-[3px] bg-white/20">
          <div ref={barRef} className="h-full w-0 bg-white" />
        </div>
      </div>

      {/* Info OUTSIDE the video, bottom-left (wide screens) */}
      <div className="absolute bottom-6 right-full z-30 mr-6 hidden w-64 xl:block">
        <ReelInfo {...infoProps} />
      </div>

      {/* Action rail: on the video on mobile, beside it from sm up */}
      <div className="absolute bottom-6 right-3 z-30 flex flex-col items-center gap-4 text-white sm:left-full sm:right-auto sm:ml-4">
        <button type="button" onClick={() => onLike(reel)} aria-pressed={!!reel.liked} aria-label="Like"
          className="flex flex-col items-center gap-1 cursor-pointer">
          <span className={RAIL_BTN}>
            <Heart className={`h-6 w-6 transition ${reel.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </span>
          <span className="text-xs font-bold drop-shadow">{fmtCount(reel.likes_count)}</span>
        </button>

        <button type="button" onClick={() => onComments(reel)} aria-label="Comments"
          className="flex flex-col items-center gap-1 cursor-pointer">
          <span className={RAIL_BTN}><MessageCircle className="h-6 w-6" /></span>
          <span className="text-xs font-bold drop-shadow">{fmtCount(reel.comments_count)}</span>
        </button>

        <button type="button" onClick={handleShare} aria-label="Share" className="cursor-pointer">
          <span className={RAIL_BTN}><Send className="h-6 w-6" /></span>
        </button>

        <button type="button" onClick={handleSave} aria-pressed={!!saved} aria-label={saved ? 'Unsave' : 'Save'}
          className="cursor-pointer">
          <span className={RAIL_BTN}>
            <Bookmark className={`h-6 w-6 transition ${saved ? 'fill-white' : ''}`} />
          </span>
        </button>

        <ReelMenu reel={reel} buttonClass={RAIL_BTN} onNotify={flash} />

        {/* Volume sits where the views counter used to be */}
        <button type="button" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="cursor-pointer">
          <span className={RAIL_BTN}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </span>
        </button>
      </div>

      {note && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg">
          {note}
        </div>
      )}
    </div>
  )
}