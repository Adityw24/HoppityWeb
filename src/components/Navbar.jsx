import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, User, LogOut, Menu, X, Sparkles, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import logo from '../assets/logo1.png'

/* Routes that open with a full-bleed dark hero get a transparent bar with
   white type until the page scrolls. The landing page is light again, so the
   list is empty — add a path here if you build a dark-hero page. */
const HERO_ROUTES = []

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const accountRef = useRef(null)
  const searchInputRef = useRef(null)

  const overHero = HERO_ROUTES.includes(pathname) && !scrolled && !menuOpen
  const solid = !overHero

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the account menu on outside click or Escape — a hover-only menu is
  // unreachable by tap and by keyboard.
  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setAccountOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  useEffect(() => { if (searchOpen) searchInputRef.current?.focus() }, [searchOpen])
  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
    setAccountOpen(false)
  }

  const submitSearch = (e) => {
    e?.preventDefault?.()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    setSearchOpen(false)
    setMenuOpen(false)
    setQuery('')
  }

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Account'
  const initials = displayName.slice(0, 2).toUpperCase()
  const avatarUrl = !imgFailed ? profile?.profile_pic : null

  const Avatar = ({ size = 'w-6 h-6', text = 'text-xs' }) => (
    <div className={`${size} rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white ${text} font-black flex-shrink-0`}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
        : initials}
    </div>
  )

  const NAV_LINKS = [
    { to: '/itineraries', label: 'Itineraries' },
    { to: '/stays',       label: 'Stays' },
    { to: '/about',       label: 'About' },
    { to: '/blog',        label: 'Blog' },
    { to: '/for-you',     label: 'For You', icon: Sparkles },
    { to: '/contact',     label: 'Contact' },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        solid
          ? 'bg-white/95 shadow-sm shadow-violet-950/5 supports-[backdrop-filter]:bg-white/80 backdrop-blur-xl backdrop-saturate-150'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-14">

        <Link to="/" className="flex flex-shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <img src={logo} alt="Hoppity" className="h-9 w-9 sm:h-10 sm:w-10" />
          <div className="min-w-0">
            <p className={`text-base font-black leading-none tracking-tight sm:text-lg ${solid ? 'text-slate-950' : 'text-white'}`}>Hoppity</p>
            {/* Tagline only from sm up — on phones the bar also carries Sign In and the menu button */}
            <p className={`mt-0.5  text-[11px] font-medium sm:block ${solid ? 'text-slate-500' : 'text-white/70'}`}>Discover Real India</p>
          </div>
        </Link>

        {/* Centre: the nav pill, or the search field once it's opened */}
        {searchOpen ? (
          <form onSubmit={submitSearch} className="mx-4 hidden max-w-lg flex-1 items-center gap-2 md:flex">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${solid ? 'text-slate-400' : 'text-white/70'}`} />
              <input
                ref={searchInputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') setSearchOpen(false) }}
                placeholder="Where do you want to go?"
                aria-label="Search trips and stays"
                className={`w-full rounded-full py-2.5 pl-10 pr-4 text-sm outline-none transition ${
                  solid
                    ? 'bg-slate-100 text-slate-900 ring-1 ring-violet-200 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-400'
                    : 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur placeholder:text-white/60 focus:ring-2 focus:ring-white/60'
                }`}
              />
            </div>
            <button type="submit" className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 cursor-pointer">
              Search
            </button>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"
              className={`rounded-full p-2 transition cursor-pointer ${solid ? 'text-slate-500 hover:bg-slate-100' : 'text-white/80 hover:bg-white/15'}`}>
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <nav className={`hidden items-center gap-1 rounded-full p-1.5 ring-1 backdrop-blur md:flex ${
            solid ? 'bg-slate-100/80 ring-violet-100' : 'bg-white/12 ring-white/25'
          }`}>
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                    active
                      ? 'bg-white text-violet-800 shadow-sm'
                      : solid ? 'text-slate-700 hover:bg-white hover:text-violet-700' : 'text-white/85 hover:bg-white/20 hover:text-white'
                  }`}>
                  {Icon && <Icon className="h-3 w-3" />}{label}
                </Link>
              )
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!searchOpen && (
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search"
              className={`hidden h-10 w-10 place-items-center rounded-full ring-1 transition cursor-pointer md:grid ${
                solid
                  ? 'bg-slate-100 text-slate-600 ring-violet-100 hover:bg-violet-100 hover:text-violet-700'
                  : 'bg-white/12 text-white ring-white/25 backdrop-blur hover:bg-white/25'
              }`}>
              <Search className="h-4 w-4" />
            </button>
          )}

          <Link to="/search?mode=ai"
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md lg:flex">
            <Sparkles className="h-3.5 w-3.5" /> Ask AI
          </Link>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-bold ring-1 transition cursor-pointer ${
                  solid
                    ? 'bg-violet-50 text-violet-700 ring-violet-200 hover:bg-violet-100'
                    : 'bg-white/12 text-white ring-white/25 backdrop-blur hover:bg-white/25'
                }`}
              >
                <Avatar size="w-7 h-7" />
                <span className="hidden sm:inline">{displayName.split(' ')[0]}</span>
              </button>
              {accountOpen && (
                <div role="menu"
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-violet-100 bg-white/95 py-2 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-white/90">
                  <Link to="/profile" onClick={() => setAccountOpen(false)} role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700">
                    <User className="h-3.5 w-3.5" /> My Profile
                  </Link>
                  <Link to="/settings" onClick={() => setAccountOpen(false)} role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700">
                    <Settings className="h-3.5 w-3.5" /> Account Settings
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button onClick={handleSignOut} role="menuitem"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth"
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                solid ? 'bg-slate-950 text-white hover:bg-violet-800' : 'bg-white text-slate-950 hover:bg-violet-50'
              }`}>
              Sign In
            </Link>
          )}

          <button
            className={`grid h-10 w-10 place-items-center rounded-full ring-1 transition cursor-pointer md:hidden ${
              solid ? 'bg-slate-100 text-slate-700 ring-violet-100' : 'bg-white/15 text-white ring-white/25 backdrop-blur'
            }`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-4 mb-3 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-2xl supports-[backdrop-filter]:bg-white/90 md:hidden">
          {/* Search first — fastest way into the catalogue on a phone */}
          <form onSubmit={submitSearch} className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search trips and stays"
                aria-label="Search trips and stays"
                className="w-full rounded-xl border border-violet-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <button type="submit" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white cursor-pointer">
              Go
            </button>
          </form>

          <div className="space-y-1">
            {[
              { to: '/itineraries', label: '🗺️ Itineraries' },
              { to: '/stays',       label: '🏡 Stays' },
              { to: '/about',       label: '🌿 About Us' },
              { to: '/blog',        label: '📝 Blog' },
              { to: '/for-you',     label: '⭐ For You' },
              { to: '/contact',     label: '💬 Contact' },
              { to: '/search?mode=ai', label: '✨ Ask AI' },
              { to: '/hub',         label: '📖 Stories' },
              { to: '/write',       label: '✍️ Write a Story' },
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-2">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                  <Avatar size="w-7 h-7" text="text-[11px]" /> My Profile
                </Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                  <Settings className="h-4 w-4" /> Account Settings
                </Link>
                <button onClick={handleSignOut}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 cursor-pointer">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)}
                className="block rounded-xl bg-violet-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-800">
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}