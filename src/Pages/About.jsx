import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react'
import Navbar from '../components/Navbar'

// ── Founder data ───────────────────────────────────────────────────────────
const founders = [
  {
    name: 'Sabyasachi Biswas',
    nickname: 'Saby',
    role: 'CEO & Co-Founder',
    origin: 'Bhopal → Delhi → Northeast India',
    linkedin: 'https://www.linkedin.com/in/biswas-sabyasachi/',
    avatar: 'SB',
    gradient: 'from-violet-600 to-purple-700',
    companies: ['Apple', 'Disney', 'Hike', 'JetSynthesys'],
    tagline: 'The one who fell in love with a place no one was talking about.',
    story: `Saby spent a decade at the intersection of tech, media, and culture — as Games Editor at Apple, where he advised Tencent, Supercell, and Activision and drove Diwali billings up 400% in a single month. Then at Disney, where he launched gaming franchises for Marvel and Star Wars across India, the Middle East, and North Africa. He understood how to build things people love.

At 24, he'd already started Madras Motorcycles — a community built around Royal Enfield, TVS, and Harley-Davidson. The entrepreneurial itch was always there.

Then came Northeast India. A slow road through Meghalaya. Root bridges older than anything he'd ever seen. Villages with no WiFi and infinite stories. Stays that felt like being welcomed into someone's life rather than their inventory. He looked for a platform that could do those places justice. There wasn't one. That absence became Hoppity.`,
    credentials: [
      'Apple — 400% Diwali billings growth M/M',
      'Disney — 10M+ impressions across game launches',
      'Founded Madras Motorcycles at 24',
      'Hike — CxO-level BD across gaming, telcos, payments',
    ],
  },
  {
    name: 'Dipak Jha',
    nickname: 'Dipak',
    role: 'CTO & Co-Founder',
    origin: 'India → UK → Building for Real India',
    linkedin: 'https://www.linkedin.com/in/dipakjhauk/',
    avatar: 'DJ',
    gradient: 'from-slate-700 to-slate-900',
    companies: ['UK Government', 'UK Retail', 'AWS', 'Cloud'],
    tagline: 'The one who builds things that can carry the weight of a dream.',
    story: `Dipak spent 20+ years in the UK — delivering transformation and migration projects for government bodies and major retail chains. The kind of work where if the architecture fails, millions of people are affected. He learned how to build for scale, for trust, for permanence.

AWS-Certified across Solutions, Integration, and Technical Architecture — he is the rare technologist who can hold an entire system in his head and also write the code to execute it. He's currently pursuing a Masters in AI & Machine Learning, because he refuses to stop learning.

When Saby came to him with Hoppity, Dipak saw something most people miss: this isn't just a travel app. It's a data platform, a discovery engine, a community. He came back to build the infrastructure that could carry that vision — a backend that can scale from a few hundred travellers to millions without losing its soul.`,
    credentials: [
      '20+ years — UK government and retail transformation',
      'AWS Certified: Solutions, Integration, Technical Architect',
      'Masters in AI & Machine Learning (in progress)',
      "Architecting Hoppity's entire cloud infrastructure",
    ],
  },
  {
    name: 'Ajay Seth',
    nickname: 'Ajay',
    role: 'Co-Founder & Chief Strategist',
    origin: "30 years building India's travel industry",
    linkedin: null,
    avatar: 'AS',
    gradient: 'from-amber-600 to-orange-700',
    companies: ['Cox & Kings', 'MICE', 'Trade Fairs', 'DMCs'],
    tagline: "The one who already knew where the bodies were buried — and where the gold was.",
    story: `Ajay didn't join Hoppity to learn the travel industry. He built it. At Cox & Kings, he led 8X revenue growth — not by accident, but by systematically building verticals that didn't exist: MICE, Trade Fairs, experiential travel. He took underperforming divisions and turned them into high-growth engines. He's been doing it for 30 years across national and international markets.

When Saby showed him what Hoppity was trying to do — create a new category at the intersection of authentic experience and digital distribution — Ajay recognised it immediately. This was the product the industry had been waiting for and didn't know how to build.

In the time since joining, he's done what only someone with his depth of relationships can do: onboarded Paramount, AV Tours, Villotale, Chalohoppo, Magic Moments, Clubside, and Help Tourism as B2B partners. Not because he sent emails. Because when Ajay Seth calls, people pick up.`,
    credentials: [
      'Cox & Kings — engineered 8X revenue growth',
      '30+ years travel & tourism P&L leadership',
      '7 B2B partners onboarded from day one',
      'Deep global partnerships across DMCs and travel trade',
    ],
  },
]

