import React from 'react'
import LandingPage from './Pages/Landing'
import Itinerary from './Pages/Itinerary'
import Itineraries from './Pages/Itineraries'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import PrivacyPolicy from './Pages/Privacy'
import DeleteAccount from './Pages/DeleteAccount'
import About from './Pages/About'
import Contact from './Pages/Contact'
import Blog from './Pages/Blog'

const TRACKING_ID = 'G-2Q8G6TX2EE'

const AnalyticsTracker = () => {
  const location = useLocation()

  React.useEffect(() => {
    if (typeof window.gtag !== 'function') {
      return
    }

    const pagePath = `${location.pathname}${location.search}${location.hash}`

    window.gtag('config', TRACKING_ID, {
      page_path: pagePath,
    })
  }, [location])

  return null
}

const App = () => {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/itinerary/:slug" element={<Itinerary />} />
        <Route path="/itineraries" element={<Itineraries />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/deletemyaccount" element={<DeleteAccount />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blogs" element={<Blog />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App


