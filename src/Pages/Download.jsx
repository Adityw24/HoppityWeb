import { Link } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import {
  Star, MapPin, Clock, BellRing, Check, ShieldCheck, Users, Compass,
  Headphones, ChevronLeft, ChevronRight, ArrowRight, Search,
} from "lucide-react"
import { FaApple, FaGooglePlay, FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import subhagImg from "../assets/subhag.jpeg"
import pallaviImg from "../assets/pallavi1.jpeg"
import poojaImg from "../assets/pooja.jpeg"
import diwakarImg from "../assets/diwakar.jpeg"
import startuplogo from "../assets/startuplogo.png"
import dpiitlogo from "../assets/DPIIT.png"
import { setPageSEO } from "../lib/seo"

/* ─────────────────────────────────────────────────────────────
   ── PASTE YOUR STORE LINKS HERE ────────────────────────────
   Leave a link as '' and its badge shows "Coming soon" and is
   disabled, so the page is safe to ship before both apps are live.
   ───────────────────────────────────────────────────────────── */
const IOS_URL = 'https://apps.apple.com/us/app/hoppity-explore-real-india/id6800018246'
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=in.hoppity.app'

/* Which store badge goes first. iPadOS reports itself as a Mac, so a
   Mac with a touchscreen is treated as iOS too. */
function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios'
  return 'other'
}

const isVideo = (u) => /\.(mp4|mov|webm|m4v|avi|mkv|ogv|3gp)(\?|#|$)/i.test(String(u || ''))
const inr = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? `₹${n.toLocaleString('en-IN')}` : null
}

const WHY = [
  { icon: Compass, label: 'Every route scouted in person' },
  { icon: Users, label: 'Small groups, max 12' },
  { icon: ShieldCheck, label: 'Final price before you pay' },
  { icon: Headphones, label: 'A real person on WhatsApp' },
]

/* ── Store badge — black, like the official ones ──────────────── */
function StoreBadge({ href, icon: Icon, small, big }) {
  const live = Boolean(href)
  const cls = `flex items-center gap-2.5 rounded-xl px-4 py-2.5 ring-1 transition ${
    live
      ? 'bg-slate-950 text-white ring-white/10 shadow-lg shadow-violet-950/20 hover:-translate-y-0.5 hover:bg-black'
      : 'cursor-not-allowed bg-slate-950/40 text-white/70 ring-white/10'
  }`
  const inner = (
    <>
      <Icon className="h-6 w-6 flex-shrink-0" />
      <span className="text-left leading-none">
        <span className="block text-[9px] font-semibold uppercase tracking-wide opacity-80">{live ? small : 'Coming soon on'}</span>
        <span className="mt-0.5 block text-[17px] font-bold tracking-tight">{big}</span>
      </span>
    </>
  )
  return live
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <span aria-disabled="true" className={cls}>{inner}</span>
}

