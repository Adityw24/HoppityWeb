import React from 'react'
import logo from '../assets/logo1.png'

export default function Navbar() {
  return (
    <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/75 px-5 py-3 backdrop-blur-xl shadow-sm fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50">
      
      {/* Logo + Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
          <img src={logo} alt="Hoppity Logo" />
        </div>

        <div>
          <p className="text-lg font-semibold tracking-tight">Hoppity</p>
          <p className="text-xs text-slate-600 font-medium">
            Discover Real Travel
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex">
        <a href="#why" className="hover:text-violet-700 font-semibold">
          Why Hoppity
        </a>

        <a href="#catalog" className="hover:text-violet-700 font-semibold">
          Itineraries
        </a>

        <a href="#stories" className="hover:text-violet-700 font-semibold">
          Stories
        </a>

        <a href="#waitlist" className="hover:text-violet-700 font-semibold">
          Join Waitlist
        </a>

        <a
          href="https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I'm%20interested%20in%20this%20trip"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-violet-700 font-semibold"
        >
          Contact Us
        </a>
      </nav>
    </header>
  );
}