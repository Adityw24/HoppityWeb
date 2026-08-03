import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, Star, Search, X, ShieldCheck, Crown, Headphones } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from "../lib/seo"

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"

function useFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = FONT_HREF
    document.head.appendChild(link)
  }, [])
}

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  pageBg:        '#f7f1ff',
  surface:       '#1e0a3c',
  surfaceHi:     '#2a1052',
  surfaceLow:    '#150828',
  border:        'rgba(167,139,250,0.18)',
  borderGold:    'rgba(196,163,90,0.22)',
  borderGoldHi:  'rgba(196,163,90,0.48)',
  gold:          '#c4a35a',
  goldLight:     '#f0d080',
  goldDim:       'rgba(196,163,90,0.14)',
  goldBorder:    'rgba(196,163,90,0.28)',
  violet:        '#a78bfa',
  violetBright:  '#c4b5fd',
  violetDeep:    '#7c3aed',
  ivory:         '#f0ebff',
  ivoryDim:      'rgba(240,235,255,0.55)',
  ivoryFaint:    'rgba(240,235,255,0.26)',
  ivoryVeryFaint:'rgba(240,235,255,0.12)',
  dark:          '#1e0a3c',
  darkMid:       '#4c1d95',
}

const TAG_GRADIENTS = {
  Resort:       ['#1e0a3c', '#0d0618'],
  Villa:        ['#1a0838', '#0a0420'],
  Palace:       ['#1a0e30', '#0d0820'],
  Retreat:      ['#130a2e', '#08040f'],
  Lodge:        ['#18082e', '#0a0418'],
  'Heritage Hotel': ['#1a0e28', '#0d0818'],
  'Beach Villa':    ['#0a1e2e', '#040d18'],
  'Estate Stay':    ['#0e1a0e', '#060e06'],
  Treehouse:        ['#1a1208', '#0d0904'],
  'Jungle Lodge':   ['#0e1a0a', '#060d04'],
  'Heritage Stay':  ['#1a0e28', '#0d0818'],
}
const DEFAULT_GRADIENT = ['#1e0a3c', '#0a0418']

const PROMISES = [
  {
    Icon: ShieldCheck,
    title: 'Personally walked through',
    body: 'Every property is visited in person by our team before it earns the Flagship badge.',
  },
  {
    Icon: Crown,
    title: 'Exclusively on Hoppity',
    body: 'These stays are not listed anywhere else. You will only find them here.',
  },
  {
    Icon: Headphones,
    title: 'White-glove concierge',
    body: 'A dedicated specialist handles every detail of your flagship booking.',
  },
]