/* ── A phone frame. Screen content is whatever you pass in. ───── */
function Phone({ children, className = '' }) {
  return (
    <div className={`relative aspect-[9/19] w-full rounded-[1.9rem] bg-slate-950 p-[5px] shadow-2xl shadow-violet-950/40 ring-1 ring-white/10 ${className}`}>
      <div className="absolute left-1/2 top-2.5 z-20 h-3.5 w-14 -translate-x-1/2 rounded-full bg-slate-950" />
      <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-[#f7f1ff]">{children}</div>
    </div>
  )
}

/* Small trip row used inside the phone screens */
function MiniTrip({ trip, tone = 'violet' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 ring-1 ring-violet-200/60">
      <div className={`h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg ${tone === 'violet' ? 'bg-violet-200' : 'bg-fuchsia-200'}`}>
        {trip?.cover && <img src={trip.cover} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[9px] font-bold text-slate-900">{trip?.title || 'New departure'}</p>
        <p className="truncate text-[8px] text-slate-500">{trip?.location || 'India'}</p>
      </div>
    </div>
  )
}

/* ── The five screenshot panels ──────────────────────────────── */
function Panel({ variant = 'light', children }) {
  const skin = variant === 'brand'
    ? 'bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 text-white'
    : 'bg-white text-slate-950 ring-1 ring-violet-200/70'
  return (
    <article className={`panel relative flex aspect-[9/16] w-[78%] shrink-0 snap-center flex-col overflow-hidden rounded-[1.75rem] sm:w-[44%] lg:w-auto ${skin}`}>
      {/* Soft arc in the corner, like the reference — the brand swoosh */}
      <div aria-hidden="true" className={`pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full border-[28px] ${
        variant === 'brand' ? 'border-white/10' : 'border-violet-100'
      }`} />
      {children}
    </article>
  )
}

function PanelHead({ title, accent, sub, dark }) {
  return (
    <div className="relative z-10 px-4 pt-6 text-center">
      <h3 className="text-[1.35rem] font-black leading-[1.08] tracking-tight">
        {title}{accent && <><br /><span className={dark ? 'text-fuchsia-200' : 'text-violet-600'}>{accent}</span></>}
      </h3>
      {sub && <p className={`mx-auto mt-2 max-w-[15rem] text-[11px] leading-snug ${dark ? 'text-white/75' : 'text-slate-500'}`}>{sub}</p>}
    </div>
  )
}

export default function Download() {
  const [platform] = useState(detectPlatform)
  const [trips, setTrips] = useState([])
  const railRef = useRef(null)

  useEffect(() => {
    setPageSEO({
      title: 'Download the Hoppity App – iOS & Android',
      description: 'Get the Hoppity app on iPhone and Android. Book curated offbeat trips and stays across India, get alerts for new departures, and travel with a small group.',
      canonical: '/download',
    })
  }, [])

  /* A few real trips, so every phone on the page shows actual Hoppity content. */
  useEffect(() => {
    let cancelled = false
    supabase
      .from('Itineraries')
      .select('id,title,location,rating,price,price_per_person,duration,duration_display,cover_image_url,images')
      .eq('is_active', true)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(10)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        setTrips(
          data
            .map(r => ({ ...r, cover: (r.images || []).find(u => !isVideo(u)) || (isVideo(r.cover_image_url) ? null : r.cover_image_url) }))
            .filter(r => r.cover)
        )
      })
    return () => { cancelled = true }
  }, [])

  const t = (i) => trips[i % (trips.length || 1)] || null
  const hero = t(0)

  const ios = { key: 'ios', href: IOS_URL, icon: FaApple, small: 'Download on the', big: 'App Store' }
  const android = { key: 'android', href: ANDROID_URL, icon: FaGooglePlay, small: 'Get it on', big: 'Google Play' }
  const stores = platform === 'android' ? [android, ios] : [ios, android]

  const scrollRail = (dir) => {
    const el = railRef.current
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f1ff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(124,58,237,0.12),transparent_70%)]" />

      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
        .panel { animation: rise 600ms cubic-bezier(.22,.68,.36,1) both; }
        .panel:nth-child(2) { animation-delay: 80ms }
        .panel:nth-child(3) { animation-delay: 160ms }
        .panel:nth-child(4) { animation-delay: 240ms }
        .panel:nth-child(5) { animation-delay: 320ms }
        .dl-title > * { animation: rise 650ms cubic-bezier(.22,.68,.36,1) both; }
        .dl-title > *:nth-child(2) { animation-delay: 100ms }
        .dl-title > *:nth-child(3) { animation-delay: 180ms }
        .dl-title > *:nth-child(4) { animation-delay: 260ms }

        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50%      { transform: translateY(-8px) rotate(var(--r, 0deg)); }
        }
        .bob { animation: bob 5s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .panel, .dl-title > *, .bob { animation: none !important; }
        }
      `}</style>

      <Navbar />

      <main className="relative">
        {/* ═══ THE FIVE SCREENS ═══════════════════════════════════ */}
        <section className="pt-24 sm:pt-28">
          <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-violet-100/80 via-[#efe4ff] to-[#f7f1ff] px-0 py-7 ring-1 ring-violet-200/60 sm:py-10 lg:px-8">
              {/* Top bar, as in the reference */}
              <div className="mb-6 flex items-center justify-between px-5 lg:px-0">
                <p className="text-xl font-black tracking-tight text-violet-800 sm:text-2xl">The Hoppity app</p>
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white sm:inline">iPhone · Android</span>
                  <button type="button" onClick={() => scrollRail(-1)} aria-label="Previous screens"
                    className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-violet-200/70 transition hover:text-violet-700 cursor-pointer lg:hidden">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => scrollRail(1)} aria-label="More screens"
                    className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-violet-200/70 transition hover:text-violet-700 cursor-pointer lg:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Swipeable rail on phones/tablets, five across on desktop */}
              <div ref={railRef}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] sm:gap-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">

                {/* 1 — Discover */}
                <Panel>
                  <div className="relative z-10 flex items-center justify-center gap-1.5 pt-5 text-[11px] font-black text-violet-700">
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-600 text-[10px] text-white">H</span> Hoppity
                  </div>
                  <div className="-mt-2"><PanelHead title="Discover" accent="Real India" sub="Northeast festivals, Himalayan treks, wildlife and slow coastal stays." /></div>
                  <div className="relative z-10 mx-auto mt-auto w-[62%] translate-y-6">
                    <Phone>
                      <div className="p-2 pt-7">
                        <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1.5 text-[8px] text-slate-400 ring-1 ring-violet-200/60">
                          <Search className="h-2.5 w-2.5" /> Where to next?
                        </div>
                        <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl bg-violet-300">
                          {t(0)?.cover && <img src={t(0).cover} alt="" className="h-full w-full object-cover" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                          <p className="absolute inset-x-1.5 bottom-1.5 line-clamp-2 text-[8px] font-bold leading-tight text-white">{t(0)?.title || 'Featured departure'}</p>
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                          <MiniTrip trip={t(1)} />
                          <MiniTrip trip={t(2)} tone="fuchsia" />
                        </div>
                      </div>
                    </Phone>
                  </div>
                </Panel>

                {/* 2 — Booking */}
                <Panel variant="brand">
                  <PanelHead dark title="Book in" accent="a few taps" sub="The final price, before you pay. No surprises at checkout." />
                  <div className="bob relative z-10 mx-auto mt-auto w-[62%] translate-y-6" style={{ '--r': '-4deg' }}>
                    <Phone>
                      <div className="p-2 pt-7">
                        <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">Booking summary</p>
                        <div className="mt-1.5 overflow-hidden rounded-xl bg-white ring-1 ring-violet-200/60">
                          <div className="aspect-[16/9] bg-violet-200">
                            {t(1)?.cover && <img src={t(1).cover} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="p-2">
                            <p className="line-clamp-2 text-[9px] font-bold leading-tight text-slate-900">{t(1)?.title || 'Your trip'}</p>
                            <p className="mt-1 flex items-center gap-1 text-[8px] text-slate-500">
                              <Clock className="h-2 w-2" />{t(1)?.duration_display || t(1)?.duration || '6 days'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1.5 space-y-1 rounded-xl bg-white p-2 text-[8px] ring-1 ring-violet-200/60">
                          <div className="flex justify-between text-slate-500"><span>Travellers</span><span className="font-semibold text-slate-900">2</span></div>
                          <div className="flex justify-between border-t border-violet-100 pt-1 text-slate-500">
                            <span>Total</span>
                            <span className="font-black text-violet-700">{inr((t(1)?.price_per_person ?? t(1)?.price) * 2) || '₹—'}</span>
                          </div>
                        </div>
                        <div className="mt-1.5 rounded-full bg-violet-700 py-1.5 text-center text-[9px] font-bold text-white">Pay securely</div>
                      </div>
                    </Phone>
                  </div>
                </Panel>

                {/* 3 — Alerts */}
                <Panel>
                  <PanelHead title="New departures," accent="first to you" sub="Groups cap at twelve. The app tells you the moment seats open." />
                  <div className="relative z-10 mx-auto mt-auto w-[62%] translate-y-6">
                    <Phone>
                      <div className="h-full bg-gradient-to-b from-violet-900 to-fuchsia-900 p-2 pt-8">
                        <p className="text-center text-[22px] font-light text-white">9:41</p>
                        <p className="text-center text-[7px] text-white/60">Thursday, 1 October</p>
                        <div className="mt-3 space-y-1.5">
                          {[t(2), t(3), t(4)].map((trip, i) => (
                            <div key={i} className="flex gap-1.5 rounded-xl bg-white/90 p-1.5 backdrop-blur">
                              <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-violet-600 text-[8px] font-black text-white">H</span>
                              <div className="min-w-0">
                                <p className="text-[7px] font-bold text-slate-900">{i === 0 ? 'Seats just opened' : i === 1 ? 'Only 3 seats left' : 'New for this season'}</p>
                                <p className="truncate text-[7px] text-slate-600">{trip?.title || 'A new Hoppity trip'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Phone>
                  </div>
                  <span className="bob absolute right-5 top-[46%] z-20 grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/40" style={{ '--r': '12deg' }}>
                    <BellRing className="h-5 w-5" />
                  </span>
                </Panel>

                {/* 4 — Why us */}
                <Panel variant="brand">
                  <PanelHead dark title="Why travellers" accent="choose Hoppity" />
                  <div className="relative z-10 mt-1 flex justify-center gap-0.5 text-yellow-300">
                    {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <div className="relative z-10 mt-5 space-y-2.5 px-4">
                    {WHY.map(({ icon: Icon, label }, i) => (
                      <div key={label} className={`flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-slate-900 shadow-md shadow-violet-950/20 ${i % 2 ? 'ml-4' : 'mr-4'}`}>
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[11px] font-bold leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="relative z-10 mt-auto flex items-center justify-center gap-1.5 pb-6 text-[11px] text-white/80">
                    <Check className="h-3.5 w-3.5 text-fuchsia-200" /> 4.9★ from real travellers
                  </div>
                </Panel>

                {/* 5 — Start */}
                <Panel>
                  <div className="absolute inset-0">
                    {t(3)?.cover
                      ? <img src={t(3).cover} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full bg-gradient-to-br from-violet-400 to-fuchsia-400" />}
                    <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-white via-white/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-violet-950/85 to-transparent" />
                  </div>
                  <PanelHead title="Start your" accent="next trip today" />
                  <div className="relative z-10 mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-white/90 py-1 pl-1 pr-3 shadow-sm backdrop-blur">
                    <div className="flex -space-x-2">
                      {[subhagImg, pallaviImg, poojaImg, diwakarImg].map((src, i) => (
                        <img key={i} src={src} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-white" />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700">Join our travellers</span>
                  </div>
                  <div className="relative z-10 mt-auto p-4">
                    <p className="line-clamp-2 text-sm font-black leading-tight text-white">{t(3)?.title || 'Your next journey'}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-white/80"><MapPin className="h-3 w-3" />{t(3)?.location || 'India'}</p>
                  </div>
                </Panel>
              </div>

              {/* ── Title block under the screens, like the reference ── */}
              <div className="dl-title relative mt-10 px-5 text-center sm:mt-14">
                <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="bg-gradient-to-r from-violet-700 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Hoppity</span>{' '}
                  <span className="text-slate-950">App</span>
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
                  Curated offbeat trips and hand-picked stays across India — booked, tracked and supported from your phone.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  {stores.map(s => <StoreBadge key={s.key} {...s} />)}
                </div>
                <p className="mt-4 text-xs text-slate-400">Free to download · iOS &amp; Android</p>
              </div>

              {/* Floating brand discs, standing in for the reference's coins */}
              <span aria-hidden="true" className="bob pointer-events-none absolute bottom-24 left-[8%] hidden h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-black text-white shadow-xl shadow-violet-500/40 lg:grid" style={{ '--r': '-14deg' }}>H</span>
              <span aria-hidden="true" className="bob pointer-events-none absolute bottom-44 right-[10%] hidden h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-black text-white shadow-xl shadow-fuchsia-500/40 lg:grid" style={{ '--r': '18deg', animationDelay: '1.2s' }}>H</span>
            </div>
          </div>
        </section>

        {/* ═══ CLOSING CTA ═════════════════════════════════════════ */}
        <section className="mx-auto w-full max-w-[1500px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-violet-950">
            {hero?.cover && <img src={hero.cover} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-950/95 via-violet-950/88 to-fuchsia-900/75" />
            <div className="relative flex flex-col gap-6 p-6 text-white sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:p-10">
              <div>
                <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">Rather use the browser?</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-violet-200">Every trip and stay is on the website too.</p>
              </div>
              <Link to="/itineraries"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-slate-950 shadow transition hover:-translate-y-0.5 hover:bg-violet-50">
                Browse trips <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER (matches the landing page) ─────────────────────── */}
      <footer className="relative mx-auto w-full max-w-[1500px] px-5 pb-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 border-t border-violet-200/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black text-slate-950">Hoppity</p>
            <p className="mt-1 text-xs text-slate-500">Discover Real Travel · India</p>
            <div className="mt-4 flex items-center gap-4">
              <a href="https://www.instagram.com/hoppity_in" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 transition hover:scale-110 hover:text-pink-500"><FaInstagram className="text-xl" /></a>
              <a href="https://www.linkedin.com/company/triffair/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 transition hover:scale-110 hover:text-blue-600"><FaLinkedin className="text-xl" /></a>
              <a href="https://www.facebook.com/Hoppityin" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 transition hover:scale-110 hover:text-blue-500"><FaFacebook className="text-xl" /></a>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-sm text-slate-500 sm:items-end">
            <a href="mailto:sales@hoppity.in" className="transition hover:text-violet-700">sales@hoppity.in</a>
            <a href="https://wa.me/919752377323" target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 ring-1 ring-green-200 transition hover:bg-green-100">
              💬 WhatsApp us
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-violet-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-xs font-medium text-slate-400">Recognised by</span>
            <div className="flex items-center gap-4">
              <img src={dpiitlogo} alt="DPIIT - Department for Promotion of Industry and Internal Trade" className="h-8 w-auto object-contain" />
              <img src={startuplogo} alt="Startup India" className="h-7 w-auto object-contain" />
            </div>
          </div>
          <p className="text-xs text-slate-400">© 2026 Hoppity (Triffair). All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}