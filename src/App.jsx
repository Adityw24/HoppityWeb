import React from 'react'
import LandingPage from './Pages/Landing'
import Itinerary from './Pages/Itinerary'
import Itineraries from './Pages/Itineraries'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App


