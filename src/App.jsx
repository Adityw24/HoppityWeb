import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import LandingPage   from './Pages/Landing'
import Itinerary     from './Pages/Itinerary'
import Itineraries   from './Pages/Itineraries'
import AuthPage      from './Pages/Auth'
import SearchPage    from './Pages/Search'
import BookingPage   from './Pages/Booking'
import ProfilePage   from './Pages/Profile'
import BlogPage      from './Pages/Blog'
import BlogPostPage    from './Pages/BlogPost'
import BlogComposePage from './Pages/BlogCompose'
import HubPage       from './Pages/Hub'
import ForYouPage    from './Pages/ForYou'
import ContactPage   from './Pages/Contact'
import AboutPage     from './Pages/About'
import FloatingActions from './components/FloatingActions'
import Privacy from './Pages/Privacy'

const TRACKING_ID = 'G-2Q8G6TX2EE'

const AnalyticsTracker = () => {
  const location = useLocation()
  React.useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('config', TRACKING_ID, {
      page_path: `${location.pathname}${location.search}${location.hash}`,
    })
  }, [location])
  return null
}

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AnalyticsTracker />
      <FloatingActions />
      <Routes>
        <Route path="/"                 element={<LandingPage />} />
        <Route path="/itinerary/:slug"  element={<Itinerary />} />
        <Route path="/itineraries"      element={<Itineraries />} />
        <Route path="/auth"             element={<AuthPage />} />
        <Route path="/search"           element={<SearchPage />} />
        <Route path="/booking/:slug"    element={<BookingPage />} />
        <Route path="/profile"          element={<ProfilePage />} />
        <Route path="/privacy"          element={<Privacy />} />
        <Route path="/blog"              element={<BlogPage />} />
        <Route path="/blog/:slug"        element={<BlogPostPage />} />
        <Route path="/write"             element={<BlogComposePage />} />
        <Route path="/write/:id"         element={<BlogComposePage />} />
        <Route path="/hub"               element={<HubPage />} />
        <Route path="/for-you"           element={<ForYouPage />} />
        <Route path="/contact"           element={<ContactPage />} />
        <Route path="/about"             element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
