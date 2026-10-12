import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal, Link2, MapPin } from 'lucide-react'
import { reelUrl, copyText } from '../lib/reelShare'

// Three-dots button for the action rail. Opens a small menu to the left of the rail.
// (Deleting reels is intentionally NOT here. Creators manage their reels on their profile page.)
export default function ReelMenu({ reel, buttonClass, onNotify }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleCopy = async () => {
    setOpen(false)
    onNotify?.((await copyText(reelUrl(reel))) ? 'Link copied' : 'Could not copy link')
  }

  const item = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-violet-50 transition cursor-pointer'

  return (
    <div ref={wrapRef} className="relative">
      <button type="button" aria-label="More options" aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen(o => !o)} className={buttonClass}>
        <MoreHorizontal className="h-6 w-6" />
      </button>

      {open && (
        <div role="menu"
          className="absolute bottom-0 right-full mr-3 w-44 overflow-hidden rounded-2xl border border-violet-100 bg-white py-1.5 shadow-2xl">
          <button role="menuitem" className={item} onClick={handleCopy}>
            <Link2 className="h-4 w-4 text-slate-500" /> Copy link
          </button>
          {reel.tour?.slug && (
            <Link role="menuitem" to={`/itinerary/${reel.tour.slug}`} className={item} onClick={() => setOpen(false)}>
              <MapPin className="h-4 w-4 text-slate-500" /> View itinerary
            </Link>
          )}
        </div>
      )}
    </div>
  )
}