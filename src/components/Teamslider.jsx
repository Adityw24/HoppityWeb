import { useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

export default function TeamSlider({ teamMembers }) {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)
  const dragDelta = useRef(0)
  const total = teamMembers.length

  const scrollTo = useCallback((idx) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[idx]
    if (!card) return
    const trackRect = track.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const offset = cardRect.left - trackRect.left - (trackRect.width / 2) + (cardRect.width / 2)
    track.scrollBy({ left: offset, behavior: 'smooth' })
  }, [])

  const goTo = (idx) => {
    setActive(idx)
    setTimeout(() => scrollTo(idx), 0)
  }

  const prev = () => goTo(Math.max(0, active - 1))
  const next = () => goTo(Math.min(total - 1, active + 1))

  const onPointerDown = (e) => {
    if (e.target.closest('a')) return
    dragStart.current = e.clientX
    dragDelta.current = 0
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragging) return
    dragDelta.current = e.clientX - dragStart.current
  }
  const onPointerUp = () => {
    if (dragging) {
      if (dragDelta.current < -40) next()
      else if (dragDelta.current > 40) prev()
    }
    setDragging(false)
  }

  const handleCardClick = (e, idx) => {
    if (e.target.closest('a')) return
    goTo(idx)
  }

  const member = teamMembers[active]

  return (
    <div className="select-none">

      {/* ── Slider track ─────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-hidden pb-4"
        style={{
          paddingLeft: 'calc(50vw - 140px)',
          paddingRight: 'calc(50vw - 140px)',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
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
                // No filter on the wrapper — keeps image crisp
                transform: isActive ? 'scale(1) translateY(0px)' : 'scale(0.9) translateY(12px)',
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

                {/* Photo — overflow-hidden scoped only to the image wrapper */}
                {m.photo ? (
                  <div className="relative" style={{ aspectRatio: '3/4', overflow: 'visible' }}>
                    <img
                      src={m.photo}
                      alt={m.name}
                      draggable={false}
                      className="w-full h-full object-cover object-top rounded-2xl"
                      style={{
                        display: 'block',
                        // No transform, no filter — pure crisp render
                        imageRendering: 'auto',
                      }}
                    />
                    {/* Role badge — overlaps on image */}
                    <div className="absolute left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-1.5 whitespace-nowrap border border-violet-100" style={{ bottom: '-12px', zIndex: 20 }}>
                      <p className="text-xs font-bold text-slate-700">{m.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative" style={{ aspectRatio: '3/4', overflow: 'visible' }}>
                    <div
                      className={`w-full h-full bg-gradient-to-br ${m.gradient} flex items-center justify-center`}
                    >
                      <span className="text-7xl font-black text-white/80">{m.avatar}</span>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-1.5 whitespace-nowrap border border-violet-100" style={{ bottom: '-12px', zIndex: 20 }}>
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline mt-1.5 transition"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <ExternalLink className="w-3 h-3" /> LinkedIn
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

      {/* ── Bio panel ────────────────────────────────────────────────────── */}
      {member.bio && (
        <div className="mt-10 px-4 max-w-lg mx-auto text-center">
          <p className="text-slate-600 text-[15px] leading-7">{member.bio}</p>
        </div>
      )}

      {/* ── Nav: arrows + dots ───────────────────────────────────────────── */}
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
                width: idx === active ? 22 : 6,
                height: 6,
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