import { useRef, useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FaLinkedin } from 'react-icons/fa'

export default function TeamSlider({ teamMembers }) {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)

  // ── Drag / swipe state ────────────────────────────────────────────────────
  const dragging = useRef(false)
  const startX = useRef(0)
  const deltaX = useRef(0)
  const [isDragging, setIsDragging] = useState(false)   // visual feedback only

  const total = teamMembers.length
  const member = teamMembers[active]

  // ── Scroll the track so the active card is centred ───────────────────────
  const scrollTo = useCallback((idx) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[idx]
    if (!card) return
    const trackRect = track.getBoundingClientRect()
    const cardRect  = card.getBoundingClientRect()
    const offset = cardRect.left - trackRect.left
                 - (trackRect.width / 2)
                 + (cardRect.width  / 2)
    track.scrollBy({ left: offset, behavior: 'smooth' })
  }, [])

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(total - 1, idx))
    setActive(clamped)
    // Let React re-render first, then scroll
    requestAnimationFrame(() => scrollTo(clamped))
  }, [total, scrollTo])

  const prev = () => goTo(active - 1)
  const next = () => goTo(active + 1)

  // ── Mouse events (desktop drag) ───────────────────────────────────────────
  const onMouseDown = (e) => {
    if (e.target.closest('a')) return
    dragging.current = true
    startX.current   = e.clientX
    deltaX.current   = 0
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMouseMove = (e) => {
    if (!dragging.current) return
    deltaX.current = e.clientX - startX.current
  }
  const onMouseUp = () => {
    if (!dragging.current) return
    dragging.current = false
    setIsDragging(false)
    if      (deltaX.current < -40) next()
    else if (deltaX.current >  40) prev()
  }

  // ── Touch events (mobile swipe) ───────────────────────────────────────────
  // Attached via useEffect with { passive: false } so we can call
  // preventDefault() on horizontal swipes and stop the page scrolling.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let touchStartX = 0
    let touchDeltaX = 0
    let isHorizontal = null   // null = undecided, true/false once direction known

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return
      touchStartX  = e.touches[0].clientX
      touchDeltaX  = 0
      isHorizontal = null
      dragging.current = true
    }

    const handleTouchMove = (e) => {
      if (!dragging.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - touchStartX
      const dy = e.touches[0].clientY - (e.touches[0].screenY - e.touches[0].clientY) // approx

      // Decide direction on first meaningful move
      if (isHorizontal === null && Math.abs(dx) > 5) {
        isHorizontal = true
      }

      if (isHorizontal) {
        e.preventDefault()   // block vertical scroll while swiping cards
        touchDeltaX = dx
      }
    }

    const handleTouchEnd = () => {
      if (!dragging.current) return
      dragging.current = false
      if      (touchDeltaX < -40) next()
      else if (touchDeltaX >  40) prev()
      isHorizontal = null
    }

    track.addEventListener('touchstart', handleTouchStart, { passive: true  })
    track.addEventListener('touchmove',  handleTouchMove,  { passive: false })
    track.addEventListener('touchend',   handleTouchEnd,   { passive: true  })

    return () => {
      track.removeEventListener('touchstart', handleTouchStart)
      track.removeEventListener('touchmove',  handleTouchMove)
      track.removeEventListener('touchend',   handleTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, total])   // re-bind when active/total changes so next/prev are fresh

  // ── Card click ────────────────────────────────────────────────────────────
  const handleCardClick = (e, idx) => {
    if (e.target.closest('a')) return
    // Don't trigger a click if the user just finished dragging
    if (Math.abs(deltaX.current) > 5) return
    goTo(idx)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="select-none">

      {/* ── Slider track ───────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-hidden pb-4"
        style={{
          paddingLeft:  'calc(50vw - 140px)',
          paddingRight: 'calc(50vw - 140px)',
          cursor: isDragging ? 'grabbing' : 'grab',
          // Allow vertical page scroll; horizontal handled by touch events above
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
        onPointerDown={onMouseDown}
        onPointerMove={onMouseMove}
        onPointerUp={onMouseUp}
        onPointerLeave={onMouseUp}
      >
        {teamMembers.map((m, idx) => {
          const isActive = idx === active
          return (
            <div
              key={m.name}
              onClick={(e) => handleCardClick(e, idx)}
              className="flex-shrink-0 transition-all duration-500"
              style={{
                width: 280,
                transform: isActive
                  ? 'scale(1) translateY(0px)'
                  : 'scale(0.9) translateY(12px)',
                opacity: isActive ? 1 : 0.55,
              }}
            >
              {/* White card */}
              <div
                className="bg-white rounded-3xl border border-violet-100 overflow-visible"
                style={{
                  padding: '16px 18px',
                  boxShadow: isActive
                    ? '0 24px 60px rgba(124,58,237,0.18), 0 4px 16px rgba(0,0,0,0.06)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.5s ease',
                }}
              >
                {/* Photo */}
                {m.photo ? (
                  <div className="relative" style={{ aspectRatio: '3/4', overflow: 'visible' }}>
                    <img
                      src={m.photo}
                      alt={m.name}
                      draggable={false}
                      className="w-full h-full object-cover object-top rounded-2xl"
                      style={{ display: 'block', imageRendering: 'auto' }}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-1.5 whitespace-nowrap border border-violet-100"
                      style={{ bottom: '-12px', zIndex: 20 }}
                    >
                      <p className="text-xs font-bold text-slate-700">{m.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative" style={{ aspectRatio: '3/4', overflow: 'visible' }}>
                    <div
                      className={`w-full h-full bg-gradient-to-br ${m.gradient} flex items-center justify-center rounded-2xl`}
                    >
                      <span className="text-7xl font-black text-white/80">{m.avatar}</span>
                    </div>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-1.5 whitespace-nowrap border border-violet-100"
                      style={{ bottom: '-12px', zIndex: 20 }}
                    >
                      <p className="text-xs font-bold text-slate-700">{m.role}</p>
                    </div>
                  </div>
                )}

                {/* Name + LinkedIn */}
                <div className="text-center mt-6">
                  <h3 className="text-lg font-black text-slate-950 leading-tight">{m.name}</h3>
                  {m.linkedin ? (
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-1.5"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <FaLinkedin className="w-5.5 h-5.5 transition-all duration-300 hover:scale-110" />
                    </a>
                  ) : (
                    <span className="block mt-1.5 h-4" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Bio panel ──────────────────────────────────────────────────── */}
      {member.bio && (
        <p className="text-slate-600 text-[15px] leading-7 mt-3 max-w-xl mx-auto text-center select-text px-4">
          {member.bio}
        </p>
      )}

      {/* ── Nav: arrows + dots ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-5 mt-10 px-4">
        <button
          onClick={prev}
          disabled={active === 0}
          className="w-10 h-10 rounded-full border border-violet-200 bg-white flex items-center justify-center text-slate-500 hover:text-violet-700 hover:border-violet-400 hover:shadow-md disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {teamMembers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="rounded-full transition-all duration-300"
              style={{
                width:      idx === active ? 22 : 6,
                height:     6,
                background: idx === active ? member.accentColor : '#ddd6fe',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={active === total - 1}
          className="w-10 h-10 rounded-full border border-violet-200 bg-white flex items-center justify-center text-slate-500 hover:text-violet-700 hover:border-violet-400 hover:shadow-md disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  )
}