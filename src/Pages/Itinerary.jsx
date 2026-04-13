import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Download, Waves, Utensils, Compass, Droplets, Home, Users, MapPin, Car, ShieldCheck, Phone } from 'lucide-react';
import { XCircle } from "lucide-react";
import { Info } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trips } from '../data/Trips.jsx';

const TripDetails = () => {
  const { slug } = useParams();

  // Find trip using slug
  const trip = trips.find((trip) => trip.slug === slug);

  // Debug logs to verify data fetching
  useEffect(() => {
    console.log('Slug from URL:', slug);
    console.log('All available trips:', trips);
    console.log('Found trip:', trip);
  }, [slug, trip]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // If no slug in URL or trip not found
  if (!slug || !trip) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Trip Not Found</h1>
          <p style={{ color: '#666' }}>The trip you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

const [currentImage, setCurrentImage] = useState(0);

const nextImage = () => {
  if (Array.isArray(trip.image)) {
    setCurrentImage((prev) => (prev + 1) % trip.image.length);
  }
};

const prevImage = () => {
  if (Array.isArray(trip.image)) {
    setCurrentImage((prev) =>
      prev === 0 ? trip.image.length - 1 : prev - 1
    );
  }
};

  // Extract duration and convert to days (e.g., "4D / 3N" → 4)
  const days = parseInt(trip.duration.split('D')[0]) || 4;


  return (
    <div className="h-full font-sans text-[#1a1a1a] bg-white overflow-y-auto overflow-x-hidden selection:bg-purple-100">
      {/* CSS Variables & Global Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-dark: #ffffff;
          --surface: #f8f5ff;
          --text-primary: #1a1a1a;
          --accent-purple: #7c3aed;
          --accent-light-purple: #a78bfa;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-light-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(124, 58, 237, 0.15);
        }
        
        .glow-border {
          position: relative;
        }
        
        .glow-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(135deg, var(--accent-purple), transparent, var(--accent-light-purple));
          z-index: -1;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .glow-border:hover::before {
          opacity: 1;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.6s ease-out forwards; }
        
        .shimmer-button {
          background: linear-gradient(90deg, var(--accent-purple), #a78bfa, var(--accent-purple));
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
          color: white;
        }
        
        .hero-section {
          background: 
            radial-gradient(ellipse 100% 80% at 50% 0%, rgba(124, 58, 237, 0.1), transparent),
            radial-gradient(ellipse 80% 60% at 80% 50%, rgba(167, 139, 250, 0.08), transparent),
            var(--bg-dark);
        }

        .day-card {
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          border-left: 4px solid transparent;
          background: linear-gradient(135deg, rgba(248, 245, 255, 0.8), rgba(248, 245, 255, 0.5));
        }

        .day-card:hover {
          border-left-color: var(--accent-purple);
          transform: translateX(12px);
          background: linear-gradient(135deg, rgba(248, 245, 255, 0.95), rgba(248, 245, 255, 0.7));
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.1);
        }

        .highlight-badge {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(167, 139, 250, 0.08));
          border: 1px solid rgba(124, 58, 237, 0.2);
          transition: all 0.3s ease;
        }

        .include-item {
          padding: 1.5rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(167, 139, 250, 0.06));
          border: 1px solid rgba(124, 58, 237, 0.15);
          transition: all 0.4s ease;
        }

        .stat-box {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(167, 139, 250, 0.08));
          border: 1px solid rgba(124, 58, 237, 0.15);
          padding: 1.5rem;
          border-radius: 1rem;
          text-align: center;
        }
      `}} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div id='btn' onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
              <span id='btn' onClick={() => window.history.back()} className="text-lg font-semibold text-gray-700">Back</span>
            </div>
            <div className="flex items-center gap-4">
              
              <button
              onClick={() =>
                {
                  window.gtag('event', 'book_now_click', {
                    event_category: 'engagement',
                    event_label: trip.title,
                    value: trip.price,
                  });
                  window.open(`https://wa.me/919752377323?text=Hi Hoppity!, I want to book the trip: ${trip.title}`,"_blank");
                }
              }
              className="px-6 py-2.5 rounded-full text-sm font-semibold shimmer-button hover:shadow-lg transition-shadow cursor-pointer"> Book Now </button>

            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section min-h-screen relative flex items-center pt-24 pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-40 right-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" style={{animation: 'float 6s ease-in-out infinite'}}></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                <span className="text-gray-700">{trip.tag}</span>
              </div>
              <div>
                <h1 className="text-6xl md:text-7xl font-bold leading-tight animate-fade-in-up mb-4" style={{animationDelay: '0.1s'}}>
                  {trip.title.split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{trip.title.split(' ').pop()}</span>
                </h1>
              </div>
              <div className="space-y-4 opacity-0 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <p className="text-lg text-gray-600 max-w-lg leading-relaxed">{trip.blurb}</p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div>
                    <div className="text-gray-500 text-sm mb-1 font-semibold">Duration</div>
                    <div className="text-2xl font-semibold">{trip.duration}</div>
                  </div>
                  <div className="h-12 w-px bg-gray-200"></div>
                  <div>
                    <div className="text-gray-500 text-sm mb-1 font-semibold">Location</div>
                    <div className="text-2xl font-semibold">{trip.location}</div>
                  </div>
                  <div className="h-12 w-px bg-gray-200"></div>
                  <div>
                    <div className="text-gray-500 font-semibold text-sm mb-1">Price</div>
                    <div className="gradient-text text-2xl font-semibold">{trip.price}</div>
                  </div>
                </div>
              </div>
            <div className="flex flex-wrap gap-4 opacity-0 animate-fade-in-up pt-4" style={{animationDelay: '0.3s'}}>
              
                <button
                onClick={() => {
                  window.gtag('event', 'book_now_click', {
                    event_category: 'engagement',
                    event_label: trip.title,
                    value: trip.price,
                  });
                  window.open(`https://wa.me/919752377323?text=Hi Hoppity!, I want to book the trip: ${trip.title}`,"_blank");
                }}
                className="shimmer-button px-8 py-4 rounded-full text-base font-semibold hover:shadow-xl  transition-all cursor-pointer"> Book Your Adventure </button>
                
              </div>
            </div>

            {/* Image Slider */}
            <div className="relative animate-scale-in hidden lg:block" style={{animationDelay: '0.2s'}}>
              <div className="glass-card rounded-3xl p-6 glow-border">

                <div className="aspect-4/5 rounded-2xl overflow-hidden bg-slate-900 relative">

                  <img
                    src={Array.isArray(trip.image) ? trip.image[currentImage] : trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover transition duration-500"
                  />

                  {/* Left Arrow */}
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/40 backdrop-blur rounded-full p-2 shadow cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Right Arrow */}
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/40 backdrop-blur rounded-full p-2 shadow cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>

                </div>

                {/* Image Indicators */}
              {Array.isArray(trip.image) && trip.image.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {trip.image.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImage(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                          index === currentImage
                            ? "bg-violet-600 scale-125"
                            : "bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
)}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="py-24 bg-white">
  <div className="max-w-5xl mx-auto px-6">

    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        Your <span className="gradient-text">{trip.itinerary.length}-Day Journey</span>
      </h2>

      <p className="text-gray-500 max-w-2xl mx-auto">
        A carefully curated experience designed to give you the best of {trip.location}
      </p>
    </div>

    <div className="space-y-8">

      {trip.itinerary.map((day, i) => (
        <div
          key={i}
          className="day-card rounded-2xl p-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: `${(i + 1) * 0.1}s` }}
        >

          <div className="flex flex-col md:flex-row items-start gap-6">

            {/* Day Number */}
            <div className="w-24 h-24 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
              <span className="text-3xl font-bold gradient-text">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Day Content */}
            <div className="flex-1">

              <h3 className="text-2xl font-semibold mb-3">
                Day {i + 1} - {day.title}
              </h3>

              <p className="text-gray-600 leading-relaxed mb-4">
                {day.description}
              </p>

              {/* Activities */}
              <div className="flex flex-wrap gap-3">

                {day.activities?.map((activity, index) => (
                  <span
                    key={index}
                    className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full"
                  >
                    {activity}
                  </span>
                ))}

              </div>

            </div>

          </div>

        </div>
      ))}

    </div>

  </div>
</section>

      {/* Tips Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <TipsSection tips={trip.tips} />
        </div>
      </section>

      {/* Route Section */}
      <RouteSection trip={trip} />

      <section className="py-24 bg-[#f8f5ff]">
  <div className="max-w-7xl mx-auto px-6">

    {/* Heading */}
    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        Trip <span className="gradient-text">Details</span>
      </h2>
    </div>

    {/* Card */}
    <div className="bg-white rounded-3xl shadow-sm p-10 opacity-0 animate-fade-in-up">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">

        {/* Vertical Divider */}
        <div className="hidden md:block absolute left-1/2 top-0 h-full w-px bg-gray-200"></div>

        {/* Included */}
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-purple-700">
            What's Included
          </h3>

          <div className="space-y-4">
            {trip.inclusions?.map((item, i) => (
              <div key={i} className="flex items-start gap-4">

                <ShieldCheck className="w-6 h-6 text-purple-600 mt-1 shrink-0" />

                <p className="text-gray-700 leading-relaxed">
                  {item}
                </p>

              </div>
            ))}
          </div>
        </div>

        {/* Excluded */}
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-red-600">
            What's Excluded
          </h3>

          <div className="space-y-4">
            {trip.exclusions?.map((item, i) => (
              <div key={i} className="flex items-start gap-4">

                <span className="text-red-500 text-lg mt-1">✖</span>

                <p className="text-gray-700 leading-relaxed">
                  {item}
                </p>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>

  </div>
</section>

       {/* Highlights */}
  <section className="py-24 bg-[#f8f5ff]">
  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
      Experience the <span className="gradient-text">Highlights</span>
    </h2>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

      {trip.highlights.map((highlight, i) => (
        <div
          key={i}
          className="highlight-badge rounded-2xl p-6 flex items-start gap-3 opacity-0 animate-fade-in-up"
          style={{ animationDelay: `${(i + 1) * 0.1}s` }}
        >
          <span className="text-purple-600 text-xl">✔</span>

          <p className="text-gray-700 text-sm">
            {highlight}
          </p>

        </div>
      ))}

    </div>

  </div>
</section>


      {/* CTA */}
      <section className="py-24 bg-[#f8f5ff]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 opacity-0 animate-fade-in-up">Ready to Explore <span className="gradient-text">{trip.location}</span>?</h2>
          <p className="text-gray-500 text-lg mb-10 opacity-0 animate-fade-in-up">Limited slots available. Book now to secure your adventure.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up">
            <button
            onClick={() => window.open(`https://wa.me/919999999999?text=Hi Hoppity!, I want to book the trip: ${trip.title}`,"_blank")}
            className="shimmer-button px-10 py-5 rounded-full text-lg font-semibold shadow-xl cursor-pointer"> Book Your Adventure </button>
            <a href="tel:+919876543210" className="w-full sm:w-auto">
              <button className="px-10 py-5 rounded-full text-lg font-medium glass-card glow-border flex items-center justify-center gap-3 cursor-pointer hover:bg-white/8 transition-all w-full">
                <Phone className="w-5 h-5 text-teal-600" /> Call Our Experts
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '500+', label: 'Happy Travelers' },
              { num: '4.9★', label: 'Average Rating' },
              { num: '20+', label: 'Unique Trips' },
              { num: '24/7', label: 'Support Available' }
            ].map((stat, i) => (
              <div key={i} className="stat-box opacity-0 animate-scale-in" style={{animationDelay: `${(i+1)*0.1}s`}}>
                <div className="text-4xl font-bold gradient-text">{stat.num}</div>
                <div className="text-gray-500 mt-3">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16 text-center text-gray-400">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 Hoppity - Discover Real India</p>
          <a href="mailto:sales@hoppity.in?subject=Inquiry from Hoppity&body=Hi Hoppity team," className="mt-2 text-sm hover:underline">sales@hoppity.in </a>
        </div>
      </footer>
    </div>
  );
};

const RouteSection = ({ trip }) => {
  const stops = trip.route.split(" → ");

  return (
    <section className="py-16 ml-32">
      <h2 className="text-3xl font-bold mb-8">Journey Route</h2>

      {/* Route Path */}
      <div className="flex flex-wrap items-center gap-3 text-lg text-gray-700 mb-10">
        {stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="bg-gray-100 px-4 py-2 rounded-xl">
              {stop}
            </span>
            {index !== stops.length - 1 && (
              <span className="text-violet-500 font-semibold">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Night Stays */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Night Stays</h3>
        <div className="flex flex-wrap gap-4">
          {trip.cityStops.map((city, index) => (
            <div
              key={index}
              className="bg-violet-50 text-violet-700 px-5 py-3 rounded-xl font-medium"
            >
              {city}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

{/* Tips Section Component */}
function TipsSection({ tips }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="mt-12 rounded-4xl border border-violet-100 bg-white p-6 shadow-sm">
      
      {/* Heading */}
      <div className="flex items-center gap-2 mb-6">
        <Info className="text-violet-600 w-5 h-5" />
        <h3 className="text-xl font-bold text-slate-900">
          Things to Keep in Mind
        </h3>
      </div>

      {/* Tips List */}
      <div className="grid gap-4 md:grid-cols-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl bg-[#faf7ff] p-4 transition hover:shadow-md"
          >
            {/* Bullet */}
            <div className="mt-1 h-2 w-2 rounded-full bg-violet-600 shrink-0" />

            {/* Text */}
            <p className="text-sm text-slate-700 leading-6">
              {tip}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TripDetails;
