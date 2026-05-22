import { Link } from "react-router-dom"
import { ArrowRight, Star, MapPin, Clock, Wifi, Coffee, Flame, Anchor, Shield, Utensils } from "lucide-react"

// ─── Amenity Icons ────────────────────────────────────────────────────────────

const AMENITY_ICONS = {
  'Wifi':        Wifi,
  'Cafe':        Coffee,
  'Bonfire':     Flame,
  'Beach access':Anchor,
  'Breakfast':   Coffee,
  'Home food':   Utensils,
  'Meals':       Utensils,
  'Rafting':     Anchor,
  'Rooftop':     MapPin,
  'Hot water':   Shield,
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function BudgetStayCard({ stay, tagGradients, defaultGradient }) {
  const hasImage = stay.image?.length > 0 && stay.image[0]
  const gradient = tagGradients[stay.tag] || defaultGradient
  const duration = stay.duration_display || stay.duration || ''
  const price = stay.price_per_person
    ? `₹${Number(stay.price_per_person).toLocaleString('en-IN')}`
    : stay.price || 'On Request'
  const isBestValue = Number(stay.price_per_person) > 0 && Number(stay.price_per_person) < 2000

  return (
    <Link
      to={`/stays/budget/${stay.slug}`}
      className="group overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-100 cursor-pointer flex flex-col"
    >
      {/* Image area */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        {/* Fallback gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-6xl opacity-30">🎒</span>
        </div>

        {hasImage && (
          <img
            src={stay.image[0]}
            alt={stay.title}
            className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Top-left: tag + best value */}
        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
          {stay.tag && (
            <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {stay.tag}
            </span>
          )}
          {isBestValue && (
            <span className="inline-flex rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              Best value
            </span>
          )}
        </div>

        {/* Top-right: rating */}
        {stay.rating > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">{Number(stay.rating).toFixed(1)}</span>
            {stay.review_count && (
              <span className="text-[10px] text-white/60 ml-0.5">({stay.review_count})</span>
            )}
          </div>
        )}

        {/* Bottom: location + title */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {stay.location && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-violet-300 flex-shrink-0" />
              <p className="text-xs text-violet-200 truncate">{stay.location}</p>
            </div>
          )}
          <h3 className="text-xl font-bold leading-snug text-white line-clamp-2">
            {stay.title}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Price + duration */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration}</span>
          </div>
          <div>
            <span className="font-black text-violet-700 text-base">{price}</span>
            <span className="text-xs text-slate-400 ml-1">/ person</span>
          </div>
        </div>

        {/* Blurb */}
        {stay.blurb && (
          <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 flex-1 mb-4">
            {stay.blurb}
          </p>
        )}

        {/* Amenity chips */}
        {stay.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {stay.amenities.slice(0, 3).map(a => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={a} className="flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs text-violet-700">
                  {Icon && <Icon className="w-3 h-3" />}
                  {a}
                </span>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 group-hover:text-violet-700 transition">
            View property
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Budget-friendly
          </span>
        </div>
      </div>
    </Link>
  )
}
