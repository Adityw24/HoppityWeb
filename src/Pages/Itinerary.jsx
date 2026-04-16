import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Waves, Utensils, Compass, Droplets, Home, Users,
  MapPin, Car, ShieldCheck, Phone, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import Navbar from '../components/Navbar';
import { setPageSEO, buildTourLD } from '../lib/seo'

// ── Normalise Supabase row ────────────────────────────────────────────
function normalise(row) {
  if (!row) return null;
  return {
    ...row,
    image: row.images?.length
      ? row.images
      : row.cover_image_url
        ? [row.cover_image_url]
        : [],
    cityStops:  row.city_stops    || [],
    itinerary:  row.itinerary_days || [],
    highlights: row.highlights    || [],
    inclusions: row.inclusions    || [],
    exclusions: row.exclusions    || [],
    tips:       row.tips          || [],
  };
}

const WHATSAPP = 'https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I%27m%20interested%20in%20booking%20a%20trip';

export default function TripDetails() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const [trip, setTrip]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!slug) { setLoading(false); return; }
    supabase
      .from('Itineraries')
      .select('id,slug,title,location,state,category,difficulty,duration,duration_display,price,price_per_person,tag,blurb,route,city_stops,meeting_point,highlights,inclusions,exclusions,tips,itinerary_days,images,cover_image_url,video_url,rating,review_count,max_group_size,created_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('Itinerary fetch error:', error.message);
        setTrip(normalise(data));
        setLoading(false);
      });
  }, [slug]);

  const nextImage = () => {
    if (trip?.image?.length > 1) setCurrentImage(p => (p + 1) % trip.image.length);
  };
  const prevImage = () => {
    if (trip?.image?.length > 1) setCurrentImage(p => p === 0 ? trip.image.length - 1 : p - 1);
  };

  // ── Loading ─────────────────────────────────────────────────────────

  // Dynamic SEO — runs once trip data loads
  useEffect(() => {
    if (!trip) return
    const img = trip.images?.[0] || trip.cover_image_url
    setPageSEO({
      title: `${trip.title} – ${trip.location || trip.state || 'India'}`,
      description: trip.blurb || `${trip.title} — an extraordinary guided journey through ${trip.location || 'India'} with Hoppity.`,
      canonical: `/itinerary/${trip.slug}`,
      image: img,
      type: 'article',
      jsonLd: buildTourLD({
        title: trip.title,
        description: trip.blurb,
        url: `/itinerary/${trip.slug}`,
        image: img,
        price: trip.price_per_person,
        location: trip.location,
        category: trip.category,
        duration: trip.duration_display || trip.duration,
      }),
    })
  }, [trip])

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading itinerary…</p>
      </div>
    </div>
  );

  // ── Not found ────────────────────────────────────────────────────────
  if (!trip) return (
    <div className="min-h-screen bg-[#f7f1ff] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-5">🗺️</div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Itinerary not found</h1>
      <p className="text-slate-500 mb-6">This trip may have moved or been updated.</p>
      <Link to="/itineraries"
        className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 text-white px-6 py-3 font-semibold hover:bg-violet-800 transition">
        <ArrowLeft className="w-4 h-4" /> Browse all itineraries
      </Link>
    </div>
  );

  const hasImages      = trip.image.length > 0;
  const hasItinerary   = trip.itinerary.length > 0;
  const hasHighlights  = trip.highlights.length > 0;
  const hasInEx        = trip.inclusions.length > 0 || trip.exclusions.length > 0;
  const hasTips        = trip.tips.length > 0;
  const hasRoute       = trip.route && trip.route.includes('→');
  const hasCityStops   = trip.cityStops.length > 0;
  const displayPrice   = trip.price_per_person
    ? `₹${Number(trip.price_per_person).toLocaleString('en-IN')} / person`
    : (trip.price || 'On Request');

  return (
    <div className="min-h-screen font-sans text-[#1a1a1a] bg-white overflow-x-hidden selection:bg-purple-100">
      <style dangerouslySetInnerHTML={{ __html: `
        .gradient-text {
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glass-card {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(124,58,237,0.15);
        }
        .shimmer-button {
          background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
          color: white;
        }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        .fade-up  { animation: fadeInUp 0.7s ease-out forwards; }
        .scale-in { animation: scaleIn  0.6s ease-out forwards; }
        .day-card {
          border-left: 4px solid transparent;
          background: linear-gradient(135deg,rgba(248,245,255,0.8),rgba(248,245,255,0.5));
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .day-card:hover {
          border-left-color: #7c3aed;
          transform: translateX(10px);
          box-shadow: 0 10px 40px rgba(124,58,237,0.1);
        }
        .highlight-badge {
          background: linear-gradient(135deg,rgba(124,58,237,0.08),rgba(167,139,250,0.06));
          border: 1px solid rgba(124,58,237,0.18);
          transition: all 0.3s ease;
        }
        .stat-box {
          background: linear-gradient(135deg,rgba(124,58,237,0.08),rgba(167,139,250,0.06));
          border: 1px solid rgba(124,58,237,0.15);
          padding:1.5rem; border-radius:1rem; text-align:center;
        }
      `}} />

      {/* ── Shared Navbar ───────────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 0%,rgba(124,58,237,0.08),transparent), #ffffff' }}>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-7">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link to="/itineraries" className="hover:text-violet-700 transition flex items-center gap-1.5 font-semibold">
                  <ArrowLeft className="w-4 h-4" /> Itineraries
                </Link>
                {trip.category && (
                  <><span className="text-slate-300">/</span>
                  <span className="text-slate-500">{trip.category}</span></>
                )}
              </div>

              {/* Tag pill */}
              {trip.tag && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm fade-up">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  <span className="text-gray-700">{trip.tag}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight fade-up" style={{animationDelay:'0.1s'}}>
                {trip.title.split(' ').length > 1
                  ? <>{trip.title.split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{trip.title.split(' ').pop()}</span></>
                  : <span className="gradient-text">{trip.title}</span>
                }
              </h1>

              {/* Blurb + stats */}
              <div className="space-y-5 opacity-0 fade-up" style={{animationDelay:'0.2s'}}>
                {trip.blurb && <p className="text-lg text-gray-600 max-w-lg leading-relaxed">{trip.blurb}</p>}

                <div className="flex flex-wrap gap-6 pt-2">
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Duration</div>
                    <div className="text-xl font-bold text-slate-900">{trip.duration_display || trip.duration}</div>
                  </div>
                  <div className="h-10 w-px bg-gray-200 self-center" />
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Location</div>
                    <div className="text-xl font-bold text-slate-900">{trip.location}</div>
                  </div>
                  <div className="h-10 w-px bg-gray-200 self-center" />
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Price</div>
                    <div className="text-xl font-bold text-violet-700">{displayPrice}</div>
                  </div>
                </div>

                {/* Extra badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {trip.difficulty && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      trip.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      trip.difficulty === 'Challenging' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'}`}>
                      {trip.difficulty}
                    </span>
                  )}
                  {trip.max_group_size && (
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Max {trip.max_group_size} people
                    </span>
                  )}
                  {trip.rating > 0 && (
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                      ★ {Number(trip.rating).toFixed(1)}
                      {trip.review_count > 0 && ` (${trip.review_count} reviews)`}
                    </span>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 opacity-0 fade-up" style={{animationDelay:'0.3s'}}>
                <button onClick={() => navigate(`/booking/${trip.slug}`)}
                  className="shimmer-button px-8 py-4 rounded-full text-base font-semibold hover:shadow-xl transition-all cursor-pointer">
                  Book This Trip
                </button>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-7 py-4 rounded-full border border-green-300 bg-green-50 text-green-800 text-sm font-semibold hover:bg-green-100 transition cursor-pointer">
                  💬 Ask on WhatsApp
                </a>
              </div>
            </div>

            {/* Right — Image slider */}
            <div className="relative scale-in hidden lg:block" style={{animationDelay:'0.2s'}}>
              <div className="glass-card rounded-3xl p-5">
                {hasImages ? (
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 relative">
                    <img src={trip.image[currentImage]} alt={trip.title}
                      className="w-full h-full object-cover transition duration-500" />

                    {trip.image.length > 1 && (
                      <>
                        <button onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur rounded-full p-2 shadow cursor-pointer hover:bg-white/80 transition">
                          <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/50 backdrop-blur rounded-full p-2 shadow cursor-pointer hover:bg-white/80 transition">
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {trip.image.map((_, i) => (
                            <button key={i} onClick={() => setCurrentImage(i)}
                              className={`h-2 rounded-full transition-all ${i === currentImage ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex flex-col items-center justify-center gap-4">
                    <div className="text-7xl">🏔️</div>
                    <p className="text-violet-600 font-semibold text-sm">Photos coming soon</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Day-by-day itinerary ─────────────────────────────────────── */}
      {hasItinerary ? (
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14 opacity-0 fade-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-3">
                Your <span className="gradient-text">{trip.itinerary.length}-Day Journey</span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                A carefully curated experience through {trip.location}
              </p>
            </div>
            <div className="space-y-6">
              {trip.itinerary.map((day, i) => (
                <div key={i} className="day-card rounded-2xl p-7 opacity-0 fade-up"
                  style={{ animationDelay: `${(i + 1) * 0.08}s` }}>
                  <div className="flex flex-col md:flex-row items-start gap-5">
                    <div className="w-20 h-20 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
                      <span className="text-2xl font-bold gradient-text">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Day {i + 1}{day.title ? ` — ${day.title}` : ''}</h3>
                      {day.description && <p className="text-gray-600 leading-relaxed mb-3">{day.description}</p>}
                      {day.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {day.activities.map((a, j) => (
                            <span key={j} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-10">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Detailed day-plan coming soon</h3>
              <p className="text-slate-500 text-sm mb-5">
                We're putting the finishing touches on this itinerary. WhatsApp us for a full breakdown.
              </p>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-violet-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:bg-violet-800 transition">
                💬 Get the full itinerary
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Highlights ──────────────────────────────────────────────── */}
      {hasHighlights && (
        <section className="py-20 bg-[#f8f5ff]">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              Experience the <span className="gradient-text">Highlights</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {trip.highlights.map((h, i) => (
                <div key={i} className="highlight-badge rounded-2xl p-5 flex items-start gap-3 opacity-0 fade-up"
                  style={{ animationDelay: `${(i + 1) * 0.08}s` }}>
                  <span className="text-purple-600 text-lg mt-0.5 flex-shrink-0">✔</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Inclusions / Exclusions ──────────────────────────────────── */}
      {hasInEx && (
        <section className="py-20 bg-[#f8f5ff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14 opacity-0 fade-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-3">
                Trip <span className="gradient-text">Details</span>
              </h2>
            </div>
            <div className="bg-white rounded-3xl shadow-sm p-10 opacity-0 fade-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                <div className="hidden md:block absolute left-1/2 top-0 h-full w-px bg-gray-100" />
                <div>
                  <h3 className="text-xl font-bold mb-6 text-purple-700">What's Included</h3>
                  <div className="space-y-4">
                    {trip.inclusions.length > 0
                      ? trip.inclusions.map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                          </div>
                        ))
                      : <p className="text-gray-400 italic text-sm">Contact us for inclusion details.</p>}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-6 text-red-600">What's Excluded</h3>
                  <div className="space-y-4">
                    {trip.exclusions.length > 0
                      ? trip.exclusions.map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-red-400 text-lg mt-0.5 flex-shrink-0">✖</span>
                            <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                          </div>
                        ))
                      : <p className="text-gray-400 italic text-sm">Contact us for exclusion details.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Tips ────────────────────────────────────────────────────── */}
      {hasTips && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="rounded-3xl border border-violet-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Info className="text-violet-600 w-5 h-5" />
                <h3 className="text-xl font-bold text-slate-900">Things to Keep in Mind</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {trip.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-[#faf7ff] p-4 hover:shadow-sm transition">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                    <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Route ───────────────────────────────────────────────────── */}
      {(hasRoute || hasCityStops) && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8">Journey Route</h2>
            {hasRoute && (
              <div className="flex flex-wrap items-center gap-3 text-base text-gray-700 mb-8">
                {trip.route.split(' → ').map((stop, i, arr) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="bg-violet-50 border border-violet-100 text-violet-800 px-4 py-2 rounded-xl font-medium">{stop}</span>
                    {i !== arr.length - 1 && <span className="text-violet-400 font-bold">→</span>}
                  </div>
                ))}
              </div>
            )}
            {hasCityStops && (
              <div>
                <h3 className="text-base font-semibold text-slate-600 mb-3">Night Stays</h3>
                <div className="flex flex-wrap gap-3">
                  {trip.cityStops.map((city, i) => (
                    <div key={i} className="bg-violet-50 text-violet-700 px-4 py-2 rounded-xl text-sm font-medium border border-violet-100">{city}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#f8f5ff]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 opacity-0 fade-up">
            Ready to explore <span className="gradient-text">{trip.location}</span>?
          </h2>
          <p className="text-gray-500 text-base mb-8 opacity-0 fade-up">
            Limited slots available. Reach out to secure your adventure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 fade-up">
            <button onClick={() => navigate(`/booking/${trip.slug}`)}
              className="shimmer-button px-10 py-4 rounded-full text-base font-semibold shadow-xl cursor-pointer">
              Book Your Adventure
            </button>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="px-10 py-4 rounded-full text-base font-medium glass-card flex items-center justify-center gap-3 cursor-pointer border border-green-300 text-green-800 hover:bg-green-50 transition-all w-full sm:w-auto">
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { num: '500+', label: 'Happy Travellers' },
              { num: '4.9★',  label: 'Average Rating' },
              { num: '20+',  label: 'Unique Trips' },
              { num: '24/7', label: 'Support Available' },
            ].map((s, i) => (
              <div key={i} className="stat-box opacity-0 scale-in" style={{animationDelay:`${(i+1)*0.1}s`}}>
                <div className="text-3xl font-bold gradient-text">{s.num}</div>
                <div className="text-gray-500 text-sm mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-10 text-center text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 Hoppity — Discover Real India</p>
          <a href="mailto:sales@hoppity.in" className="mt-1 block text-sm hover:text-violet-600 transition">
            sales@hoppity.in
          </a>
        </div>
      </footer>
    </div>
  );
}
