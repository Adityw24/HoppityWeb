import { useParams, useNavigate, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  ArrowLeft, Star, MapPin, Clock, Wifi, Coffee, Flame,
  Anchor, Utensils, Shield, Users, Waves, Phone, MessageCircle,
  ChevronLeft, ChevronRight, Check, Share2, Heart, Calendar,
  Crown, Sparkles
} from "lucide-react"

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
  pageBg:        '#0e0420',
  surface:       '#1a0838',
  surfaceHi:     '#241050',
  surfaceLow:    '#120630',
  border:        'rgba(167,139,250,0.14)',
  borderGold:    'rgba(196,163,90,0.22)',
  borderGoldHi:  'rgba(196,163,90,0.44)',
  gold:          '#c4a35a',
  goldLight:     '#f0d080',
  goldDim:       'rgba(196,163,90,0.12)',
  goldBorder:    'rgba(196,163,90,0.28)',
  violet:        '#a78bfa',
  violetBright:  '#c4b5fd',
  violetDeep:    '#7c3aed',
  ivory:         '#f0ebff',
  ivoryDim:      'rgba(240,235,255,0.55)',
  ivoryFaint:    'rgba(240,235,255,0.28)',
}

// ── Dummy Data ────────────────────────────────────────────────────────────────
const DUMMY_MAP = {
  'tiger-trail-lodge-corbett': {
    id: 's1', slug: 'tiger-trail-lodge-corbett',
    title: 'Tiger Trail Lodge',
    location: 'Jim Corbett, Uttarakhand',
    duration_display: 'Per night', price_per_person: 14500,
    tag: 'Jungle Lodge',
    blurb: 'A boutique jungle retreat on the edge of Corbett buffer zone. Morning safari, candlelit dining, and elephants in the wild.',
    description: `Tiger Trail Lodge sits on 4 acres of private buffer forest on the edge of Jim Corbett National Park — the oldest national park in India and home to over 200 Bengal tigers.\n\nThe property has 8 luxury cottages, each with a private sit-out facing the forest. Naturalists on staff run early-morning jeep safaris into the Dhikala zone, and evening walks along the property's own nature trail are a guest favourite.\n\nDinners are lit by lantern, served under a canopy of sal trees with a set menu of Kumaoni cuisine and garden-fresh vegetables. The salt-water pool is unheated but perfectly refreshing after a morning in the forest.\n\nBest season: November to June. The park closes from July to mid-November.`,
    image: [
      'https://images.unsplash.com/photo-1549366021-9f761d450615?w=1200&q=85',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
    ],
    rating: 4.9, review_count: 67,
    amenities: ['Safari', 'Pool', 'Fine Dining', 'Bonfire', 'Spa', 'Naturalist'],
    highlights: ['Private buffer forest boundary', 'Expert naturalist-led safaris', 'Kumaoni cuisine by lantern light', 'Salt-water pool in the jungle'],
    what_included: ['Cottage stay', 'All meals', 'Morning safari', 'Nature walk', 'Naturalist guide'],
    what_not_included: ['Park entry fees', 'Jeep hire (separate tariff)', 'Alcohol', 'Transport'],
    cancellation: 'Free cancellation up to 7 days before check-in. 50% refund within 7–3 days. No refund under 3 days.',
  },
  'suryagarh-palace-jaisalmer': {
    id: 's2', slug: 'suryagarh-palace-jaisalmer',
    title: 'Suryagarh Palace',
    location: 'Jaisalmer, Rajasthan',
    duration_display: 'Per night', price_per_person: 22000,
    tag: 'Heritage Hotel',
    blurb: 'A modern fortress-hotel sculpted from golden Jaisalmer sandstone. Desert dunes at your doorstep, royal-to-the-bone hospitality.',
    description: `Suryagarh is built entirely from Jaisalmer's famous yellow limestone — a 112-room palace that looks like it emerged from the desert itself. It sits 7 km from the Sam Sand Dunes, with a private dune access path for guests.\n\nThe architecture is a meticulous recreation of a Rajput palace: jharokha windows, carved jaali screens, intricate frescoes. Rooms are designed as suites with traditional textiles, four-poster beds, and sandstone bathrooms.\n\nThe property runs a nightly cultural programme — folk music, puppet shows, and a desert campfire dinner with live performance. The Nao restaurant is considered one of Jaisalmer's finest.\n\nThe spa uses local sesame and rose extracts. Book the rooftop pool at dawn — the dunes turn gold as the sun rises.`,
    image: [
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=1200&q=85',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=85',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=85',
    ],
    rating: 4.9, review_count: 142,
    amenities: ['Pool', 'Spa', 'Cultural shows', 'Fine Dining', 'Desert safari', 'Rooftop bar'],
    highlights: ['7 km from Sam Sand Dunes', 'Nightly Rajasthani cultural programme', 'Award-winning Nao restaurant', 'Private dune access at dawn'],
    what_included: ['Suite stay', 'Breakfast & dinner', 'Cultural evening programme', 'Spa access'],
    what_not_included: ['Camel safari', 'Jeep safari', 'Lunch', 'Alcohol', 'Transport'],
    cancellation: 'Free cancellation up to 10 days before check-in. No refund within 10 days.',
  },
  'windermere-estate-munnar': {
    id: 's3', slug: 'windermere-estate-munnar',
    title: 'Windermere Estate',
    location: 'Munnar, Kerala',
    duration_display: 'Per night', price_per_person: 9800,
    tag: 'Estate Stay',
    blurb: "A planter's bungalow inside a working tea estate. Morning mist over endless green, estate tours, and colonial-era charm.",
    description: `Windermere Estate has been a working tea and cardamom plantation since 1875. The main bungalow — a colonial planter's residence — has been restored as a 14-room boutique stay while the estate continues to produce award-winning Munnar tea.\n\nWake to mist rolling over 3,000 acres of tea terraces. Mornings start with a self-guided estate walk and a cupping session where you compare three single-origin teas from the same hillside.\n\nThe dining room serves traditional Kerala sadya meals on banana leaf, with vegetables from the kitchen garden and fish from the Mattupetty reservoir.\n\nThe estate is at 5,200 ft, so bring layers. Nearest airport: Cochin (4 hrs).`,
    image: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=85',
    ],
    rating: 4.8, review_count: 88,
    amenities: ['Tea tours', 'Pool', 'Bonfire', 'Home-cooked meals', 'Wifi', 'Library'],
    highlights: ["1875 colonial planter's bungalow", 'Live tea estate with daily tours', 'Kerala sadya on banana leaf', 'Cardamom harvest season visits'],
    what_included: ['Room with all meals', 'Tea estate tour & cupping', 'Complimentary wi-fi', 'All linen', 'Bonfire on request'],
    what_not_included: ['Transport', 'Cardamom picking activity (seasonal surcharge)', 'Alcohol'],
    cancellation: 'Free cancellation up to 7 days before check-in. 50% charge within 7–3 days.',
  },
  'kodai-treehouse-kodaikanal': {
    id: 's4', slug: 'kodai-treehouse-kodaikanal',
    title: 'The Kodai Treehouse',
    location: 'Kodaikanal, Tamil Nadu',
    duration_display: 'Per night', price_per_person: 8500,
    tag: 'Treehouse',
    blurb: 'Sleep among the clouds in a hand-crafted eucalyptus treehouse. Panoramic valley views, no screens, total disconnection.',
    description: `The Kodai Treehouse is a single-suite property — only one booking at a time — built 18 feet off the ground into a cluster of centurion eucalyptus trees on the Kodaikanal plateau.\n\nThe structure is entirely hand-built using traditional carpentry and rope joints, no metal fasteners in the main frame. Floor-to-ceiling glass on three sides means you wake to an uninterrupted panorama of the Palani Hills valley.\n\nThere is no TV, no in-room phone, and the kitchen serves only what the host harvests from the property: seasonal fruits, cold-pressed oils, wood-fired flatbreads.\n\nA resident naturalist takes guests on a 2-hour morning walk to spot Nilgiri langurs, shola birds, and the rare Kodai rose.`,
    image: [
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=85',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
    ],
    rating: 4.7, review_count: 54,
    amenities: ['Valley views', 'Meals', 'Nature walks', 'Bonfire', 'Wifi'],
    highlights: ['Exclusive single-suite property', '18 ft hand-built eucalyptus treehouse', 'No TV · total digital detox', 'Nilgiri langur nature walks daily'],
    what_included: ['Treehouse suite', 'All meals (farm-to-table)', 'Morning nature walk', 'Evening bonfire'],
    what_not_included: ['Transport', 'Alcohol', 'Trekking guide (on request)'],
    cancellation: 'Free cancellation up to 14 days before check-in. No refund within 14 days (exclusive property).',
  },
  'barefoot-havelock-andaman': {
    id: 's5', slug: 'barefoot-havelock-andaman',
    title: 'Barefoot at Havelock',
    location: 'Havelock Island, Andaman',
    duration_display: 'Per night', price_per_person: 18000,
    tag: 'Beach Villa',
    blurb: "Pristine beach cottages on Radhanagar — Asia's finest beach. Snorkelling, bioluminescent nights, silence like nowhere else.",
    description: `Barefoot at Havelock occupies 7 acres of beachfront on Radhanagar Beach — rated Asia's best beach multiple years running by Time magazine. The 28 cottages are built from bamboo, palm thatch, and reclaimed timber.\n\nThe house reef is 50 metres from the shore, rich with parrotfish, hawksbill turtles, and staghorn coral gardens. Snorkelling equipment is provided free. The dive centre runs PADI courses and liveaboard day trips.\n\nBioluminescent plankton blooms appear most nights between October and March — wade knee-deep at midnight and watch the water glow around you.\n\nThe restaurant serves a daily changing menu of fresh Andaman catch — red snapper, lobster, barracuda.`,
    image: [
      'https://images.unsplash.com/photo-1540202404-d0c7fe46a1b6?w=1200&q=85',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85',
    ],
    rating: 4.9, review_count: 213,
    amenities: ['Snorkelling', 'Beach access', 'Spa', 'All meals', 'Water sports', 'Dive centre'],
    highlights: ["Radhanagar — Asia's best beach", 'Bioluminescent plankton nights', 'House reef 50 m from shore', 'Sunset fishing + cook your catch'],
    what_included: ['Beach cottage', 'All meals', 'Snorkelling equipment', 'Kayak access', 'Sunset fishing trip'],
    what_not_included: ['Scuba diving (extra)', 'Alcohol', 'Liveaboard day trips', 'Ferry transfers'],
    cancellation: 'Free cancellation up to 15 days before check-in. No refund within 15 days (remote island logistics).',
  },
  'nimmu-house-ladakh': {
    id: 's6', slug: 'nimmu-house-ladakh',
    title: 'Nimmu House',
    location: 'Nimmu, Ladakh',
    duration_display: 'Per night', price_per_person: 12000,
    tag: 'Heritage Stay',
    blurb: 'A 200-year-old royal residence in the Indus Valley. Stone walls, silk duvets, and the Zanskar confluence 5 min away.',
    description: `Nimmu House is a 200-year-old Ladakhi royal residence converted into a 10-room heritage stay without altering its mud-brick walls, carved wooden windows, or traditional Buddhist prayer room.\n\nThe property sits in the Indus Valley at 3,250 m, 5 minutes from the Zanskar–Indus confluence — one of the most dramatic river junctions in the world, where turquoise Zanskar water meets the brown Indus in a visible line mid-river.\n\nRooms have hand-embroidered silk duvets, locally woven rugs, and electric blankets. Meals are prepared by the family — traditional Ladakhi thukpa, skyu, and butter tea are non-negotiable parts of every dinner.\n\nExcursions include sunrise at the confluence, day trips to Likir Monastery, Magnetic Hill, and the Hall of Fame.`,
    image: [
      'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1200&q=85',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85',
    ],
    rating: 4.8, review_count: 91,
    amenities: ['River views', 'All meals', 'Excursions', 'Wifi', 'Bonfire', 'Heritage tour'],
    highlights: ['200-year-old royal residence', 'Zanskar–Indus confluence 5 min away', 'Ladakhi family-cooked meals', 'Day trips to 5+ major sites'],
    what_included: ['Heritage room', 'All meals (Ladakhi cuisine)', 'Wi-fi', 'Excursion planning', 'Cultural heritage tour'],
    what_not_included: ['Vehicle hire', 'Entry fees', 'Alcohol', 'Transport from Leh'],
    cancellation: 'Free cancellation up to 7 days before check-in. 50% refund within 7–3 days.',
  },
}