// ── Brand logos (text-based since we don't have images) ────────────────────
const brandLogos = [
  { name: 'Apple', color: '#1d1d1f' },
  { name: 'Disney', color: '#0d5eaf' },
  { name: 'Cox & Kings', color: '#8b0000' },
  { name: 'AWS', color: '#FF9900' },
  { name: 'UK Gov', color: '#00205B' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f1ff] text-slate-900">
      <Navbar />

      {/* ── ORIGIN STORY ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16">
        {/* Deep atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-900 to-slate-900" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(124,58,237,0.4), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139,92,246,0.3), transparent)',
          }}
        />

        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 lg:px-10 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-200 mb-10 backdrop-blur-sm">
            Built by operators, not observers
          </div>

          {/* Pull quote — the origin moment */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300 mb-5">
              Meghalaya, 2022
            </p>
            <blockquote className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-[-0.04em] text-white mb-6">
              "There was a root bridge older than most countries, a village with no signal, a meal cooked over fire by someone who'd never left the valley. And no platform in the world was doing it justice."
            </blockquote>
            <p className="text-base text-violet-200 font-semibold">
              — Sabyasachi Biswas, one month before starting Hoppity
            </p>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center">
            <div className="w-px h-16 bg-gradient-to-b from-white/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM THEY SAW ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-4">
                The gap they couldn't unsee
              </p>
              <h2 className="text-4xl md:text-4xl font-extrabold tracking-tight text-slate-950 leading-tight mb-6">
                India is one of the most extraordinary travel destinations on earth. Its platforms treat it like a commodity.
              </h2>
              <p className="text-base text-slate-700 leading-8 mb-5">
                Most travel companies optimise for volume. More listings. More inventory. More destinations all flattened to the same template — a star rating, a price, and a checkout button.
              </p>
              <p className="text-base text-slate-700 leading-8">
                Hoppity was built for the opposite. Not more of India, but <em>more India</em> — deeper, truer, stranger, more alive. The places you remember not because you photographed them but because they changed something in you.
              </p>
            </div>

            {/* Stats block */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { number: '30+', label: 'Years of combined travel industry expertise' },
                { number: '8×', label: 'Revenue growth driven by Ajay at Cox & Kings' },
                { number: '20+', label: 'Years of enterprise tech experience from Dipak' },
                { number: '7+', label: 'B2B travel partners onboarded from day one' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-[#f7f1ff] border border-violet-100 p-6">
                  <div className="text-4xl font-black tracking-tight text-violet-700 mb-2">{s.number}</div>
                  <div className="text-xs text-slate-600 leading-snug font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BRAND CREDIBILITY STRIP ─────────────────────────────────────── */}
      <div className="bg-slate-50 border-y border-slate-100 py-5">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 flex-shrink-0">Built at</p>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            {brandLogos.map((b) => (
              <span
                key={b.name}
                className="text-xs font-black tracking-tight px-3 py-1.5 rounded-lg"
                style={{ color: b.color, background: `${b.color}12` }}
              >
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOUNDER STORIES ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 py-16 space-y-24">
        {founders.map((founder, idx) => (
          // FIX 1: Use a ternary for the entire grid-cols class so only ONE value is applied.
          // Previously both lg:grid-cols-[1fr_1.6fr] and lg:grid-cols-[1.6fr_1fr] were present
          // simultaneously in the className string, causing the column sizing to never flip.
          <div
            key={founder.name}
            className={`grid gap-12 lg:gap-16 items-start ${
              idx % 2 === 1
                ? 'lg:grid-cols-[1.6fr_1fr]'
                : 'lg:grid-cols-[1fr_1.6fr]'
            }`}
          >
            {/* Left: Identity card */}
            <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
              {/* Avatar */}
              <div
                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${founder.gradient} flex items-center justify-center text-white text-2xl font-black mb-6 shadow-lg`}
              >
                {founder.avatar}
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-2">
                {founder.role}
              </p>
              <h3 className="text-3xl font-bold tracking-tight text-slate-950 mb-1">
                {founder.name}
              </h3>
              <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-6">
                <MapPin className="w-3.5 h-3.5" />
                {founder.origin}
              </p>

              {/* Tagline */}
              <div className="rounded-2xl bg-slate-950 p-5 mb-6">
                <p className="text-white text-sm font-semibold leading-relaxed italic">
                  {founder.tagline}
                </p>
              </div>

              {/* Credentials */}
              <div className="space-y-2.5">
                {founder.credentials.map((c) => (
                  <div key={c} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    {c}
                  </div>
                ))}
              </div>

              {/* LinkedIn */}
              {founder.linkedin && (
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-violet-700 hover:text-violet-900 transition"
                >
                  View on LinkedIn <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Right: Story */}
            <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
              <div className="rounded-3xl bg-white border border-violet-100 p-8 lg:p-10 shadow-sm">
                {/* Story paragraphs */}
                <div className="space-y-5">
                  {founder.story.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      className={`leading-8 text-slate-700 ${
                        i === 0 ? 'text-base font-semibold text-slate-800' : 'text-sm'
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Companies strip */}
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
                  {founder.companies.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── WHAT THEY BRING TOGETHER ─────────────────────────────────────── */}
      <section className="bg-slate-950 py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400 mb-4">
              The whole is greater
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
              One team. Three unfair advantages. Zero tolerance for generic travel.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎮',
                title: 'The Product & Story Mind',
                who: 'Saby',
                desc: 'Understands how to build things people love — and how to make them feel something. Honed at Apple, Disney, and Hike, where attention is the scarcest resource.',
              },
              {
                icon: '⚙️',
                title: 'The Infrastructure Mind',
                who: 'Dipak',
                desc: 'Builds for permanence, not demos. 20 years of enterprise-grade architecture means Hoppity scales without breaking — from 100 users to 10 million.',
              },
              {
                icon: '🤝',
                title: 'The Industry Mind',
                who: 'Ajay',
                desc: '30 years of trust is not something you raise in a funding round. Its already here. The partner network, the distribution, the market knowledge — Ajay brought it on day one.',
              },
            ].map((item) => (
              // FIX 2: hover:bg-white/8 is not a valid Tailwind class (steps are 5,10,15…)
              // Changed to hover:bg-white/10
              <div
                key={item.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-7 hover:bg-white/10 transition"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-1">{item.who}</p>
                <h3 className="text-lg font-black text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE BELIEVE ─────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-4">
                Why we built this
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 leading-tight mb-6">
                Travel should return you to yourself. Most of it doesn't.
              </h2>
              <div className="space-y-4 text-slate-700 leading-8">
                <p className="text-base">
                  Most platforms are built for transactions. They have no opinion about where you go, as long as you book. They have no stake in whether the trip changes you.
                </p>
                <p className="text-base">
                  We have an opinion. We believe the hidden village matters more than the five-star hotel. We believe the host who cooks from memory matters more than the one who hired a chef. We believe a journey should cost you something — not just money, but attention, presence, willingness to be surprised.
                </p>
                <p className="font-semibold text-slate-800 text-base">
                  That's not a product feature. That's a worldview. And it's why this team exists.
                </p>
              </div>
            </div>

            {/* Mission statement card */}
            <div className="rounded-3xl bg-gradient-to-br from-violet-700 via-violet-800 to-fuchsia-800 p-10 text-white shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200 mb-5">
                The Hoppity mission
              </p>
              <p className="text-xl font-black leading-tight mb-6">
                To make authentic, off-the-beaten-path India accessible to every curious traveller — and to do it with the depth, care, and editorial conviction it deserves.
              </p>
              <div className="space-y-3 text-sm text-violet-100">
                {['Curated, not catalogued', 'Story-led, not stock-photo-led', 'Built on trust between travellers and hosts'].map(
                  (b) => (
                    <div key={b} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-300 flex-shrink-0" />
                      {b}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── B2B PARTNER NETWORK ─────────────────────────────────────────── */}
      <section className="bg-[#f7f1ff] py-14 border-y border-violet-100">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Already on the ground
          </p>
          <h3 className="text-2xl font-bold text-slate-950 mb-8">
            Ajay's first call resulted in 7 partner networks. That's what 30 years looks like.
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['Paramount', 'AV Tours', 'Villotale', 'Chalohoppo', 'Magic Moments', 'Clubside', 'Help Tourism'].map(
              (p) => (
                <span
                  key={p}
                  className="bg-white border border-violet-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-full shadow-sm"
                >
                  {p}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-950 mb-5">
            The trip that started this company is still out there.
          </h2>
          <p className="text-base text-slate-700 max-w-xl mx-auto mb-10 leading-8">
            The root bridges. The valley with no signal. The host who cooks from memory. Come find them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/itineraries"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5"
            >
              Explore itineraries <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-white px-7 py-4 text-base font-semibold text-violet-800 shadow-sm transition hover:-translate-y-0.5"
            >
              Talk to the team
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER STRIP ────────────────────────────────────────────────── */}
      <footer className="border-t border-violet-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© 2026 Hoppity (Triffair). All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/" className="hover:text-violet-700 transition">Home</Link>
            <Link to="/itineraries" className="hover:text-violet-700 transition">Itineraries</Link>
            <Link to="/contact" className="hover:text-violet-700 transition">Contact</Link>
            <Link to="/privacy" className="hover:text-violet-700 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}