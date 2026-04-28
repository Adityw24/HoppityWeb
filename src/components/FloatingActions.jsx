import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUp, Home } from 'lucide-react'

export default function FloatingActions() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setVisible(y > 320)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Don't show on auth page - would clutter the login form
  if (location.pathname === '/auth') return null

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className={`fixed bottom-6 right-5 z-50 flex flex-col gap-2.5 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        title="Back to top"
        className="group w-11 h-11 rounded-xl bg-white border border-violet-200 shadow-lg hover:-translate-y-0.5 hover:shadow-violet-200/60  hover:bg-violet-50 transition-all duration-200 flex items-center justify-center cursor-pointer"
      >
        <ArrowUp className="w-4 h-4 text-violet-600 transition-transform duration-200 group-hover:-translate-y-0.5" />
      </button>

      {/* Go home */}
      <Link
        to="/"
        title="Go home"
        className="group w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 transition-all duration-200 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#f7f1ff]"
      >
        <Home className="w-4 h-4 text-white transition-transform duration-200 group-hover:scale-110" />
      </Link>
    </div>
  )
}
