import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from "../lib/seo"

/* ─────────────────────────────────────────────────────────────
   STAY CATEGORIES
   Each card routes to /stays/<slug> — the existing
   BudgetStaysPage / SignatureStaysPage / FlagshipStaysPage.
   ───────────────────────────────────────────────────────────── */
const STAY_CATEGORIES = [
  {
    slug: 'budget',
    label: 'Affordable',
    title: 'Budget stays',
    desc: "Honest, clean, and wallet-friendly — hostels, guesthouses, and homestays that don't cut corners.",
    count: '',
    icon: '🎒',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
    flagship: false,
  },
  {
    slug: 'signature',
    label: 'Boutique',
    title: 'Signature stays',
    desc: 'Handpicked properties with soul — treehouses, heritage havelis, hilltop cottages.',
    count: '',
    icon: '🏡',
    image: 'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800&q=80',
    flagship: false,
  },
  {
    slug: 'flagship',
    label: 'FLAGSHIP',
    title: 'Flagship properties',
    desc: 'Our most iconic stays — personally walked through, slept in, and stood behind completely.',
    count: '',
    icon: '✦',
    image: 'https://images.unsplash.com/photo-1587922546307-776227941871?w=800&q=85',
    flagship: true,
    perks: [
      'Personally vetted by the Hoppity team',
      'Exclusive experiences not listed elsewhere',
    ],
  },
]

export default function Stays() {
  const [stayCounts, setStayCounts] = useState({})

  useEffect(() => {
    setPageSEO({
      title: 'Stays',
      description:
        'Browse Hoppity stays across India — affordable homestays, boutique signature properties, and our flagship stays, each personally vetted by the team.',
      canonical: '/stays',
    })
  }, [])

  // Count active properties per category
  useEffect(() => {
    let didCancel = false

    supabase
      .from('Properties')
      .select('property_category')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error || !data || didCancel) return
        const tally = {}
        data.forEach(r => {
          if (!r.property_category) return
          tally[r.property_category] = (tally[r.property_category] || 0) + 1
        })
        setStayCounts(tally)
      })

    return () => { didCancel = true }
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f1ff] text-slate-900">
      <Navbar />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-8 md:pt-28 md:pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,58,237,0.10),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-4">
            <Link
              to="/"
              aria-label="Back to home"
              title="Back to home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#f7f1ff]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to home</span>
            </Link>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-2">
            Where to stay
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-3">
            Find your kind of stay.
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
            Every property here has been visited, checked, and chosen by us — no
            aggregator listings, no surprises on arrival.
          </p>
        </div>
      </section>

      {/* ── STAY CATEGORIES ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAY_CATEGORIES.map((card) => (
            <Link
              key={card.slug}
              to={`/stays/${card.slug}`}
              className="group relative overflow-hidden cursor-pointer rounded-[1.75rem] transition duration-300 hover:-translate-y-1 h-[360px]"
            >
              {/* Background image */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: card.flagship
                    ? 'linear-gradient(160deg, rgba(80,20,160,0.28) 0%, transparent 45%, rgba(0,0,0,0.82) 100%)'
                    : 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0.76) 100%)',
                }}
              />

              {/* Flagship: gold shimmer line at top */}
              {card.flagship && (
                <div
                  className="absolute top-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: '2.5px',
                    background: 'linear-gradient(90deg, transparent 0%, #c4a35a 35%, #f0d080 55%, transparent 100%)',
                  }}
                />
              )}

              {/* Top badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span
                  className="text-[10px] font-bold px-3 py-1 rounded-full border backdrop-blur-md tracking-wide"
                  style={{
                    background: card.flagship ? 'rgba(196,163,90,0.22)' : 'rgba(255,255,255,0.16)',
                    color: card.flagship ? '#f0d080' : '#fff',
                    borderColor: card.flagship ? 'rgba(196,163,90,0.40)' : 'rgba(255,255,255,0.28)',
                  }}
                >
                  {card.label}
                </span>
                {card.flagship && (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md"
                    style={{
                      background: 'rgba(255,255,255,0.13)',
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.22)',
                    }}
                  >
                    ⭐ Hoppity pick
                  </span>
                )}
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">

                {/* Icon + Title */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-base backdrop-blur-md border"
                    style={{
                      background: card.flagship ? 'rgba(196,163,90,0.20)' : 'rgba(255,255,255,0.16)',
                      borderColor: card.flagship ? 'rgba(196,163,90,0.35)' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {card.icon}
                  </div>
                  <p className="text-[17px] font-black text-white tracking-tight drop-shadow-md">
                    {card.title}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-white/80 leading-relaxed mb-3 drop-shadow">
                  {card.desc}
                </p>

                {/* Flagship perks */}
                {card.flagship && card.perks && (
                  <div className="flex flex-col gap-1.5 mb-3">
                  </div>
                )}

                {/* Count + Explore */}
                <div
                  className="flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: card.flagship ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)' }}
                >
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full border backdrop-blur-md"
                    style={{
                      background: card.flagship ? 'rgba(196,163,90,0.20)' : 'rgba(255,255,255,0.15)',
                      color: card.flagship ? '#f0d080' : '#fff',
                      borderColor: card.flagship ? 'rgba(196,163,90,0.36)' : 'rgba(255,255,255,0.26)',
                    }}
                  >
                    {(() => {
                      const n = stayCounts[card.slug]
                      if (n == null) return card.count          // fallback until fetch resolves
                      return `${n} ${n === 1 ? 'stay' : 'stays'}`
                    })()}
                  </span>
                  <span className="text-sm font-bold text-white flex items-center gap-1 drop-shadow">
                    Explore{' '}
                    <ArrowRight
                      className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: card.flagship ? '#f0d080' : '#fff' }}
                    />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}