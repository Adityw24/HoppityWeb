import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TripDetails() {
  const { slug } = useParams();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    const fetchTrip = async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_images (*),
          trip_highlights (*),
          trip_itinerary_days (
            *,
            trip_itinerary_activities (*)
          )
        `)
        .eq("slug", slug)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setTrip(data);
    };

    fetchTrip();
  }, [slug]);

  if (!trip) return <p>Loading...</p>;

  return (
    <div>
      <h1>{trip.title}</h1>
      <p>{trip.location}</p>

      {/* Images */}
      {trip.trip_images?.map((img) => (
        <img key={img.id} src={img.image_url} alt="" />
      ))}

      {/* Highlights */}
      <ul>
        {trip.trip_highlights?.map((h) => (
          <li key={h.id}>{h.highlight_text}</li>
        ))}
      </ul>

      {/* Itinerary */}
      {trip.trip_itinerary_days?.map((day) => (
        <div key={day.id}>
          <h3>Day {day.day_number}: {day.title}</h3>
          <p>{day.description}</p>

          <ul>
            {day.trip_itinerary_activities?.map((act) => (
              <li key={act.id}>{act.activity_text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}