const AMENITY_ICONS = {
  'Wifi': Wifi, 'Cafe': Coffee, 'Bonfire': Flame, 'Pool': Waves,
  'Spa': Shield, 'Safari': MapPin, 'Snorkelling': Anchor, 'Naturalist': Users,
  'All meals': Utensils, 'Home-cooked meals': Utensils, 'Meals': Utensils,
  'Fine Dining': Utensils, 'Tea tours': Coffee, 'Beach access': Anchor,
  'Water sports': Anchor, 'Dive centre': Anchor, 'Valley views': MapPin,
  'River views': MapPin, 'Nature walks': MapPin, 'Excursions': MapPin,
  'Cultural shows': Users, 'Desert safari': MapPin, 'Rooftop bar': Coffee,
  'Library': Shield, 'Heritage tour': MapPin,
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('${FONT_HREF}');
  .fp-prop * { box-sizing: border-box; }
  .fp-prop { font-family: 'DM Sans', sans-serif; background: #0e0420; min-height: 100vh; }
  .fp-serif { font-family: 'Cormorant Garamond', Georgia, serif !important; }

  /* shimmer line */
  .fp-shimmer {
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #b8924e 25%, #f0d080 50%, #b8924e 75%, transparent 100%);
  }
  .fp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.28), rgba(196,163,90,0.22), rgba(124,58,237,0.28), transparent);
  }

  /* dot divider */
  .fp-ornrow {
    display: flex; align-items: center; gap: 12px; margin: 32px 0;
  }
  .fp-ornrow-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(196,163,90,0.28), transparent); }
  .fp-ornrow-dot  { width: 4px; height: 4px; border-radius: 50%; background: #c4a35a; flex-shrink: 0; }

  /* back button */
  .fp-prop-back {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 100px;
    background: rgba(240,235,255,0.07); border: 1px solid rgba(240,235,255,0.14);
    color: rgba(240,235,255,0.70); font-size: 13px; font-family: 'DM Sans',sans-serif; font-weight: 500;
    cursor: pointer; text-decoration: none;
    transition: background .2s, border-color .2s, color .2s, transform .2s;
  }
  .fp-prop-back:hover { background: rgba(240,235,255,0.12); border-color: rgba(196,163,90,0.35); color: #f0d080; transform: translateX(-3px); }

  /* gallery nav */
  .fp-nav-btn {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(14,4,32,0.65); backdrop-filter: blur(10px);
    border: 1px solid rgba(196,163,90,0.30);
    display: flex; align-items: center; justify-content: center;
    color: #f0ebff; cursor: pointer;
    transition: background .2s, border-color .2s, transform .2s;
  }
  .fp-nav-btn:hover { background: rgba(196,163,90,0.18); border-color: rgba(196,163,90,0.65); transform: scale(1.08); }

  /* dot pill */
  .fp-dot { cursor: pointer; border-radius: 100px; transition: all .3s; }

  /* amenity pill */
  .fp-amenity {
    display: flex; align-items: center; gap: 9px;
    padding: 10px 18px; border-radius: 14px;
    background: rgba(196,163,90,0.07);
    border: 1px solid rgba(196,163,90,0.22);
    color: rgba(240,235,255,0.72); font-size: 13px; font-family: 'DM Sans',sans-serif;
    transition: background .2s, border-color .2s;
  }
  .fp-amenity:hover { background: rgba(196,163,90,0.13); border-color: rgba(196,163,90,0.42); }

  /* highlight card */
  .fp-hl {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 16px 18px; border-radius: 16px;
    background: rgba(196,163,90,0.06);
    border: 1px solid rgba(196,163,90,0.18);
    transition: background .2s, border-color .2s;
  }
  .fp-hl:hover { background: rgba(196,163,90,0.10); border-color: rgba(196,163,90,0.35); }

  /* booking card */
  .fp-booking {
    background: #1a0838;
    border: 1px solid rgba(196,163,90,0.28);
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 24px 80px rgba(10,2,30,0.60);
  }
  .fp-booking-header { background: linear-gradient(135deg, #241050, #1a0838); padding: 24px; border-bottom: 1px solid rgba(196,163,90,0.16); }

  /* counter btn */
  .fp-counter-btn {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    border: 1px solid rgba(196,163,90,0.30);
    background: rgba(196,163,90,0.08);
    display: flex; align-items: center; justify-content: center;
    color: #c4a35a; cursor: pointer; font-size: 16px; font-weight: 600;
    transition: background .2s, border-color .2s, transform .2s;
  }
  .fp-counter-btn:hover { background: rgba(196,163,90,0.18); border-color: rgba(196,163,90,0.55); transform: scale(1.08); }

  /* CTA buttons */
  .fp-wa-cta {
    width: 100%; padding: 15px; border-radius: 14px;
    background: #25D366; border: none; cursor: pointer; color: white;
    font-family: 'DM Sans',sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 0.04em;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(37,211,102,0.30);
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .fp-wa-cta:hover { background: #1ebe5c; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(37,211,102,0.38); }

  .fp-call-cta {
    width: 100%; padding: 15px; border-radius: 14px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border: none; cursor: pointer; color: white;
    font-family: 'DM Sans',sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 0.04em;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(124,58,237,0.35);
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .fp-call-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.45); }

  /* share / heart */
  .fp-icon-btn {
    width: 42px; height: 42px; border-radius: 50%;
    background: rgba(14,4,32,0.65); backdrop-filter: blur(10px);
    border: 1px solid rgba(196,163,90,0.28);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #f0ebff;
    transition: background .2s, border-color .2s, transform .2s;
  }
  .fp-icon-btn:hover { background: rgba(196,163,90,0.15); border-color: rgba(196,163,90,0.55); transform: scale(1.08); }

  /* truststrip */
  .fp-trust { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: 'DM Sans',sans-serif; color: rgba(196,163,90,0.70); }

  /* not-included X */
  .fp-x { color: rgba(240,100,100,0.55); font-size: 11px; flex-shrink: 0; margin-top: 1px; }

  /* cancellation box */
  .fp-cancel-box {
    background: rgba(196,163,90,0.06);
    border: 1px solid rgba(196,163,90,0.22);
    border-radius: 18px; padding: 20px 22px;
  }

  @keyframes fp-spin { to { transform: rotate(360deg) } }
  .fp-spin { animation: fp-spin .9s linear infinite; }
  @keyframes fp-fadeup {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fu { animation: fp-fadeup .5s cubic-bezier(.22,.68,0,1.2) both; }
  .fu1 { animation-delay: .05s; }
  .fu2 { animation-delay: .12s; }
  .fu3 { animation-delay: .20s; }
  .fu4 { animation-delay: .28s; }

  @media (max-width: 1024px) {
    .fp-layout { flex-direction: column !important; }
    .fp-sidebar { width: 100% !important; }
  }
  @media (max-width: 640px) {
    .fp-gallery { height: 55vw !important; min-height: 240px !important; }
    .fp-hl-grid { grid-template-columns: 1fr !important; }
  }
`

// ── Loading / Not found ───────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0e0420', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div className="fp-spin" style={{ width: 32, height: 32, border: '1.5px solid rgba(196,163,90,0.18)', borderTop: '1.5px solid #c4a35a', borderRadius: '50%' }} />
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(196,163,90,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 }}>
        Preparing your stay…
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FlagshipPropertyPage() {
  useFont()
  const { slug } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIndex, setImgIndex] = useState(0)
  const [wishlist, setWishlist] = useState(false)
  const [guests, setGuests] = useState(2)
  const [nights, setNights] = useState(2)

  useEffect(() => {
    window.scrollTo(0, 0)
    // Try live DB first; fall back to dummy
    // Replace this block with your supabase call if needed:
    // supabase.from('Itineraries').select('*').eq('slug', slug)...
    setTimeout(() => {
      setProperty(DUMMY_MAP[slug] || null)
      setLoading(false)
    }, 400)
  }, [slug])

  if (loading) return <><style>{CSS}</style><LoadingScreen /></>

  if (!property) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100vh', background: '#0e0420', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <p style={{ fontSize: 48, margin: 0 }}>🏡</p>
        <h2 className="fp-serif" style={{ fontSize: 32, color: C.ivory, margin: 0 }}>Property not found</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ivoryFaint, marginBottom: 24 }}>This listing may have moved or been removed.</p>
        <Link to="/stays/flagship" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 14,
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white',
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>← Back to Flagship Collection</Link>
      </div>
    </>
  )

  const images = property.image?.length ? property.image : ['https://images.unsplash.com/photo-1549366021-9f761d450615?w=1200&q=85']
  const totalPrice = Number(property.price_per_person || 0) * guests * nights

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi! I'm interested in booking ${property.title} in ${property.location}.\n\nGuests: ${guests}\nNights: ${nights}\nTotal estimate: ₹${totalPrice.toLocaleString('en-IN')}\n\nPlease share availability and confirm the booking.`)
    window.open(`https://wa.me/+919752377323?text=${msg}`, '_blank')
  }
  const handleCall = () => window.open('tel:+919752377323', '_self')

  return (
    <>
      <style>{CSS}</style>
      <div className="fp-prop">
        {/* Replace with <Navbar /> */}

        {/* ── Hero Gallery ── */}
        <div className="fp-gallery" style={{ position: 'relative', width: '100%', height: '62vh', minHeight: 320, maxHeight: 620, overflow: 'hidden', background: '#08020f' }}>

          {/* Image */}
          <img
            key={imgIndex}
            src={images[imgIndex]}
            alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.80, transition: 'opacity .45s' }}
            onError={e => { e.currentTarget.style.opacity = '0' }}
          />

          {/* Overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,4,32,0.22) 0%, rgba(14,4,32,0.10) 35%, rgba(10,2,20,0.70) 72%, rgba(8,2,16,0.97) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />

          {/* Gold shimmer top */}
          <div className="fp-shimmer" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />

          {/* Nav arrows */}
          {images.length > 1 && <>
            <button className="fp-nav-btn" onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
              <ChevronLeft style={{ width: 18, height: 18 }} />
            </button>
            <button className="fp-nav-btn" onClick={() => setImgIndex(i => (i + 1) % images.length)}
              style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
              <ChevronRight style={{ width: 18, height: 18 }} />
            </button>
            <div style={{ position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
              {images.map((_, i) => (
                <button key={i} className="fp-dot" onClick={() => setImgIndex(i)}
                  style={{ width: i === imgIndex ? 20 : 6, height: 6, background: i === imgIndex ? C.goldLight : 'rgba(240,208,128,0.35)', border: 'none', padding: 0 }} />
              ))}
            </div>
          </>}

          {/* Top bar */}
          <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <button className="fp-prop-back" onClick={() => navigate(-1)}>
              <ArrowLeft style={{ width: 15, height: 15 }} /> Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="fp-icon-btn"
                onClick={() => navigator.share?.({ title: property.title, url: window.location.href })}>
                <Share2 style={{ width: 16, height: 16 }} />
              </button>
              <button className="fp-icon-btn"
                onClick={() => setWishlist(w => !w)}
                style={wishlist ? { background: '#e11d48', borderColor: '#e11d48' } : {}}>
                <Heart style={{ width: 16, height: 16, fill: wishlist ? 'white' : 'none' }} />
              </button>
            </div>
          </div>

          {/* Bottom overlay — title preview */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 32px 28px', zIndex: 10 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                padding: '5px 14px', borderRadius: 100,
                border: `1px solid ${C.borderGoldHi}`, background: 'rgba(196,163,90,0.15)',
                color: C.goldLight, backdropFilter: 'blur(8px)',
              }}>✦ Flagship</span>
              {property.tag && (
                <span style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 500,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '5px 12px', borderRadius: 100,
                  border: `1px solid rgba(240,235,255,0.22)`, background: 'rgba(240,235,255,0.10)',
                  color: 'rgba(240,235,255,0.82)', backdropFilter: 'blur(8px)',
                }}>{property.tag}</span>
              )}
            </div>
            <h1 className="fp-serif" style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 600, color: C.ivory, margin: 0, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
              {property.title}
            </h1>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 80px' }}>
          <div className="fp-layout" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>

            {/* ── Left: Content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Meta row */}
              <div className="fu fu1" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', marginBottom: 28 }}>
                {property.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin style={{ width: 14, height: 14, color: C.gold }} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryDim }}>{property.location}</span>
                  </div>
                )}
                {property.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Star style={{ width: 14, height: 14, color: C.goldLight, fill: C.goldLight }} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: C.goldLight }}>{Number(property.rating).toFixed(1)}</span>
                    {property.review_count && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ivoryFaint }}>({property.review_count} reviews)</span>}
                  </div>
                )}
                {(property.duration_display || property.duration) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock style={{ width: 14, height: 14, color: C.gold }} />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryDim }}>{property.duration_display || property.duration}</span>
                  </div>
                )}
              </div>

              <div className="fp-divider fu fu1" style={{ marginBottom: 36 }} />

              {/* Description */}
              {(property.description || property.blurb) && (
                <div className="fu fu2" style={{ marginBottom: 44 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <Sparkles style={{ width: 16, height: 16, color: C.gold }} />
                    <h2 className="fp-serif" style={{ fontSize: 26, fontWeight: 600, color: C.ivory, margin: 0 }}>About this property</h2>
                  </div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, lineHeight: 2.0, color: C.ivoryDim, whiteSpace: 'pre-line' }}>
                    {property.description || property.blurb}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {property.highlights?.length > 0 && (
                <div className="fu fu2" style={{ marginBottom: 44 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Crown style={{ width: 16, height: 16, color: C.gold }} />
                    <h2 className="fp-serif" style={{ fontSize: 26, fontWeight: 600, color: C.ivory, margin: 0 }}>Highlights</h2>
                  </div>
                  <div className="fp-hl-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {property.highlights.map(h => (
                      <div key={h} className="fp-hl">
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #c4a35a, #f0d080)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                        }}>
                          <Check style={{ width: 12, height: 12, color: '#0e0420' }} />
                        </div>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryDim, lineHeight: 1.55 }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div className="fu fu3" style={{ marginBottom: 44 }}>
                  <h2 className="fp-serif" style={{ fontSize: 26, fontWeight: 600, color: C.ivory, margin: '0 0 20px' }}>What's available</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {property.amenities.map(a => {
                      const Icon = AMENITY_ICONS[a] || Shield
                      return (
                        <span key={a} className="fp-amenity">
                          <Icon style={{ width: 15, height: 15, color: C.gold, flexShrink: 0 }} />
                          {a}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Included / Not included */}
              {(property.what_included?.length > 0 || property.what_not_included?.length > 0) && (
                <div className="fu fu3" style={{ marginBottom: 44 }}>
                  <div className="fp-ornrow"><div className="fp-ornrow-line" /><div className="fp-ornrow-dot" /><div className="fp-ornrow-line" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
                    {property.what_included?.length > 0 && (
                      <div>
                        <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(74,222,128,0.75)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Check style={{ width: 13, height: 13 }} /> Included
                        </h3>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                          {property.what_included.map(i => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryDim, lineHeight: 1.5 }}>
                              <Check style={{ width: 13, height: 13, color: 'rgba(74,222,128,0.65)', flexShrink: 0, marginTop: 2 }} />{i}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {property.what_not_included?.length > 0 && (
                      <div>
                        <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.65)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span>✕</span> Not included
                        </h3>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                          {property.what_not_included.map(i => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryFaint, lineHeight: 1.5 }}>
                              <span className="fp-x">✕</span>{i}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation */}
              {property.cancellation && (
                <div className="fp-cancel-box fu fu4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Calendar style={{ width: 15, height: 15, color: C.gold }} />
                    <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: 0 }}>
                      Cancellation Policy
                    </h3>
                  </div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryDim, lineHeight: 1.75, margin: 0 }}>
                    {property.cancellation}
                  </p>
                </div>
              )}

            </div>

            {/* ── Right: Booking Sidebar ── */}
            <div className="fp-sidebar fu fu2" style={{ width: 380, flexShrink: 0, position: 'sticky', top: 24 }}>

              <div className="fp-booking">
                {/* Gold shimmer top */}
                <div className="fp-shimmer" />

                {/* Header */}
                <div className="fp-booking-header">
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, margin: '0 0 6px' }}>
                        Starting from
                      </p>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                        <span className="fp-serif" style={{ fontSize: 40, fontWeight: 600, color: C.goldLight, lineHeight: 1 }}>
                          ₹{Number(property.price_per_person || 0).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ivoryFaint, marginBottom: 4 }}>/ night</span>
                      </div>
                    </div>
                    {property.rating > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <Star style={{ width: 13, height: 13, color: C.goldLight, fill: C.goldLight }} />
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600, color: C.goldLight }}>{Number(property.rating).toFixed(1)}</span>
                        </div>
                        {property.review_count && (
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.ivoryFaint }}>{property.review_count} reviews</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>

                  {/* Counters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 22 }}>
                    {[
                      { label: 'Guests', sub: 'Number of people', val: guests, set: setGuests, max: 20 },
                      { label: 'Nights', sub: 'Duration of stay',  val: nights, set: setNights, max: 30 },
                    ].map(({ label, sub, val, set, max }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, background: 'rgba(196,163,90,0.06)', border: `1px solid rgba(196,163,90,0.16)` }}>
                        <div>
                          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: C.ivory, margin: 0 }}>{label}</p>
                          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.ivoryFaint, margin: 0 }}>{sub}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button className="fp-counter-btn" onClick={() => set(v => Math.max(1, v - 1))}>−</button>
                          <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 20, fontWeight: 600, color: C.goldLight, minWidth: 20, textAlign: 'center' }}>{val}</span>
                          <button className="fp-counter-btn" onClick={() => set(v => Math.min(max, v + 1))}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(196,163,90,0.08)', border: `1px solid rgba(196,163,90,0.22)`, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ivoryFaint }}>
                        ₹{Number(property.price_per_person || 0).toLocaleString('en-IN')} × {guests} guest{guests > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
                      </span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ivoryDim }}>₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ height: 1, background: 'rgba(196,163,90,0.20)', marginBottom: 8 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: C.ivory }}>Total estimate</span>
                      <span className="fp-serif" style={{ fontSize: 20, fontWeight: 600, color: C.goldLight }}>₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="fp-wa-cta" onClick={handleWhatsApp}>
                      <MessageCircle style={{ width: 18, height: 18 }} />
                      Book via WhatsApp
                    </button>
                    <button className="fp-call-cta" onClick={handleCall}>
                      <Phone style={{ width: 18, height: 18 }} />
                      Call to enquire
                    </button>
                    <p style={{ textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.ivoryFaint, margin: '4px 0 0' }}>
                      No payment collected here · We confirm availability first
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust strip */}
              <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 18px' }}>
                {['Free cancellation*', 'Hoppity vetted', 'Instant response'].map(t => (
                  <span key={t} className="fp-trust">
                    <Check style={{ width: 11, height: 11, color: C.gold }} />{t}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}