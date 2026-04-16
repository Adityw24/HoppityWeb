import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import Navbar from '../components/Navbar'

// ── Photos — add these files to src/assets/ when ready ──────────────────────
import sabyPhoto from '../assets/saby.jpg'
import ajayPhoto from '../assets/ajay.jpg'
import { setPageSEO } from '../lib/seo'
// import dipakPhoto from '../assets/dipak.jpg'
// Then set photo: sabyPhoto, photo: ajayPhoto, photo: dipakPhoto below

const founders = [
  // ── 1. Sabyasachi (Sab) ───────────────────────────────────────────────────
  {
    name: 'Sabyasachi (Sab) Biswas',
    nickname: 'Sab',
    role: 'CEO & Co-Founder',
    origin: 'Bhopal → Delhi → Northeast India',
    linkedin: 'https://www.linkedin.com/in/biswas-sabyasachi/',
    avatar: 'SB',
    photo: sabyPhoto,
    gradient: 'from-violet-600 to-purple-700',
    accentColor: '#7c3aed',
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
  // ── 2. Ajay (AJ) ─────────────────────────────────────────────────────────
  {
    name: 'Ajay (AJ) Seth',
    nickname: 'AJ',
    role: 'Co-Founder & Chief Strategist',
    origin: '30 years building India\'s travel industry',
    linkedin: null,
    avatar: 'AJ',
    photo: ajayPhoto,
    gradient: 'from-amber-600 to-orange-700',
    accentColor: '#d97706',
    companies: ['Cox & Kings', 'MICE', 'Trade Fairs', 'DMCs'],
    tagline: 'The one who already knew where the bodies were buried — and where the gold was.',
    story: `AJ didn't join Hoppity to learn the travel industry. He built it. At Cox & Kings, he led 8X revenue growth — not by accident, but by systematically building verticals that didn't exist: MICE, Trade Fairs, experiential travel. He took underperforming divisions and turned them into high-growth engines. He's been doing it for 30 years across national and international markets.

When Sab showed him what Hoppity was trying to do — create a new category at the intersection of authentic experience and digital distribution — AJ recognised it immediately. This was the product the industry had been waiting for and didn't know how to build.

In the time since joining, he's done what only someone with his depth of relationships can do: onboarded Paramount, AV Tours, Villotale, Chalohoppo, Magic Moments, Clubside, and Help Tourism as B2B partners. Not because he sent emails. Because when AJ Seth calls, people pick up.`,
    credentials: [
      'Cox & Kings — engineered 8X revenue growth',
      '30+ years travel & tourism P&L leadership',
      '7 B2B partners onboarded from day one',
      'Deep global partnerships across DMCs and travel trade',
    ],
  },
  // ── 3. Dipak ─────────────────────────────────────────────────────────────
  {
    name: 'Dipak Jha',
    nickname: 'Dipak',
    role: 'CTO & Co-Founder',
    origin: 'India → UK → Building for Real India',
    linkedin: 'https://www.linkedin.com/in/dipakjhauk/',
    avatar: 'DJ',
    photo: null,
    gradient: 'from-slate-700 to-slate-900',
    accentColor: '#475569',
    companies: ['UK Government', 'UK Retail', 'AWS', 'Cloud'],
    tagline: 'The one who builds things that can carry the weight of a dream.',
    story: `Dipak spent 20+ years in the UK — delivering transformation and migration projects for government bodies and major retail chains. The kind of work where if the architecture fails, millions of people are affected. He learned how to build for scale, for trust, for permanence.

AWS-Certified across Solutions, Integration, and Technical Architecture — he is the rare technologist who can hold an entire system in his head and also write the code to execute it. He's currently pursuing a Masters in AI & Machine Learning, because he refuses to stop learning.

When Sab came to him with Hoppity, Dipak saw something most people miss: this isn't just a travel app. It's a data platform, a discovery engine, a community. He came back to build the infrastructure that could carry that vision — a backend that can scale from a few hundred travellers to millions without losing its soul.`,
    credentials: [
      '20+ years — UK government and retail transformation',
      'AWS Certified: Solutions, Integration, Technical Architect',
      'Masters in AI & Machine Learning (in progress)',
      "Architecting Hoppity's entire cloud infrastructure",
    ],
  },
]

export default function AboutPage() {
  useEffect(() => {
    setPageSEO({
      title: 'About Us – The Team Behind Hoppity',
      description: "Meet Sab, AJ, and Dipak — the founders behind Hoppity. A decade in tech, 30 years in travel, and an architecture career in the UK. Building the platform India's extraordinary places deserve.",
      canonical: '/about',
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-950 to-slate-900 pointer-events-none" />
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(124,58,237,0.4), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139,92,246,0.3), transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

        <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300 mb-5">Our Story</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Built by people who got lost<br className="hidden sm:block" /> in India and loved it.
          </h1>
          <p className="text-lg text-slate-300 leading-8 max-w-2xl mx-auto mb-8">
            Hoppity exists because the best places in India are invisible to algorithms.
            The root bridges. The village homestays. The festivals that don't have Wikipedia pages.
            We're building the platform those places deserve.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/itineraries"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition shadow-lg">
              Explore Itineraries
            </Link>
            <Link to="/contact"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur border border-white/20 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOUNDERS ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-600 mb-3">The team</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
            Three founders. One obsession.
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            A decade in tech & media. Thirty years in travel. An architecture career in the UK.
            Different paths, same conclusion: India's best experiences deserved better infrastructure.
          </p>
        </div>

        <div className="space-y-16">
          {founders.map((f, idx) => (
            <div key={f.name}
              className={`flex flex-col gap-8 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>

              {/* Photo / Avatar */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4 lg:w-72">
                <div className="relative">
                  {f.photo ? (
                    <img src={f.photo} alt={f.name}
                      className="w-52 h-52 rounded-3xl object-cover shadow-2xl border-4 border-white" />
                  ) : (
                    <div className={`w-52 h-52 rounded-3xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-2xl border-4 border-white`}>
                      <span className="text-5xl font-black text-white/90">{f.avatar}</span>
                    </div>
                  )}
                  {/* Role badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-1.5 whitespace-nowrap border border-violet-100">
                    <p className="text-xs font-bold text-slate-700">{f.role}</p>
                  </div>
                </div>

                {/* Name + LinkedIn */}
                <div className="text-center mt-4">
                  <h3 className="text-xl font-black text-slate-950 leading-tight">{f.name}</h3>
                  {f.linkedin && (
                    <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 mt-1 font-semibold transition">
                      <ExternalLink className="w-3 h-3" /> LinkedIn
                    </a>
                  )}
                </div>

                {/* Credentials */}
                <div className="w-full bg-white rounded-2xl border border-violet-100 p-4 shadow-sm">
                  <ul className="space-y-2">
                    {f.credentials.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.accentColor }} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Story */}
              <div className="flex-1 flex flex-col justify-center">
                <div className={`inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full text-white`}
                  style={{ background: f.accentColor }}>
                  {f.nickname}
                </div>
                <p className="text-xl md:text-2xl font-bold text-slate-800 leading-snug mb-5 italic">
                  "{f.tagline}"
                </p>
                <div className="space-y-4">
                  {f.story.split('\n\n').map((para, i) => (
                    <p key={i} className="text-slate-600 leading-8 text-[15px]">{para}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE BELIEVE ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-900 py-16 px-6">
        <div className="mx-auto max-w-4xl text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300 mb-4">What we believe</p>
          <h2 className="text-3xl md:text-4xl font-black mb-10 leading-tight">
            The best trips aren't discovered.<br className="hidden sm:block" /> They're curated.
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: '🗺️', title: 'Curated, not catalogued', body: 'Every itinerary on Hoppity is hand-picked. We\'d rather have 50 exceptional experiences than 5,000 average ones.' },
              { icon: '🤝', title: 'Guides, not influencers', body: 'Our experiences are led by people who\'ve spent years in the places they show you. Knowledge built over decades, not content built over weekends.' },
              { icon: '🌱', title: 'Local first', body: 'Every booking puts money directly into the communities hosting you. That\'s not a tagline. That\'s the business model.' },
            ].map(item => (
              <div key={item.title} className="bg-white/8 backdrop-blur border border-white/10 rounded-2xl p-6 text-left hover:bg-white/12 transition">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white/8 border border-white/10 rounded-2xl p-7 text-left">
            <p className="text-lg font-bold text-white mb-2">
              "There are places in India that will rearrange your understanding of what travel can mean."
            </p>
            <p className="text-sm text-violet-300">
              That's not a product feature. That's a worldview. And it's why this team exists.
            </p>
          </div>
        </div>
      </section>

      {/* ── PARTNER NETWORK ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 py-14">
        <div className="bg-white rounded-3xl border border-violet-100 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-600 mb-2">The network</p>
              <h2 className="text-2xl font-black text-slate-950">
                AJ's first call resulted in 7 partner networks.<br />
                <span className="text-slate-500 font-semibold text-lg">That's what 30 years looks like.</span>
              </h2>
            </div>
            <Link to="/itineraries"
              className="flex-shrink-0 bg-violet-700 text-white font-semibold text-sm px-6 py-3 rounded-2xl hover:bg-violet-800 transition shadow-md">
              Browse Itineraries →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Paramount', 'AV Tours', 'Villotale', 'Chalohoppo', 'Magic Moments', 'Clubside', 'Help Tourism', 'Growing…'].map(p => (
              <div key={p} className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-slate-700">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 pb-16">
        <div className="bg-gradient-to-br from-violet-700 to-purple-800 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200 mb-4">Ready to go?</p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Find your India.</h2>
          <p className="text-violet-200 max-w-lg mx-auto mb-8">
            Every great journey starts with the decision to look somewhere most people don't.
            We'll take it from there.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/itineraries"
              className="bg-white text-violet-800 font-bold px-8 py-3.5 rounded-2xl hover:bg-violet-50 transition shadow-lg">
              Explore Itineraries
            </Link>
            <Link to="/contact"
              className="bg-white/15 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/20 transition">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
