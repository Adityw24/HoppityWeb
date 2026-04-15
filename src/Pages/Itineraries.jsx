import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

// Normalise Supabase row → shape the template expects
function normalise(row) {
  return {
    ...row,
    image: row.images?.length ? row.images : (row.cover_image_url ? [row.cover_image_url] : []),
    cityStops: row.city_stops || [],
    itinerary: row.itinerary_days || [],
  };
}

export default function Itineraries() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    supabase
      .from("Itineraries")
      .select("id,slug,title,location,duration,price,tag,blurb,cover_image_url,images,is_active")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .then(({ data }) => {
        setTrips((data || []).map(normalise));
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-slate-500">Loading journeys…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="px-6 pt-6 pb-12 lg:px-10">

      {/* Header */}
      <div className="relative mb-12">

        {/* Back Button */}
        <Link
          to="/"
          aria-label="Go back to home"
          className="absolute left-3 top-3 z-10 h-11 w-11 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-md transition hover:scale-105 sm:left-6 sm:top-4 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        {/* Centered Content */}
        <div className="max-w-4xl mx-auto pt-12 text-center sm:pt-0">
          <h1 className="text-4xl md:text-6xl font-black text-slate-950">
            All Journeys
          </h1>

          <p className="mt-4 text-lg text-slate-600">
            Every trip here is designed to be remembered, not just completed.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <Link
            to={`/itinerary/${trip.slug}`}
            key={trip.slug}
            className="group overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
          >
            <div className="relative h-52 overflow-hidden text-white bg-gradient-to-br from-violet-100 to-purple-100">
              <img
                src={trip.image?.[0] || trip.cover_image_url || ""}
                className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

              <div className="relative p-6">
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
                  {trip.tag}
                </div>

                <div className="mt-14">
                  <p className="text-sm uppercase tracking-[0.2em] text-violet-200">
                    {trip.location}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold leading-tight line-clamp-2">
                    {trip.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{trip.duration}</span>
                <span className="font-semibold text-violet-700">
                  {trip.price}
                </span>
              </div>

              <p className="mt-4 text-base leading-7 text-slate-700 line-clamp-3">
                {trip.blurb}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-950 transition group-hover:text-violet-700">
                  Explore
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>

                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                  Small-group feel
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}