// ── Image collection helper ─────────────────────────────────────────────────
// Parse cover_image_url + images_url (array / JSON string / comma list / single
// URL) into a clean de-duplicated array. Mirrors the Signature page logic.
function collectImages(row) {
  const out = []
  if (row.cover_image_url) out.push(row.cover_image_url)

  const pushFrom = (val) => {
    if (!val) return
    if (Array.isArray(val)) { out.push(...val); return }
    if (typeof val !== 'string') return
    const trimmed = val.trim()
    if (!trimmed) return
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) { out.push(...parsed.filter(Boolean)); return }
      } catch { /* fall through */ }
    }
    const inner = trimmed.startsWith('[') && trimmed.endsWith(']')
      ? trimmed.slice(1, -1)
      : trimmed
    out.push(...inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean))
  }

  pushFrom(row.images_url)
  pushFrom(row.images)
  return [...new Set(out.filter(Boolean))]
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('${FONT_HREF}');
  .fp-page { font-family: 'DM Sans', sans-serif; background: #f7f1ff; }
  .fp-page *, .fp-page *::before, .fp-page *::after { box-sizing: border-box; }
  .fp-serif { font-family: 'Cormorant Garamond', Georgia, serif !important; }
  .fp-shimmer {
    height: 2px; border-radius: 0;
    background: linear-gradient(90deg, transparent 0%, #b8924e 25%, #f0d080 50%, #b8924e 75%, transparent 100%);
  }
  .fp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.28), rgba(196,163,90,0.22), rgba(124,58,237,0.28), transparent);
  }
  .fp-back {
    width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
    border: 1px solid rgba(124,58,237,0.28);
    background: rgba(124,58,237,0.07);
    display: inline-flex; align-items: center; justify-content: center;
    color: #7c3aed;
    transition: background .2s, border-color .2s, transform .2s;
    text-decoration: none;
  }
  .fp-back:hover { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.50); transform: translateX(-2px); }
  .fp-orn { flex: 1; max-width: 56px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(196,163,90,0.45), transparent); }
  .fp-promise-card {
    background: #1e0a3c;
    border: 1px solid rgba(167,139,250,0.20);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 48px rgba(30,10,60,0.22);
  }
  .fp-promise-row {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(167,139,250,0.10);
    transition: background .2s;
  }
  .fp-promise-row:last-child { border-bottom: none; }
  .fp-promise-row:hover { background: rgba(196,163,90,0.04); }
  .fp-icon-tile {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    background: rgba(196,163,90,0.12);
    border: 1px solid rgba(196,163,90,0.28);
    display: flex; align-items: center; justify-content: center;
  }
  .fp-search {
    background: white;
    border: 1.5px solid rgba(124,58,237,0.18);
    border-radius: 16px;
    color: #1e0a3c;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    padding: 13px 40px 13px 46px;
    outline: none; width: 100%;
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 2px 10px rgba(124,58,237,0.06);
  }
  .fp-search::placeholder { color: rgba(76,29,149,0.32); }
  .fp-search:focus { border-color: rgba(124,58,237,0.48); box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .fp-count {
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 7px 18px; border-radius: 100px;
    border: 1px solid rgba(124,58,237,0.20); background: white;
    color: #4c1d95;
    box-shadow: 0 2px 8px rgba(124,58,237,0.07);
    white-space: nowrap;
  }
  .fp-card {
    background: #1e0a3c;
    border: 1px solid rgba(167,139,250,0.18);
    border-radius: 24px; overflow: hidden;
    display: flex; flex-direction: column;
    text-decoration: none;
    transition: transform .38s cubic-bezier(.22,.68,0,1.15), border-color .25s, box-shadow .38s;
    position: relative;
    cursor: pointer;
  }
  .fp-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #c4a35a 30%, #f0d080 50%, #c4a35a 70%, transparent);
    opacity: 0; transition: opacity .3s; z-index: 20;
  }
  .fp-card:hover {
    transform: translateY(-8px);
    border-color: rgba(196,163,90,0.45);
    box-shadow: 0 32px 64px rgba(30,10,60,0.48), 0 0 0 1px rgba(196,163,90,0.12);
  }
  .fp-card:hover::before { opacity: 1; }
  .fp-card-img { transition: transform .7s cubic-bezier(.22,.68,0,1.15); }
  .fp-card:hover .fp-card-img { transform: scale(1.07); }
  .fp-badge {
    font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 700;
    letter-spacing: 0.20em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 100px;
    border: 1px solid rgba(196,163,90,0.44);
    background: rgba(196,163,90,0.16); color: #f0d080;
    backdrop-filter: blur(8px);
  }
  .fp-tag {
    font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 100px;
    border: 1px solid rgba(240,235,255,0.22);
    background: rgba(240,235,255,0.10); color: rgba(240,235,255,0.82);
    backdrop-filter: blur(8px);
  }
  .fp-explore {
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #c4a35a;
    display: flex; align-items: center; gap: 6px;
    transition: gap .2s, color .2s;
  }
  .fp-card:hover .fp-explore { gap: 11px; color: #f0d080; }
  .fp-cta-box {
    background: #1e0a3c;
    border: 1px solid rgba(167,139,250,0.20);
    border-radius: 24px; padding: 40px 48px;
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 24px;
    box-shadow: 0 8px 48px rgba(30,10,60,0.16);
  }
  .fp-wa-btn {
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 0.10em; text-transform: uppercase;
    background: #7c3aed; color: white;
    padding: 14px 30px; border-radius: 14px; text-decoration: none;
    display: inline-flex; align-items: center; gap: 8px;
    transition: background .2s, transform .2s;
    box-shadow: 0 4px 24px rgba(124,58,237,0.35);
    flex-shrink: 0;
  }
  .fp-wa-btn:hover { background: #6d28d9; transform: translateY(-2px); }
  @keyframes fp-spin { to { transform: rotate(360deg) } }
  .fp-spinner { animation: fp-spin .9s linear infinite; }
  @keyframes fp-fadeup {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fu  { animation: fp-fadeup .55s cubic-bezier(.22,.68,0,1.2) both; }
  .fu1 { animation-delay: .04s; }
  .fu2 { animation-delay: .11s; }
  .fu3 { animation-delay: .18s; }
  .fu4 { animation-delay: .25s; }
  @media (max-width: 800px) {
    .fp-hero-grid { grid-template-columns: 1fr !important; }
    .fp-cta-box { padding: 28px 24px; }
    .fp-main { padding: 80px 20px 60px !important; }
  }
`

// ── Sub-components ────────────────────────────────────────────────────────────

function PromiseCard() {
  return (
    <div className="fp-promise-card">
      <div className="fp-shimmer" />
      <div style={{
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid rgba(167,139,250,0.12)`,
      }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold }}>
          Why Flagship?
        </span>
        <span style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          padding: '4px 12px', borderRadius: 100,
          border: `1px solid ${C.borderGoldHi}`,
          background: C.goldDim, color: C.goldLight,
        }}>
          Hoppity Vetted
        </span>
      </div>
      {PROMISES.map(({ Icon, title, body }) => (
        <div key={title} className="fp-promise-row">
          <div className="fp-icon-tile">
            <Icon style={{ width: 16, height: 16, color: C.gold, strokeWidth: 1.5 }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 16, fontWeight: 600, color: C.ivory, margin: '0 0 3px', lineHeight: 1.2 }}>{title}</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 300, color: C.ivoryDim, margin: 0, lineHeight: 1.55 }}>{body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FlagshipCard({ stay, index }) {
  const hasImage = stay.image?.length > 0 && stay.image[0]
  const [g1, g2] = TAG_GRADIENTS[stay.tag] || DEFAULT_GRADIENT
  const price = stay.price_per_person
    ? `₹${Number(stay.price_per_person).toLocaleString('en-IN')}`
    : stay.price || 'On Request'
  const duration = stay.duration_display || stay.duration || ''

  return (
    <Link
      to={`/stays/flagship/${stay.slug}`}
      className={`fp-card fu fu${Math.min(index + 1, 4)}`}
    >
      <div style={{ position: 'relative', height: 260, flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${g1}, ${g2})` }} />
        {hasImage && (
          <img
            className="fp-card-img"
            src={stay.image[0]}
            alt={stay.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(30,10,60,0.06) 0%, rgba(30,10,60,0.20) 38%, rgba(20,6,48,0.76) 72%, rgba(14,4,32,0.97) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 90, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.22) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="fp-badge">Flagship</span>
            {stay.tag && <span className="fp-tag">{stay.tag}</span>}
          </div>
          {stay.rating > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(14,4,32,0.60)', backdropFilter: 'blur(8px)',
              borderRadius: 100, padding: '4px 10px',
              border: `1px solid ${C.borderGold}`,
            }}>
              <Star style={{ width: 11, height: 11, color: C.goldLight, fill: C.goldLight }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: C.goldLight }}>
                {Number(stay.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px', zIndex: 5 }}>
          {stay.location && (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.violetBright, margin: '0 0 6px' }}>
              {stay.location}
            </p>
          )}
          <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 25, fontWeight: 600, lineHeight: 1.2, color: C.ivory, margin: 0 }}>
            {stay.title}
          </h3>
        </div>
      </div>
      <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ivoryDim, letterSpacing: '0.04em' }}>{duration}</span>
          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 23, fontWeight: 600, color: C.goldLight }}>{price}</span>
        </div>
        {stay.blurb && (
          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.65,
            color: C.ivoryFaint, flex: 1, marginBottom: 16,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {stay.blurb}
          </p>
        )}
        <div style={{ paddingTop: 16, borderTop: `1px solid rgba(167,139,250,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="fp-explore">
            Explore <ArrowRight style={{ width: 14, height: 14 }} />
          </span>
          <span style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: 100,
            background: C.goldDim, border: `1px solid ${C.goldBorder}`,
            color: C.gold,
          }}>
            Hoppity's pick
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FlagshipStaysPage() {
  useFont()
  const [stays,      setStays]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    setPageSEO({
      title:       'Flagship Properties – Our Most Iconic Stays | Hoppity',
      description: 'Hoppity flagship properties — personally walked through, slept in, and stood behind. Exclusively on Hoppity.',
      canonical:   '/stays/flagship',
    })

    supabase
      .from('Properties')
      .select('*')
      .eq('is_active', true)
      .eq('property_category', 'flagship')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Flagship stays fetch error:', error)
          setFetchError(error.message)
          setLoading(false)
          return
        }

        // Map Properties columns into the shape FlagshipCard expects
        const normalised = (data || []).map(row => ({
          id:               row.id,
          title:            row.name,
          slug:             row.slug,
          location:         row.location,
          tag:              row.property_type,
          price_per_person: row.price_per_night,
          duration_display: 'Per night',
          blurb:            row.description,
          rating:           row.rating       || 0,
          review_count:     row.review_count || 0,
          image:            collectImages(row),
        }))

        setStays(normalised)
        setLoading(false)
      })
      .catch(err => {
        console.error('Flagship stays fetch failed:', err)
        setFetchError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = stays.filter(s => {
    const q = search.trim().toLowerCase()
    return !q || s.title?.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q) || s.blurb?.toLowerCase().includes(q)
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="fp-page" style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div className="fp-spinner" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(124,58,237,0.18)', borderTopColor: '#7c3aed' }} />
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.darkMid, opacity: 0.7 }}>Loading flagship stays…</p>
        </div>
      </div>
    </>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (fetchError) return (
    <>
      <style>{CSS}</style>
      <div className="fp-page" style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 600, color: '#b91c1c', marginBottom: 8 }}>Failed to load flagship stays</p>
          <p style={{ fontFamily: 'monospace', fontSize: 13, color: C.darkMid, opacity: 0.7 }}>{fetchError}</p>
        </div>
      </div>
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="fp-page">
        <Navbar />

        <div className="fp-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 40px 80px' }}>

          {/* Back + ornament */}
          <div className="fu fu1" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 44 }}>
            <Link to="/stays" aria-label="Go Back" className="fp-back">
              <ArrowLeft style={{ width: 18, height: 18 }} />
            </Link>
            <div className="fp-orn" />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, whiteSpace: 'nowrap' }}>
              Flagship Collection
            </span>
            <div className="fp-orn" />
          </div>

          {/* Hero two-column */}
          <div className="fp-hero-grid fu fu2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'start', marginBottom: 60 }}>
            <div>
              <h1 className="fp-serif" style={{
                fontSize: 'clamp(54px, 6.5vw, 86px)', fontWeight: 600, lineHeight: 1.0,
                color: C.dark, margin: '0 0 22px', letterSpacing: '-0.015em',
              }}>
                Flagship<br />
                <em style={{ color: C.violetDeep, fontStyle: 'italic' }}>Properties</em>
              </h1>
              <div style={{ width: 64, height: 2, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 22 }} />
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 300, lineHeight: 1.80, color: C.darkMid, maxWidth: 420, margin: '0 0 28px', opacity: 0.72 }}>
                Our most iconic stays — personally walked through, slept in, and stood behind completely. These aren't places to sleep. They're reasons to travel.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
                {[`${stays.length} ${stays.length === 1 ? 'property' : 'properties'}`, 'Personally vetted', 'Exclusively on Hoppity'].map(t => (
                  <span key={t} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.darkMid, opacity: 0.68, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold, display: 'inline-block', flexShrink: 0 }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <PromiseCard />
          </div>

          {/* Empty state — no flagship properties in DB yet */}
          {stays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0 80px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
              <p className="fp-serif" style={{ fontSize: 32, color: C.dark, margin: '0 0 10px' }}>No flagship stays yet</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.darkMid, opacity: 0.62, maxWidth: 460, margin: '0 auto' }}>
                Properties marked as <strong>Flagship</strong> and set to <strong>Live</strong> will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Divider */}
              <div className="fp-divider fu fu3" style={{ marginBottom: 38 }} />

              {/* Search + count */}
              <div className="fu fu3" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 44, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
                  <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: C.violetDeep, opacity: 0.50 }} />
                  <input
                    className="fp-search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search flagship properties…"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: C.darkMid, opacity: 0.45 }}>
                      <X style={{ width: 15, height: 15 }} />
                    </button>
                  )}
                </div>
                <span className="fp-count">{filtered.length} {filtered.length !== 1 ? 'properties' : 'property'}</span>
              </div>

              {/* Grid */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <p className="fp-serif" style={{ fontSize: 36, color: C.dark, margin: '0 0 10px' }}>No properties found</p>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.darkMid, opacity: 0.60 }}>Try a different search term.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 26 }}>
                  {filtered.map((stay, i) => <FlagshipCard key={stay.id} stay={stay} index={i} />)}
                </div>
              )}
            </>
          )}

          {/* Footer CTA */}
          <div style={{ marginTop: 88 }}>
            <div className="fp-divider" style={{ marginBottom: 40 }} />
            <div className="fp-cta-box">
              <div className="fp-shimmer" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
              <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(196,163,90,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <p className="fp-serif" style={{ fontSize: 30, fontWeight: 600, color: C.ivory, margin: '0 0 8px', lineHeight: 1.15 }}>
                  Ready to book a flagship experience?
                </p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 300, color: C.ivoryDim, margin: 0 }}>
                  Our team will personally curate every detail of your stay.
                </p>
              </div>
              <a href="https://wa.me/919752377323" target="_blank" rel="noopener noreferrer" className="fp-wa-btn">
                💬 WhatsApp us <ArrowRight style={{ width: 15, height: 15 }} />
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}