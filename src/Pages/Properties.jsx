import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight, Star, MapPin, Wifi, Coffee, Wind, Waves, Mountain, TreePine, ChevronRight } from "lucide-react"
import Navbar from "../components/Navbar"
import { supabase } from "../lib/supabase"
import { setPageSEO } from "../lib/seo"

/* ── Google Fonts ───────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("ss-fonts")) {
  const l = document.createElement("link")
  l.id = "ss-fonts"
  l.rel = "stylesheet"
  l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
  document.head.appendChild(l)
}

/* ── CSS ────────────────────────────────────────────────────── */
const CSS = `
.ss { --gold:#C9A96E; --gold-l:#E8D5A3; --gold-d:#8B7041; --ob:#0A0A0F; --ob2:#111118; --ob3:#18181F; --ob4:#22222C; --tx:#F0EDE6; --tx-m:#9A9080; --tx-d:#5A5448; --br:rgba(201,169,110,.15); --br-h:rgba(201,169,110,.35); }
.ss *{box-sizing:border-box;margin:0;padding:0;}
.ss{background:var(--ob);color:var(--tx);font-family:'DM Sans',sans-serif;min-height:100vh;}
.ss a{text-decoration:none;color:inherit;}
.serif{font-family:'Cormorant Garamond',serif;}
.noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:256px;}
.rule{height:1px;background:var(--br);}
.rule-g{height:1px;background:linear-gradient(90deg,transparent,var(--gold-d),transparent);}

@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes skPulse{0%{background-position:200%}100%{background-position:-200%}}
.fu{animation:fadeUp .9s cubic-bezier(.16,1,.3,1) both;}
.d1{animation-delay:.12s}.d2{animation-delay:.24s}.d3{animation-delay:.36s}.d4{animation-delay:.48s}

.dot{width:6px;height:6px;border-radius:50%;background:var(--gold);display:inline-block;animation:shimmer 2.5s infinite;}
.badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.25);border-radius:2px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);}
.pill{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border:1px solid var(--br);border-radius:100px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx-m);}

.fbtn{background:transparent;border:1px solid var(--br);color:var(--tx-m);padding:8px 22px;border-radius:100px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:400;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:all .2s;white-space:nowrap;}
.fbtn:hover{border-color:var(--br-h);color:var(--gold-l);}
.fbtn.on{background:var(--gold);border-color:var(--gold);color:var(--ob);font-weight:500;}

.card{background:var(--ob2);border:1px solid var(--br);border-radius:3px;overflow:hidden;transition:all .45s cubic-bezier(.16,1,.3,1);cursor:pointer;display:flex;flex-direction:column;}
.card:hover{border-color:var(--br-h);transform:translateY(-7px);box-shadow:0 40px 80px rgba(0,0,0,.65),0 0 0 1px rgba(201,169,110,.1);}
.card:hover .cimg{transform:scale(1.06);}
.cimg{transition:transform .9s cubic-bezier(.16,1,.3,1);}
.featured{grid-column:span 2;}
@media(max-width:860px){.featured{grid-column:span 1;}}

.sk{background:linear-gradient(90deg,var(--ob3) 25%,var(--ob4) 50%,var(--ob3) 75%);background-size:200%;animation:skPulse 1.8s infinite;border-radius:2px;}

.pbtn{display:inline-flex;align-items:center;gap:8px;background:var(--gold);color:var(--ob);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:14px 32px;border-radius:2px;border:none;cursor:pointer;transition:all .2s;}
.pbtn:hover{background:var(--gold-l);transform:translateY(-2px);}
.gbtn{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--tx);font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding:13px 32px;border-radius:2px;border:1px solid var(--br);cursor:pointer;transition:all .2s;}
.gbtn:hover{border-color:var(--br-h);color:var(--gold-l);transform:translateY(-2px);}

.arrow-btn{width:38px;height:38px;border:1px solid var(--br);border-radius:2px;display:flex;align-items:center;justify-content:center;color:var(--gold-d);transition:all .2s;cursor:pointer;flex-shrink:0;}
.arrow-btn:hover{border-color:var(--gold);color:var(--gold);}

.scroll-h{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
.scroll-h::-webkit-scrollbar{display:none;}
`

