import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef, useMemo } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Search,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  Wallet,
  Minus,
  Plus,
  PawPrint,
  Building2,
  ChevronDown,
} from "lucide-react"
import { supabase } from "../lib/supabase"
import Navbar from "../components/Navbar"
import { setPageSEO } from "../lib/seo"

/* ─────────────────────────────────────────────────────────────
   Where the search bar sends the user. Consumed by a results
   page that reads these query params:
   q, property, checkin, checkout, nights, rooms, guests,
   adults, children, pet, min, max.
   Change this one constant if you route search elsewhere.
   ───────────────────────────────────────────────────────────── */
const SEARCH_ROUTE = "/stays/search"

/* Price-per-night ranges (₹). min inclusive, max exclusive; null = open end. */
const PRICE_RANGES = [
  { short: "Any", label: "Any budget", min: null, max: null },
  { short: "₹0–1,500", label: "₹0 – ₹1,500", min: 0, max: 1500 },
  { short: "₹1,500–2,500", label: "₹1,500 – ₹2,500", min: 1500, max: 2500 },
  { short: "₹2,500–5,000", label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { short: "₹5,000+", label: "₹5,000 & above", min: 5000, max: null },
]

/* Built-in destination list — major Indian cities + popular offbeat/travel towns.
   Property names come live from the DB; these cover locations. */
const INDIA_CITIES = [
  "Mumbai","Delhi","Bengaluru","Chennai","Kolkata","Hyderabad","Pune","Ahmedabad","Jaipur","Lucknow",
  "Bhopal","Indore","Nagpur","Chandigarh","Guwahati","Kochi","Thiruvananthapuram","Visakhapatnam","Coimbatore",
  "Madurai","Mysuru","Nashik","Vadodara","Bhubaneswar","Dehradun","Amritsar","Jodhpur","Udaipur","Agra",
  "Varanasi","Prayagraj","Gwalior","Jabalpur","Jammu","Srinagar","Ranchi","Raipur","Patna","Surat",
  "Manali","Shimla","Kasol","Kasauli","Dharamshala","McLeodganj","Dalhousie","Khajjiar","Bir Billing","Tirthan Valley",
  "Jibhi","Tosh","Malana","Spiti","Kaza","Leh","Ladakh","Nubra Valley","Pangong","Mussoorie",
  "Nainital","Ranikhet","Almora","Kausani","Auli","Rishikesh","Haridwar","Chopta","Munsiyari","Lansdowne",
  "Kanatal","Chakrata","Darjeeling","Gangtok","Pelling","Lachung","Tawang","Shillong","Cherrapunji","Mawlynnong",
  "Ziro","Kohima","Goa","Panaji","Gokarna","Hampi","Madikeri","Coorg","Chikmagalur","Wayanad",
  "Munnar","Alleppey","Kumarakom","Kovalam","Varkala","Ooty","Kodaikanal","Coonoor","Pondicherry","Mahabalipuram",
  "Pushkar","Mount Abu","Jaisalmer","Bikaner","Ranthambore","Kumbhalgarh","Chittorgarh","Bundi","Gulmarg","Sonmarg",
  "Pahalgam","Khajuraho","Orchha","Mandu","Pachmarhi","Kanha","Bandhavgarh","Pench","Bhuj","Rann of Kutch",
  "Dwarka","Somnath","Diu","Daman","Lonavala","Mahabaleshwar","Matheran","Panchgani","Igatpuri","Saputara",
  "Andaman","Havelock","Port Blair","Araku Valley","Tirupati","Rameswaram","Kanyakumari",
]

/* ─────────────────────────────────────────────────────────────
   STAY CATEGORIES
   Each card routes to /stays/<slug> — the existing
   BudgetStaysPage / SignatureStaysPage / FlagshipStaysPage.
   ───────────────────────────────────────────────────────────── */
const STAY_CATEGORIES = [
  {
    slug: "budget",
    label: "Affordable",
    title: "Budget stays",
    desc: "Honest, clean, and wallet-friendly — hostels, guesthouses, and homestays that don't cut corners.",
    count: "",
    icon: "🎒",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    flagship: false,
  },
  {
    slug: "signature",
    label: "Boutique",
    title: "Signature stays",
    desc: "Handpicked properties with soul — treehouses, heritage havelis, hilltop cottages.",
    count: "",
    icon: "🏡",
    image: "https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800&q=80",
    flagship: false,
  },
  {
    slug: "flagship",
    label: "FLAGSHIP",
    title: "Flagship properties",
    desc: "Our most iconic stays — personally walked through, slept in, and stood behind completely.",
    count: "",
    icon: "✦",
    image: "https://images.unsplash.com/photo-1587922546307-776227941871?w=800&q=85",
    flagship: true,
    perks: [
      "Personally vetted by the Hoppity team",
      "Exclusive experiences not listed elsewhere",
    ],
  },
]

/* Local date helper — YYYY-MM-DD without UTC drift. */
function toISODate(d) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

/* Pretty short date, e.g. "10 Aug". Empty string if not set. */
function shortDate(iso) {
  if (!iso) return ""
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/* Open the native date picker on click (fixes desktop Chrome/Edge where
   clicking an invisible date input does nothing). Safe no-op elsewhere. */
function openDatePicker(e) {
  try {
    e.currentTarget.showPicker()
  } catch {
    /* showPicker unsupported — native focus behaviour still applies */
  }
}

/* ─────────────────────────────────────────────────────────────
   SEARCH BAR
   ───────────────────────────────────────────────────────────── */
function StaySearchBar() {
  const navigate = useNavigate()
  const wrapRef = useRef(null)

  const today = toISODate(new Date())

  const [destination, setDestination] = useState("")
  const [selectedSlug, setSelectedSlug] = useState(null) // set when a property suggestion is picked
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [rooms, setRooms] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [pet, setPet] = useState(false)
  const [priceIdx, setPriceIdx] = useState(0) // index into PRICE_RANGES

  const [properties, setProperties] = useState([]) // {slug, name, property_category}
  const [showSuggest, setShowSuggest] = useState(false)
  const [openPanel, setOpenPanel] = useState(null) // 'guests' | 'price' | null

  // Fetch active property names once for autocomplete
  useEffect(() => {
    let didCancel = false
    supabase
      .from("Properties")
      .select("slug, name, property_category")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (error || !data || didCancel) return
        setProperties(data.filter((p) => p.name))
      })
    return () => {
      didCancel = true
    }
  }, [])

  // Close popovers + suggestions on outside click / Escape
  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpenPanel(null)
        setShowSuggest(false)
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpenPanel(null)
        setShowSuggest(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const guests = adults + children
  const price = PRICE_RANGES[priceIdx]

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000
    return diff > 0 ? Math.round(diff) : 0
  }, [checkIn, checkOut])

  // Autocomplete matches
  const suggestions = useMemo(() => {
    const q = destination.trim().toLowerCase()
    if (q.length < 1) return { props: [], cities: [] }
    const props = properties
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 5)
    const cities = INDIA_CITIES.filter((c) => c.toLowerCase().includes(q))
      .sort((a, b) => {
        const as = a.toLowerCase().startsWith(q) ? 0 : 1
        const bs = b.toLowerCase().startsWith(q) ? 0 : 1
        return as - bs || a.localeCompare(b)
      })
      .slice(0, 6)
    return { props, cities }
  }, [destination, properties])

  const hasSuggestions = suggestions.props.length > 0 || suggestions.cities.length > 0

  function pickCity(city) {
    setDestination(city)
    setSelectedSlug(null)
    setShowSuggest(false)
  }
  function pickProperty(p) {
    setDestination(p.name)
    setSelectedSlug(p.slug || null)
    setShowSuggest(false)
  }

  function runSearch() {
    const params = new URLSearchParams()
    if (destination.trim()) params.set("q", destination.trim())
    if (selectedSlug) params.set("property", selectedSlug)
    if (checkIn) params.set("checkin", checkIn)
    if (checkOut) params.set("checkout", checkOut)
    if (nights) params.set("nights", String(nights))
    params.set("rooms", String(rooms))
    params.set("guests", String(guests))
    params.set("adults", String(adults))
    if (children) params.set("children", String(children))
    if (pet) params.set("pet", "yes")
    if (price.min != null) params.set("min", String(price.min))
    if (price.max != null) params.set("max", String(price.max))
    navigate(`${SEARCH_ROUTE}?${params.toString()}`)
  }

  const fieldBase =
    "flex items-center gap-3 px-5 py-4 md:py-[1.15rem] text-left w-full transition-all duration-200 hover:bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-inset"
  const labelCls =
    "block text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500/80 mb-0.5"
  const valueCls =
    "block text-[18px] md:text-base font-bold text-slate-900 leading-tight truncate"

  return (
    <div ref={wrapRef} className="hs-in relative">
      {/* Scoped animation styles (respects reduced motion) */}
      <style>{`
        @keyframes hsFadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes hsPop {
          from { opacity:0; transform: translateY(-6px) scale(.96) }
          to   { opacity:1; transform: translateY(0) scale(1) }
        }
        @keyframes hsGlow {
          0%,100% { box-shadow:0 10px 24px -6px rgba(124,58,237,.55) }
          50% { box-shadow:0 14px 32px -6px rgba(217,70,239,.6) }
        }
        .hs-in { animation: hsFadeUp .55s cubic-bezier(.16,1,.3,1) both }
        .hs-pop { transform-origin: top; animation: hsPop .24s cubic-bezier(.34,1.4,.5,1) both }
        .hs-glow { animation: hsGlow 2.8s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .hs-in, .hs-pop, .hs-glow { animation: none !important }
          .hs-sweep { display:none !important }
        }
      `}</style>

      <div className="rounded-[1.75rem] border border-white/50 bg-white/55 shadow-2xl shadow-violet-300/40 backdrop-blur-2xl backdrop-saturate-150">
        <div className="flex flex-col divide-y divide-white/50 lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
          {/* Destination + autocomplete */}
          <div className="relative flex-[1.7] min-w-0">
            <label className={`${fieldBase} rounded-t-[1.75rem] lg:rounded-l-[1.75rem] lg:rounded-tr-none cursor-text`}>
              <MapPin className="h-5 w-5 flex-shrink-0 text-violet-500" />
              <span className="min-w-0 flex-1">
                <span className={labelCls}>Location</span>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value)
                    setSelectedSlug(null)
                    setShowSuggest(true)
                  }}
                  onFocus={() => {
                    setShowSuggest(true)
                    setOpenPanel(null)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="City, property name or location"
                  className="w-full bg-transparent text-[18px] md:text-base font-extrabold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
                  autoComplete="off"
                />
              </span>
            </label>

            {showSuggest && hasSuggestions && (
              <div className="hs-pop absolute z-40 left-3 right-3 lg:left-2 lg:right-auto lg:w-[22rem] top-[calc(100%+8px)] max-h-80 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl ring-1 ring-violet-100 backdrop-blur-xl">
                {suggestions.props.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Our stays
                    </p>
                    {suggestions.props.map((p) => (
                      <button
                        key={`p-${p.slug || p.name}`}
                        type="button"
                        onClick={() => pickProperty(p)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-violet-50"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800">
                            {p.name}
                          </span>
                          {p.property_category && (
                            <span className="block text-[11px] capitalize text-slate-400">
                              {p.property_category} stay
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </>
                )}
                {suggestions.cities.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Destinations
                    </p>
                    {suggestions.cities.map((c) => (
                      <button
                        key={`c-${c}`}
                        type="button"
                        onClick={() => pickCity(c)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-violet-50"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <span className="truncate text-sm font-semibold text-slate-700">{c}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Check-in */}
          <div className="relative flex-1 min-w-0">
            <label className={`${fieldBase} cursor-pointer`}>
              <CalendarDays className="h-5 w-5 flex-shrink-0 text-violet-500" />
              <span className="min-w-0 flex-1">
                <span className={labelCls}>Check-in</span>
                <span className="relative block">
                  <span className={valueCls}>{shortDate(checkIn) || <span className="font-semibold text-slate-400">Add date</span>}</span>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => {
                      setCheckIn(e.target.value)
                      if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut("")
                    }}
                    onClick={openDatePicker}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:light]"
                    aria-label="Check-in date"
                  />
                </span>
              </span>
            </label>
          </div>

          {/* Check-out */}
          <div className="relative flex-1 min-w-0">
            <label className={`${fieldBase} cursor-pointer`}>
              <CalendarDays className="h-5 w-5 flex-shrink-0 text-violet-500" />
              <span className="min-w-0 flex-1">
                <span className={labelCls}>Check-out</span>
                <span className="relative block">
                  <span className={valueCls}>{shortDate(checkOut) || <span className="font-semibold text-slate-400">Add date</span>}</span>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)}
                    onClick={openDatePicker}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:light]"
                    aria-label="Check-out date"
                  />
                </span>
              </span>
            </label>
          </div>


          {/* Rooms & guests */}
          <div className="relative flex-[1.8] min-w-0 ">
            <button
              type="button"
              onClick={() => {
                setOpenPanel(openPanel === "guests" ? null : "guests")
                setShowSuggest(false)
              }}
              aria-expanded={openPanel === "guests"}
              className={`${fieldBase} rounded-b-[1.75rem] lg:rounded-b-none cursor-pointer hover:bg-violet-500`}
            >
              <Users className="h-5 w-5 flex-shrink-0 text-violet-500" />
              <span className="min-w-0 flex-1">
                <span className={labelCls}>Guests &amp; rooms</span>
                <span className={valueCls}>
                  {guests} Adults · {rooms} rooms{pet ? " 🐾" : ""}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform cursor-pointer ${
                  openPanel === "guests" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPanel === "guests" && (
              <div className="hs-pop absolute z-40 left-3 right-3 lg:left-auto lg:right-0 lg:w-80 top-[calc(100%+8px)] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl ring-1 ring-violet-100 backdrop-blur-xl z-10">
                <Stepper label="Rooms" hint="How many rooms" value={rooms} min={1} onChange={setRooms} />
                <Stepper label="Adults" hint="Age 13+" value={adults} min={1} onChange={setAdults} />
                <Stepper label="Children" hint="Age 0–12" value={children} min={0} onChange={setChildren} />

                {/* Pet checkbox */}
                <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-violet-50/70 px-3 py-3 transition hover:bg-violet-100/70">
                  <input
                    type="checkbox"
                    checked={pet}
                    onChange={(e) => setPet(e.target.checked)}
                    className="h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-400"
                  />
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <PawPrint className="h-4 w-4 text-violet-500" />
                    Travelling with a pet?
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setOpenPanel(null)}
                  className="mt-3 w-full rounded-xl bg-violet-50 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Budget dropdown */}
          <div className="relative flex-[1.3] min-w-0">
            <button
              type="button"
              onClick={() => {
                setOpenPanel(openPanel === "price" ? null : "price")
                setShowSuggest(false)
              }}
              aria-expanded={openPanel === "price"}
              className={`${fieldBase} rounded-b-[1.75rem] lg:rounded-b-none cursor-pointer`}
            >
              <Wallet className="h-5 w-5 flex-shrink-0 text-violet-500" />
              <span className="min-w-0 flex-1">
                <span className={labelCls}>Budget per night</span>
                <span className={valueCls}>{price.short}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
                  openPanel === "price" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPanel === "price" && (
              <div className="hs-pop absolute z-40 left-3 right-3 lg:left-auto lg:right-0 lg:w-72 top-[calc(100%+8px)] rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl ring-1 ring-violet-100 backdrop-blur-xl z-index:1">
                {PRICE_RANGES.map((r, i) => {
                  const active = i === priceIdx
                  return (
                    <button
                      key={r.short}
                      type="button"
                      onClick={() => {
                        setPriceIdx(i)
                        setOpenPanel(null)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow"
                          : "text-slate-700 hover:bg-violet-50"
                      }`}
                    >
                      {r.label}
                      {active && <span className="text-xs">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Search action */}
          <div className="p-2 lg:flex lg:items-center">
            <button
              type="button"
              onClick={runSearch}
              className="hs-glow group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-4xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 lg:h-12 px-5 cursor-pointer"
            >
              {/* hover sheen sweep */}
              <span className="hs-sweep pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Search className="relative h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="relative">Search stays</span>
            </button>
          </div>
        </div>
      </div>

      {/* Popular destination chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Popular:</span>
        {["Manali", "Coorg", "Rishikesh", "Spiti", "Gokarna", "Kasol"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => pickCity(d)}
            className="rounded-full border border-violet-200 bg-white/70 px-3 py-1 text-xs font-semibold text-violet-700 backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-white"
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

/* Small +/- stepper row used inside the guests popover. */
function Stepper({ label, hint, value, min = 0, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 text-violet-600 transition hover:border-violet-400 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-5 text-center text-sm font-bold text-slate-900">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200 text-violet-600 transition hover:border-violet-400 hover:bg-violet-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────── */
export default function Stays() {
  const [stayCounts, setStayCounts] = useState({})

  useEffect(() => {
    setPageSEO({
      title: "Stays",
      description:
        "Search Hoppity stays across India by destination, dates, guests, and price per night — affordable homestays, boutique signature properties, and flagship stays, each personally vetted by the team. Pet-friendly options available.",
      canonical: "/stays",
    })
  }, [])

  // Count active properties per category
  useEffect(() => {
    let didCancel = false

    supabase
      .from("Properties")
      .select("property_category")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (error || !data || didCancel) return
        const tally = {}
        data.forEach((r) => {
          if (!r.property_category) return
          tally[r.property_category] = (tally[r.property_category] || 0) + 1
        })
        setStayCounts(tally)
      })

    return () => {
      didCancel = true
    }
  }, [])

  const totalStays = Object.values(stayCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#f7f1ff] text-slate-900">
      <Navbar />

      {/* ── HEADER + SEARCH ─────────────────────────────────────── */}
      <section className="relative pt-24 pb-10 md:pt-28 md:pb-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,58,237,0.12),transparent)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-4">
            <Link
              to="/"
              aria-label="Back to home"
              title="Back to home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#f7f1ff]"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Go back</span>
            </Link>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Where to stay
          </p>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            Find your kind of stay.
          </h1>
          <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Every property here has been visited, checked, and chosen by us, no aggregator
            listings, no surprises on arrival.
          </p>

          {/* Search bar */}
          <StaySearchBar />
        </div>
      </section>

      {/* ── STAY CATEGORIES ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-20">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Or browse by type
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
              Three ways to stay with us
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STAY_CATEGORIES.map((card) => (
            <Link
              key={card.slug}
              to={`/stays/${card.slug}`}
              className="group relative h-[380px] cursor-pointer overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1ff]"
            >
              {/* Background image */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />

              {/* Gradient overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: card.flagship
                    ? "linear-gradient(160deg, rgba(80,20,160,0.28) 0%, transparent 45%, rgba(0,0,0,0.82) 100%)"
                    : "linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0.76) 100%)",
                }}
              />

              {/* Flagship: gold shimmer line at top */}
              {card.flagship && (
                <div
                  className="pointer-events-none absolute left-0 right-0 top-0"
                  style={{
                    height: "2.5px",
                    background:
                      "linear-gradient(90deg, transparent 0%, #c4a35a 35%, #f0d080 55%, transparent 100%)",
                  }}
                />
              )}

              {/* Top badges */}
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                <span
                  className="rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide backdrop-blur-md"
                  style={{
                    background: card.flagship ? "rgba(196,163,90,0.22)" : "rgba(255,255,255,0.16)",
                    color: card.flagship ? "#f0d080" : "#fff",
                    borderColor: card.flagship ? "rgba(196,163,90,0.40)" : "rgba(255,255,255,0.28)",
                  }}
                >
                  {card.label}
                </span>
                {card.flagship && (
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md"
                    style={{
                      background: "rgba(255,255,255,0.13)",
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.22)",
                    }}
                  >
                    ⭐ Hoppity pick
                  </span>
                )}
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                {/* Icon + Title */}
                <div className="mb-2 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] border text-base backdrop-blur-md"
                    style={{
                      background: card.flagship ? "rgba(196,163,90,0.20)" : "rgba(255,255,255,0.16)",
                      borderColor: card.flagship ? "rgba(196,163,90,0.35)" : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {card.icon}
                  </div>
                  <p className="text-[17px] font-black tracking-tight text-white drop-shadow-md">
                    {card.title}
                  </p>
                </div>

                {/* Description */}
                <p className="mb-3 text-xs leading-relaxed text-white/80 drop-shadow">
                  {card.desc}
                </p>

                {/* Flagship perks */}
                {card.flagship && card.perks && (
                  <div className="mb-3 flex flex-col gap-1.5">
                    {card.perks.map((perk) => (
                      <div key={perk} className="flex items-center gap-2">
                        <span className="text-[11px]" style={{ color: "#f0d080" }}>
                          ✦
                        </span>
                        <span className="text-[11px] font-medium text-white/85 drop-shadow">
                          {perk}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Count + Explore */}
                <div
                  className="flex items-center justify-between border-t pt-3"
                  style={{
                    borderColor: card.flagship ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)",
                  }}
                >
                  <span
                    className="rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md"
                    style={{
                      background: card.flagship ? "rgba(196,163,90,0.20)" : "rgba(255,255,255,0.15)",
                      color: card.flagship ? "#f0d080" : "#fff",
                      borderColor: card.flagship ? "rgba(196,163,90,0.36)" : "rgba(255,255,255,0.26)",
                    }}
                  >
                    {(() => {
                      const n = stayCounts[card.slug]
                      if (n == null) return card.count // fallback until fetch resolves
                      return `${n} ${n === 1 ? "stay" : "stays"}`
                    })()}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-white drop-shadow">
                    Explore{" "}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: card.flagship ? "#f0d080" : "#fff" }}
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