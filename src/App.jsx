import React from 'react'
import LandingPage from './Pages/Landing'
import Itinerary from './Pages/Itinerary'
import Itineraries from './Pages/Itineraries'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/itinerary/:slug" element={<Itinerary />} />
        <Route path="/itineraries" element={<Itineraries />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


