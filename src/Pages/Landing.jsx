import { Link } from "react-router-dom";
import { useState } from "react";
import subhag from "/src/Reviews/subhag.jpeg";
import logo from "/src/assets/logo1.png";
import pallavi from "/src/Reviews/pallavi1.jpeg";
import divyansh from "/src/Reviews/divyansh.jpeg";
import { ArrowRight } from "lucide-react";
import { trips } from "../data/Trips";

export default function LandingPage() {

  const [form, setForm] = useState({
  name: "",
  email: "",
  contact: "",
  destination: ""
});

const handleChange = (e) => {
  let value = e.target.value;
  if (e.target.name === 'contact') {
    value = value.replace(/[^0-9]/g, "");
  }
  setForm({ ...form, [e.target.name]: value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbyLWOKG9HJ6eCbqd2wQZgR9yOuzthb5kZ2XHd1Wxbz2j2bKxIKGISyUm2rRRhuhNV6L/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      alert("You're on the early access list 🚀");
      setForm({ name: "", email: "", contact: "", destination: "" });
    } else {
      alert("Submission failed. Please try again.");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("An error occurred. Please try again.");
  }
};

{/* const itineraries = [
    {
  slug: "rains-rivers-root-bridges",
  title: "Of Rains, Rivers & Root Bridges",
  duration: "6D / 5N",
  location: "Meghalaya",
  price: "Price On Request",
  image:
    "https://i.pinimg.com/webp/1200x/53/a1/38/53a138d65679f3c596f0307efa69f3df.webp",

  blurb:
    "A monsoon journey through the Khasi Hills where rain shapes the land, living root bridges grow from forests, and rivers carve adventure into the landscape.",

  tag: "Monsoon Special",
    },

    {
  slug: "leh-himalayan-escape",
  title: "Leh Himalayan Escape",
  duration: "5D / 4N",
  location: "Ladakh",
  price: "Price On Request",
  image:
    "https://images.unsplash.com/photo-1581280445448-ab465a010046?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

  blurb:
    "A high-altitude journey through the stark beauty of Ladakh — from monasteries and mountain passes to the surreal blue waters of Pangong Lake.",

  tag: "Signature Journey",
    },

    {
      slug: "the-northeast-odyssey",
      title: "The Northeast Odyssey",
      duration: "12D / 11N",
      location: "Meghalaya • Arunachal Pradesh • Assam",
      price: "Price On Request",
      image: "https://i.pinimg.com/736x/9b/6b/e0/9b6be0930e8db809d4f1667cd4096ece.jpg",

  blurb:
    "From the rain-kissed cliffs of Cherrapunjee to the prayer flags of Tawang and the wild grasslands of Kaziranga, this journey moves slowly through the many moods of India’s Northeast.",

  tag: "Signature Journey",
    },

    {
  slug: "makers-myths-memories",
  title: "Of Makers, Myths & Memories",
  duration: "8D / 7N",
  location: "Arunachal • Assam • Nagaland",
  price: "Price On Request",
  image:
    "https://i.pinimg.com/736x/0c/74/a7/0c74a7dbfbc701429a1154dc8116511a.jpg",
  blurb:
    "From the rice valleys of Ziro to the river island of Majuli and the warrior villages of Mon, this journey traces the living cultures of the Apatani, Mising, and Konyak tribes across India’s Northeast.",

  tag: "Cultural Expedition",
    },

    {
  slug: "of-valleys-and-warriors",
  title: "Of Valleys & Warriors",
  duration: "7D / 6N",
  location: "Nagaland",
  price: "Price On Request",
  image:
    "https://i.pinimg.com/736x/ee/45/d2/ee45d2c7c967e052583aac1817f70a76.jpg",
  blurb:
    "Walk through the Angami homeland of Nagaland, from the green village of Khonoma to the legendary Dzükoü Valley, discovering warrior histories, living traditions, and the quiet rhythm of the Naga hills.",

  tag: "Cultural Expedition",
    },

    {
  slug: "sikkim-darjeeling-himalayan-journey",
  title: "Sikkim & Darjeeling Himalayan Journey",
  duration: "10D / 9N",
  location: "Sikkim • West Bengal",
  price: "Price On Request",
  image:
    "https://i.pinimg.com/736x/18/0f/11/180f1155643c0d1209830523b3688164.jpg",
  blurb:
    "A journey through the Eastern Himalayas exploring the vibrant capital of Gangtok, the alpine beauty of Lachung and Yumthang Valley, the monasteries of Pelling, and the colonial charm of Darjeeling.",
  tag: "Himalayan Escape",
    },
  ]; */}

  const pillars = [
    {
      title: "Not tourist India. Real India.",
      text:
        "We handpick stays, routes, and experiences that feel human, rooted, and unforgettable — not generic, crowded, or mass-manufactured.",
    },
    {
      title: "Designed for people who want more from life.",
      text:
        "The right trip does not just help you unwind. It rearranges you. It reminds you how wonder feels. It brings you back fuller.",
    },
    {
      title: "Curated with trust, not clutter.",
      text:
        "Every itinerary is selected for story, soul, host quality, and discovery value — so you spend less time comparing and more time living.",
    },
  ];

  const stats = [
    { value: "100+", label: "offbeat stays and experiences being curated" },
    { value: "0%", label: "interest in boring, overdone travel" },
    { value: "1 life", label: "to stop postponing the journeys that matter" },
  ];

  const testimonials = [
    {
      quote:
        "I booked an Alibaug stay with Hoppity and had a fantastic experience. They helped us find a peaceful, off-beat place that wasn’t crowded. The stay was cozy, well maintained, close to the beach, and surrounded by great food options. For seamless trips to lesser-known destinations, I’d absolutely recommend Hoppity",
      author: "- Subhag Dholke",
      image: subhag,
      rating: 5,
    },
    {
      quote:
        "I usually travel very spontaneously and rarely plan ahead. During our Northeast trip, while heading to Sikkim, the Hoppity team helped us find a beautiful property just two hours before we arrived. The place was peaceful, surrounded by nature, and exactly what we needed after a long drive. What stood out most was how supportive and kind the team was even on such short notice. Truly grateful for making that part of our journey so memorable..",
      author: "- Pallavi Gondane",
      image: pallavi,
      rating: 5,
    },
    {
      quote:
        "Working with Hoppity has been a great experience as a creator. They gave me the freedom to present my art and travel storytelling in my own style, which made the process smooth and enjoyable. The team was supportive, clear with communication, and respectful of the creative process. For anyone passionate about creating travel content, Hoppity is definitely a platform worth exploring.",
      author: "- Divyansh Gupta",
      image: divyansh,
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f1ff] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.20),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.20),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-10">

          <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/75 px-5 py-3 backdrop-blur-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                <img src={logo} alt="" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Hoppity</p>
                <p className="text-xs text-slate-600 font-medium">Discover Real Travel</p>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex">
              <a href="#why" className="hover:text-violet-700 font-semibold">Why Hoppity</a>
              <a href="#catalog" className="hover:text-violet-700 font-semibold">Itineraries</a>
              <a href="#stories" className="hover:text-violet-700 font-semibold">Stories</a>
              <a href="#waitlist" className="hover:text-violet-700 font-semibold">Join Waitlist</a>
              <a href="https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I'm%20interested%20in%20this%20trip" target="_blank" rel="noopener noreferrer" className="hover:text-violet-700 font-semibold">Contact Us</a>
            </nav>
          </header>

          <div className="grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-800 shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-600" />
                For travellers who are done with overdone travel
              </div>
              <h1 className="max-w-3xl font-bold leading-[0.95] tracking-[-0.04em] text-slate-950 md:text-6xl">
                The trips you remember forever are rarely the ones everyone else is taking.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
                Hoppity helps you discover the hidden side of India — slow, soulful, unforgettable journeys through places with story, culture, silence, thrill, and meaning. Not just travel. A more vivid way to live.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#catalog"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5"
                >
                  Explore Itineraries
                </a>
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-white px-7 py-4 text-base font-semibold text-violet-800 shadow-sm transition hover:-translate-y-0.5"
                >
                  Join the Early Access List
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <span>Curated offbeat stays</span>
                <span>Authentic local experiences</span>
                <span>Designed for memory, not just content</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-10 hidden h-40 w-40 rounded-full bg-violet-300/30 blur-3xl lg:block" />
              <div className="absolute -right-6 bottom-0 hidden h-52 w-52 rounded-full bg-fuchsia-300/30 blur-3xl lg:block" />
              <div className="relative rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-2xl backdrop-blur-xl">
                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-violet-900 to-fuchsia-700 p-6 text-white shadow-xl">
                    <p className="text-sm uppercase tracking-[0.18em] text-violet-200">Why people choose Hoppity</p>
                    <p className="mt-4 text-2xl font-bold leading-tight">
                      Because ordinary trips make memories. Extraordinary trips change the person who comes back.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-[1.25rem] border border-violet-100 bg-[#fcfaff] p-4 shadow-sm">
                        <div className="text-2xl font-black tracking-tight text-slate-950">{stat.value}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">The quiet fear no one says out loud</p>
                    <p className="mt-3 text-base leading-7 text-slate-800">
                      That life will become a loop of tabs, traffic, deadlines, and familiar places — while the most magical corners of the world remain unseen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-700">A better reason to travel</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            You are not here to collect destinations. You are here to feel more alive.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Most travel platforms optimise for inventory. We optimise for wonder. For the trip that resets your nervous system, sparks your curiosity, and gives you stories that outlast the vacation.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pillars.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-violet-100 bg-white p-7 shadow-sm">
              <h3 className="text-xl font-bold tracking-tight text-slate-950">{item.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-700">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 lg:px-10 lg:py-10">
        <div className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl lg:px-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-300">The promise</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Find the version of travel that still has mystery left in it.
              </h2>
            </div>
            <div className="text-base leading-8 text-slate-300 md:text-lg">
              The hidden village. The host who cooks from memory. The winding road that becomes the highlight of the trip. The morning you wake up and think: this is exactly why I came. That is what Hoppity is built for.
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-700">Curated catalog</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Start with the itineraries that make ordinary weekends feel too small.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Each itinerary is chosen for emotional payoff, local depth, and brag-worthy uniqueness — the kind of trip your friends ask about for months.
            </p>
          </div>
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm"
          >
            Unlock first access
          </a>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trips.slice(0,6).map((trip) => (
//cards
            <Link to={`/itinerary/${trip.slug}`}
            key={trip.slug}
            className="group overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer">

              <div className="relative h-52 overflow-hidden text-white">

  {/* Trip Image */}
  <img
    src={trip.image[0]}
    className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-110"
  />

    {/* Dark Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
  {/* Content */}
  <div className="relative p-6">
    <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
      {trip.tag}
    </div>

    <div className="mt-14">
      <p className="text-sm uppercase tracking-[0.2em] text-violet-200">
        {trip.location}
      </p>

      <h3 className="mt-2 text-2xl font-bold leading-tight">
        {trip.title}
      </h3>
    </div>
  </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{trip.duration}</span>
                  <span className="font-semibold text-violet-700">{trip.price}</span>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-700">{trip.blurb}</p>
                <div className="mt-6 flex items-center justify-between">

                  <a href="" className="flex items-center gap-1 text-sm font-semibold text-slate-950 transition group-hover:text-violet-700">Explore
  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
</a>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    Small-group feel
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/itineraries"
            className="rounded-2xl bg-slate-950 px-8 py-4 text-white font-semibold shadow-lg hover:-translate-y-0.5 transition"
          >
            See All Itineraries →
          </Link>
        </div>
      </section>

{/* Reviews */}
      <section id="stories" className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-16">
  <div className="rounded-[2rem] border border-violet-100 bg-white p-8 shadow-sm lg:p-12">

    <div className="max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-700">
        What this unlocks
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
        Not escape. Expansion.
      </h2>

      <p className="mt-5 text-lg leading-8 text-slate-700">
        A great journey does not help you run away from life. It helps you return
        to life with more perspective, more courage, more gratitude, and more
        story in your bloodstream.
      </p>
    </div>

    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

      {testimonials.map((item) => (
        <div
          key={item.author}
          className="rounded-[1.75rem] bg-[#faf7ff] p-6 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
        >

          {/* User Info */}
          <div className="flex items-center gap-4 mb-4">

            <img
              src={item.image}
              alt={item.author}
              className="h-25 w-20 rounded-xl"
            />

            <div>
              <p className="font-semibold text-slate-900">{item.author}</p>
              <p className="text-sm text-slate-500">{item.location}</p>
            </div>

          </div>

          {/* Rating */}
          <div className="mb-3 text-yellow-500">
            {"⭐".repeat(item.rating)}
          </div>

          {/* Review */}
          <p className="text-base leading-7 text-slate-700">
            “{item.quote}”
          </p>

        </div>
      ))}

    </div>
  </div>
</section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-violet-100 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-700">Why now</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
              The world is not getting less crowded.
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-700">
              The hidden places will not stay hidden forever. The quiet stays will get discovered. The magical routes will get turned into listicles. The best time to experience the unexplored is before everyone else does.
            </p>
          </div>
          <div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-700 to-fuchsia-600 p-8 text-white shadow-xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-200">The feeling we’re selling</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
              One day you’ll either remember the trip you took — or the one you kept postponing.
            </h3>
            <p className="mt-4 text-base leading-8 text-violet-50">
              Choose the story. Choose the detour. Choose the road that gives something back.
            </p>
          </div>
        </div>
      </section>

      <section id="waitlist" className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-24">
        <div className="rounded-[2.25rem] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-800 p-8 text-white shadow-2xl lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-300">Early access</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-6xl">
                Be among the first to discover India before it gets over-discovered.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Join the Hoppity list for first access to curated itineraries, limited releases, community drops, and unforgettable journeys built for people who want a richer life, not just another booking confirmation.
              </p>
            </div>

{/* Early access form */}
            <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl">
              <div className="space-y-4">
                <div>

                  <label className="mb-2 block text-sm font-semibold">Full Name</label>
                  <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-violet-400"
                    placeholder="Your name"
                  />
                </div>
                <div>

                  <label className="mb-2 block text-sm font-semibold">Email Address</label>
                  <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-violet-400"
                    placeholder="you@example.com"
                  />

                  <label className="mb-2 block text-sm font-semibold mt-4">Contact Number</label>

<input
  name="contact"
  value={form.contact}
  onChange={handleChange}
  type="tel"
  pattern="[0-9]{10}"
  maxLength={10}
  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-violet-400"
  placeholder="Your phone number"
/>

                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Dream Destination</label>
                  <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-violet-400"
                    placeholder="Ladakh, Meghalaya, Konkan..."
                  />
                </div>

                <button
                type="submit"
                className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-white shadow-xl transition hover:-translate-y-0.5 cursor-pointer">
                  Get First Access
                </button>
                
                <p className="text-sm leading-6 text-slate-500">
                  No spam. Just irresistible journeys, early drops, and the occasional reminder that life is too short for generic travel.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
        <div className="flex flex-col gap-4 border-t border-violet-100 pt-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="font-semibold text-slate-900">Hoppity</span> — Discover Real Travel
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="#catalog" className="hover:text-violet-700">Catalog</a>
            <a href="#why" className="hover:text-violet-700">Why Hoppity</a>
            <a href="#waitlist" className="hover:text-violet-700">Join Early Access</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

