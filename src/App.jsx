import React from 'react'
import LandingPage from './Pages/Landing'
import Itinerary from './Pages/Itinerary'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/itinerary/:slug" element={<Itinerary />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


