import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import LandingPage   from './Pages/Landing'
import Itinerary     from './Pages/Itinerary'
import Itineraries   from './Pages/Itineraries'
import ItineraryForm from './Pages/ItineraryForm'
import BookingPage from './Pages/Booking'
import AuthPage      from './Pages/Auth'
import SearchPage    from './Pages/Search'
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
import CheckoutPage from './Pages/Checkout'
import Navbar from './components/Navbar'
import PropertiesPage from './Pages/Properties'
import BudgetStaysPage from './Pages/BudgetStays'
import FlagshipStaysPage from './Pages/FlagshipStays'
import SignatureStaysPage from './Pages/SignatureStays'
import SignatureProperty from './Pages/SignatureProperty'
import BudgetProperty from './Pages/BudgetPropertyPage'
import FlagshipProperty from './Pages/FlagshipProperty'
import SettingsPage from './Pages/AccountsSettings'
import Stays from './Pages/Stays'
import Download from './Pages/Download'
import Partner from './Pages/PartnerApply'
import PropertyApplication from './Pages/PropertyApplication'
import Discover from './Pages/Discover'

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
        <Route path="/itineraries/new" element={<ItineraryForm />} />
        <Route path="/itineraries/:id/edit" element={<ItineraryForm />} />
        <Route path="/booking/:slug" element={<BookingPage />} />
        <Route path="/auth"             element={<AuthPage />} />
        <Route path="/search"           element={<SearchPage />} />
        <Route path="/checkout/:slug"    element={<CheckoutPage />} />
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
        <Route path="/properties"        element={<PropertiesPage />} />
        <Route path="/stays/budget"      element={<BudgetStaysPage />} />
        <Route path="/stays/flagship"     element={<FlagshipStaysPage />} />
        <Route path="/stays/signature"   element={<SignatureStaysPage />} />
        <Route path="/stays/:slug"   element={<SignatureProperty />} />
        <Route path="/stays/budget/:slug"   element={<BudgetProperty />} />
        <Route path="/stays/flagship/:slug"   element={<FlagshipProperty />} />
        <Route path ="/settings" element={<SettingsPage />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/download" element={<Download />} />
        <Route path="/partner" element={<Partner />} />
        <Route path="/property-application" element={<PropertyApplication />} />
        <Route path="/discover" element={<Discover />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
