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
        <Route path="/privacy"          element={<PrivacyPage />} />
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

// Simple inline privacy policy page
function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f7f1ff] px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
      <div className="bg-white rounded-3xl border border-violet-100 p-8 space-y-6 text-slate-700 leading-8">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">What we collect</h2>
          <p>We collect your name, email address, and phone number when you create an account. We collect booking information (tour selections, dates, group size) when you make a reservation. We also collect usage data such as search queries to improve our recommendations.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">How we use it</h2>
          <p>Your information is used to manage bookings, send confirmation emails, and provide customer support. We do not sell your data to third parties. We use Supabase for data storage (with servers in ap-south-1) and Razorpay for payment processing.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your rights</h2>
          <p>You may request deletion of your account and associated data at any time by contacting us at <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline">sales@hoppity.in</a> or via WhatsApp.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Contact</h2>
          <p>For any privacy concerns, contact us at <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline">sales@hoppity.in</a></p>
        </section>
        <p className="text-sm text-slate-400">Last updated: March 2026</p>
      </div>
    </div>
  )
}

export default App