/* ── Data ───────────────────────────────────────────────────── */
const AMENITY_ICONS = { WiFi: Wifi, Breakfast: Coffee, AC: Wind, Pool: Waves, "Mountain View": Mountain, Nature: TreePine }
const STAY_TYPES = [
  { id: "All", label: "All Stays" },
  { id: "Heritage", label: "Heritage" },
  { id: "Wilderness", label: "Wilderness" },
  { id: "Hilltop", label: "Hilltop" },
  { id: "Lakeside", label: "Lakeside" },
  { id: "Desert", label: "Desert" },
  { id: "Coastal", label: "Coastal" },
]
const FALLBACK = [
  { id:1, name:"Banjaar Tola", location:"Kanha, Madhya Pradesh", type:"Wilderness", tagline:"Sleep where tigers roam at dawn", price_per_night:42000, rating:4.9, review_count:84, amenities:["Breakfast","Pool","Nature","WiFi"], cover_image_url:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=85", badge:"Editor's Pick" },
  { id:2, name:"Samode Palace", location:"Samode, Rajasthan", type:"Heritage", tagline:"A 475-year-old palace, entirely yours", price_per_night:38000, rating:4.8, review_count:127, amenities:["Breakfast","Pool","AC","WiFi"], cover_image_url:"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=85", badge:"Heritage Icon" },
  { id:3, name:"Shakti 360° Leti", location:"Kumaon Himalaya, Uttarakhand", type:"Hilltop", tagline:"12 rooms. No roads. Just the Himalayas.", price_per_night:65000, rating:5.0, review_count:42, amenities:["Breakfast","Mountain View","Nature"], cover_image_url:"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=85", badge:"Most Exclusive" },
  { id:4, name:"Suján Jawai", location:"Jawai, Rajasthan", type:"Wilderness", tagline:"Leopards, lakes & lantern-lit dinners", price_per_night:55000, rating:4.9, review_count:61, amenities:["Breakfast","Pool","Nature","WiFi"], cover_image_url:"https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&q=85", badge:null },
  { id:5, name:"The Windermere Estate", location:"Munnar, Kerala", type:"Hilltop", tagline:"Misty tea gardens wrapped around you", price_per_night:18500, rating:4.7, review_count:203, amenities:["Breakfast","Nature","WiFi"], cover_image_url:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85", badge:null },
  { id:6, name:"Neemrana Fort Palace", location:"Neemrana, Rajasthan", type:"Heritage", tagline:"600 years of history. Zero pretence.", price_per_night:14000, rating:4.6, review_count:318, amenities:["Breakfast","Pool","AC","WiFi"], cover_image_url:"https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=85", badge:null },
]

/* ── Skeleton ───────────────────────────────────────────────── */
function Skel({ featured }) {
  return (
    <div className={`card${featured ? " featured" : ""}`}>
      <div className="sk" style={{ height: featured ? 480 : 320 }} />
      <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="sk" style={{ height: 9, width: "35%" }} />
        <div className="sk" style={{ height: 20, width: "60%" }} />
        <div className="sk" style={{ height: 9, width: "45%" }} />
      </div>
    </div>
  )
}

/* ── Stay Card ──────────────────────────────────────────────── */
function Card({ stay, featured, idx }) {
  const [loaded, setLoaded] = useState(false)
  const price = stay.price_per_night
    ? `₹${Number(stay.price_per_night).toLocaleString("en-IN")}`
    : "On Request"

  return (
    <div className={`card fu d${Math.min(idx + 1, 4)}${featured ? " featured" : ""}`}>
      {/* Image area */}
      <div style={{ position: "relative", height: featured ? 480 : 320, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "var(--ob3)" }} />
        {stay.cover_image_url && (
          <img
            src={stay.cover_image_url} alt={stay.name}
            loading="eager" decoding="async"
            className="cimg"
            onLoad={() => setLoaded(true)}
            onError={e => { e.currentTarget.style.display = "none" }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .6s" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,10,.97) 0%, rgba(5,5,10,.35) 55%, rgba(5,5,10,.08) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 10%, rgba(201,169,110,.05) 0%, transparent 55%)" }} />

        {stay.badge && (
          <div style={{ position: "absolute", top: 20, left: 20 }}>
            <span className="badge"><span className="dot" />{stay.badge}</span>
          </div>
        )}
        {stay.rating > 0 && (
          <div style={{ position: "absolute", top: 20, right: 20, display: "flex", alignItems: "center", gap: 5, background: "rgba(10,10,15,.75)", backdropFilter: "blur(8px)", border: "1px solid var(--br)", borderRadius: 2, padding: "5px 11px" }}>
            <Star size={11} style={{ color: "#C9A96E", fill: "#C9A96E" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#E8D5A3" }}>{Number(stay.rating).toFixed(1)}</span>
            {stay.review_count > 0 && <span style={{ fontSize: 11, color: "var(--tx-d)" }}>({stay.review_count})</span>}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 28px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold)", fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 8 }}>
            <MapPin size={10} />{stay.location}
          </div>
          <h3 className="serif" style={{ fontSize: featured ? 40 : 24, fontWeight: 300, color: "var(--tx)", lineHeight: 1.05, marginBottom: 8, letterSpacing: "-.01em" }}>
            {stay.name}
          </h3>
          {stay.tagline && (
            <p className="serif" style={{ fontSize: 14, color: "rgba(240,237,230,.45)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}>
              {stay.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--br)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(stay.amenities || []).slice(0, featured ? 5 : 3).map(a => {
            const Icon = AMENITY_ICONS[a]
            return (
              <span key={a} className="pill">
                {Icon && <Icon size={9} style={{ color: "var(--gold-d)" }} />}{a}
              </span>
            )
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, marginLeft: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--tx-d)", marginBottom: 2 }}>From</div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 400, color: "var(--gold)", lineHeight: 1 }}>{price}</div>
            <div style={{ fontSize: 9, color: "var(--tx-d)", letterSpacing: ".08em" }}>per night</div>
          </div>
          <div className="arrow-btn"><ArrowRight size={14} /></div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function SignatureStays() {
  const [stays, setStays] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState("All")

  useEffect(() => {
    setPageSEO({
      title: "Signature Stays – India's Most Extraordinary Properties",
      description: "Hoppity's curated edit of India's most exceptional stays — heritage palaces, wilderness camps, hilltop hideaways and coastal retreats.",
      canonical: "/stays",
    })
    const cached = sessionStorage.getItem("ss_v3")
    if (cached) { try { setStays(JSON.parse(cached)); setLoading(false) } catch (_) {} }
    supabase.from("Signature_Stays")
      .select("id,name,location,state,type,tagline,price_per_night,rating,review_count,amenities,cover_image_url,badge,slug,is_active")
      .eq("is_active", true).order("id", { ascending: true })
      .then(({ data, error }) => {
        const d = (!error && data?.length > 0) ? data : FALLBACK
        sessionStorage.setItem("ss_v3", JSON.stringify(d))
        setStays(d); setLoading(false)
      })
      .catch(() => { setStays(FALLBACK); setLoading(false) })
  }, [])

  const filtered = activeType === "All" ? stays : stays.filter(s => s.type === activeType)

  return (
    <>
      <style>{CSS}</style>
      <div className="ss">
        <div className="noise" aria-hidden="true" />

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
          {/* BG image */}
          <div style={{ position: "absolute", inset: 0 }}>
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85" alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .32 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(10,10,15,.2) 0%, rgba(10,10,15,.65) 45%, rgba(10,10,15,1) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 20%, rgba(201,169,110,.04) 0%, transparent 65%)" }} />
          </div>

          {/* Top nav bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10, borderBottom: "1px solid rgba(201,169,110,.08)" }}>
            <Link to="/">
              <button style={{ width: 40, height: 40, border: "1px solid var(--br)", borderRadius: 2, background: "transparent", color: "var(--tx-m)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--br)"; e.currentTarget.style.color = "var(--tx-m)" }}>
                <ArrowLeft size={15} />
              </button>
            </Link>
            <div style={{ fontSize: 10, letterSpacing: ".35em", textTransform: "uppercase", color: "var(--gold)", opacity: .75 }}>
              Hoppity · Signature Collection
            </div>
            <Link to="/itineraries"
              style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--tx-d)", display: "flex", alignItems: "center", gap: 5, transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--tx-d)"}>
              Itineraries <ChevronRight size={12} />
            </Link>
          </div>

          {/* Hero text */}
          <div style={{ position: "relative", zIndex: 5, padding: "0 48px 90px", maxWidth: 920 }}>
            <div className="fu" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <span className="dot" />
              <span style={{ fontSize: 10, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--gold-l)" }}>47 Curated Properties · Across India</span>
            </div>

            <h1 className="serif fu d1" style={{ fontSize: "clamp(56px, 8.5vw, 108px)", fontWeight: 300, lineHeight: .95, letterSpacing: "-.02em", marginBottom: 28, color: "var(--tx)" }}>
              Where you stay<br />
              <em style={{ color: "var(--gold)", fontStyle: "italic" }}>is the story.</em>
            </h1>

            <div className="rule-g fu d2" style={{ width: 72, marginBottom: 28 }} />

            <p className="fu d2" style={{ fontSize: 16, color: "rgba(240,237,230,.5)", maxWidth: 500, lineHeight: 1.85, fontWeight: 300, marginBottom: 48 }}>
              Not hotels. Not resorts. These are places travel writers keep off the record — each one chosen by hand, never algorithm.
            </p>

            {/* Stats */}
            <div className="fu d3" style={{ display: "flex", alignItems: "center", gap: 36 }}>
              {[["47", "Properties"], ["4.9★", "Avg Rating"], ["6", "Categories"]].map(([n, l], i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 36 }}>
                  <div>
                    <div className="serif" style={{ fontSize: 30, fontWeight: 400, color: "var(--gold)", lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--tx-d)", marginTop: 5 }}>{l}</div>
                  </div>
                  {i < 2 && <div style={{ width: 1, height: 42, background: "var(--br)" }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position: "absolute", bottom: 28, right: 48, display: "flex", alignItems: "center", gap: 10, zIndex: 5 }}>
            <span style={{ fontSize: 9, letterSpacing: ".25em", textTransform: "uppercase", color: "var(--tx-d)" }}>Scroll</span>
            <div style={{ width: 28, height: 1, background: "var(--gold-d)" }} />
          </div>
        </section>

        {/* ── FILTER STRIP ──────────────────────────────────────── */}
        <div style={{ background: "var(--ob2)", borderTop: "1px solid var(--br)", borderBottom: "1px solid var(--br)", position: "sticky", top: 0, zIndex: 40 }}>
          <div className="scroll-h" style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 48px", display: "flex", alignItems: "center", gap: 8 }}>
            {STAY_TYPES.map(t => (
              <button key={t.id} className={`fbtn${activeType === t.id ? " on" : ""}`} onClick={() => setActiveType(t.id)}>
                {t.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", flexShrink: 0, paddingRight: 2, fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--tx-d)" }}>
              {filtered.length} {filtered.length === 1 ? "stay" : "stays"}
            </div>
          </div>
        </div>

        {/* ── GRID ──────────────────────────────────────────────── */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 48px 80px" }}>
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
            <span style={{ fontSize: 10, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--gold)", flexShrink: 0 }}>
              {activeType === "All" ? "The Full Collection" : activeType}
            </span>
            <div className="rule" style={{ flex: 1 }} />
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skel key={i} featured={i === 0} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "100px 0", textAlign: "center" }}>
              <p className="serif" style={{ fontSize: 38, fontWeight: 300, color: "var(--tx-m)", marginBottom: 12 }}>No {activeType} stays yet</p>
              <p style={{ fontSize: 13, color: "var(--tx-d)", marginBottom: 28 }}>We're sourcing the finest ones.</p>
              <button className="gbtn" onClick={() => setActiveType("All")}>View all stays</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {filtered.map((stay, idx) => (
                <Card key={stay.id} stay={stay} featured={idx === 0 && activeType === "All"} idx={idx} />
              ))}
            </div>
          )}
        </section>

        {/* ── BESPOKE CTA ───────────────────────────────────────── */}
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px 100px" }}>
          <div style={{ position: "relative", border: "1px solid var(--br)", padding: "72px 80px", overflow: "hidden" }}>
            {/* Corner ornaments */}
            {[{ top: -1, left: -1 }, { top: -1, right: -1 }, { bottom: -1, left: -1 }, { bottom: -1, right: -1 }].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", width: 18, height: 18,
                borderTop: pos.top !== undefined ? "2px solid var(--gold)" : "none",
                borderBottom: pos.bottom !== undefined ? "2px solid var(--gold)" : "none",
                borderLeft: pos.left !== undefined ? "2px solid var(--gold)" : "none",
                borderRight: pos.right !== undefined ? "2px solid var(--gold)" : "none",
                ...pos
              }} />
            ))}

            <div style={{ position: "relative", maxWidth: 540 }}>
              <span style={{ fontSize: 10, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 20 }}>Bespoke Travel</span>
              <h2 className="serif" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 300, lineHeight: 1.05, color: "var(--tx)", marginBottom: 18, letterSpacing: "-.01em" }}>
                Can't find what<br />
                <em style={{ color: "var(--gold)", fontStyle: "italic" }}>you're imagining?</em>
              </h2>
              <div className="rule-g" style={{ width: 60, marginBottom: 20 }} />
              <p style={{ fontSize: 15, color: "var(--tx-m)", lineHeight: 1.85, fontWeight: 300, marginBottom: 36 }}>
                Our travel designers hold access to private properties, closed-door experiences and stays that never surface online. Tell us your vision.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/contact"><button className="pbtn">Plan with us <ArrowRight size={13} /></button></Link>
                <a href="https://wa.me/919752377323" target="_blank" rel="noopener noreferrer">
                  <button className="gbtn">WhatsApp us</button>
                </a>
              </div>
            </div>

            {/* Decorative large number */}
            <div className="serif" style={{ position: "absolute", right: 72, top: "50%", transform: "translateY(-50%)", fontSize: 180, fontWeight: 300, color: "rgba(201,169,110,.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
              47
            </div>
          </div>
        </section>

        {/* ── FOOTER LINE ───────────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--br)" }}>
          <span style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--tx-d)" }}>Hoppity · Signature Collection</span>
          <Link to="/itineraries"
            style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--tx-d)", display: "flex", alignItems: "center", gap: 6, transition: "color .2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--tx-d)"}>
            <ArrowLeft size={11} /> All Itineraries
          </Link>
        </div>
      </div>
    </>
  )
}