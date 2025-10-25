import React from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import SeatSelection from './pages/SeatSelection'
import Payment from './pages/Payment'
import Confirmation from './pages/Confirmation'
import MyBookings from './pages/MyBookings'
import Header from './components/Header'

function App() {

  return (
    <>
      <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/select-seat/:flightId" element={<SeatSelection />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
          <Route path="/confirmation/:pnr" element={<Confirmation />} />
          <Route path="/bookings" element={<MyBookings />} />
        </Routes>
      </main>
    </div>
    </>
  )
}

export default App
