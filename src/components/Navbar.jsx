import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, User, LogOut, Menu, X, Sparkles, PenSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo1.png'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/90 px-5 py-3 backdrop-blur-xl shadow-sm fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50">

      <Link to="/" className="flex items-center gap-3 flex-shrink-0">
        <img src={logo} alt="Hoppity" className="h-10 w-10" />
        <div>
          <p className="text-lg font-semibold tracking-tight leading-none">Hoppity</p>
          <p className="text-xs text-slate-500 font-medium">Discover Real India</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-5 text-sm text-slate-700 md:flex">
        <Link to="/itineraries" className="hover:text-violet-700 font-semibold">Itineraries</Link>
        <Link to="/about" className="hover:text-violet-700 font-semibold">About Us</Link>
        <Link to="/blog" className="hover:text-violet-700 font-semibold">Blog</Link>
        <Link to="/for-you" className="hover:text-violet-700 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />For You
        </Link>
        <Link to="/contact" className="hover:text-violet-700 font-semibold">Contact</Link>
      </nav>

      <div className="flex items-center gap-2">
        <Link to="/search"
          className="hidden md:flex items-center gap-1.5 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition">
          <Search className="w-3.5 h-3.5" /><span>Search</span>
        </Link>
        <Link to="/search?mode=ai"
          className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-full px-3 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition">
          <Sparkles className="w-3.5 h-3.5" /><span>Ask AI</span>
        </Link>
        {user && (
          <Link to="/write"
            className="hidden md:flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-3 py-2 text-sm font-semibold transition">
            <PenSquare className="w-3.5 h-3.5" /><span>Write</span>
          </Link>
        )}
        {user ? (
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 pl-2 pr-3 py-1.5 text-sm font-semibold text-violet-700 cursor-pointer hover:bg-violet-100 transition">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">{initials}</div>
              {displayName.split(' ')[0]}
            </button>
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-violet-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700"><User className="w-3.5 h-3.5" /> My Profile</Link>
              <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Sign Out</button>
            </div>
          </div>
        ) : (
          <Link to="/auth" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 transition">Sign In</Link>
        )}
        <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-4 space-y-1 md:hidden">
          {[
            { to: '/itineraries', label: '🗺️ Itineraries' },
            { to: '/about',       label: '🌿 About Us' },
            { to: '/blog',        label: '📝 Blog' },
            { to: '/for-you',     label: '⭐ For You' },
            { to: '/contact',     label: '💬 Contact' },
            { to: '/search',      label: '🔍 Search' },
            { to: '/search?mode=ai', label: '✨ Ask AI' },
            { to: '/hub',         label: '📖 Stories' },
            { to: '/write',       label: '✍️ Write a Story' },
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition">{item.label}</Link>
          ))}
          <div className="border-t border-slate-100 pt-2">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition">👤 My Profile</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer">Sign Out</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold bg-violet-700 text-white text-center hover:bg-violet-800 transition">Sign In / Sign Up</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
