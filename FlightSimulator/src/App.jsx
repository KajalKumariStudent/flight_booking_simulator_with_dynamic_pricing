import React from 'react'
import './App.css'
import { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import SeatSelection from './pages/SeatSelection'
import Payment from './pages/Payment'
import Confirmation from './pages/Confirmation'
import MyBookings from './pages/MyBookings'
import Header from './components/Header'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  const [passenger, setPassenger] = useState(null);

   useEffect(() => {
    const storedId = localStorage.getItem("passenger_id");
    const storedName = localStorage.getItem("full_name");
    const storedEmail = localStorage.getItem("email");
    if (storedId) {
      setPassenger({
        passenger_id: storedId,
        full_name: storedName,
        email: storedEmail,
      });
    }
  }, []);

  // ✅ Handle login callback
  const handleLogin = (data) => {
    setPassenger(data);
    localStorage.setItem("passenger_id", data.passenger_id);
    localStorage.setItem("full_name", data.full_name);
    localStorage.setItem("email", data.email);
  };
  //console.log("Current Passenger:", passenger);
  return (
    <>
      <div className="min-h-screen bg-white">
      <Header passenger={passenger} setPassenger={setPassenger}/>
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home passenger={passenger}/>} />
          <Route path="/search" element={<SearchResults passenger={passenger}/>} />
          <Route path="/seat-selection/:flightId" element={<SeatSelection passenger={passenger}/>} />
          <Route path="/payment/:bookingId" element={<Payment passenger={passenger}/>} />
          <Route path="/confirmation/:pnr" element={<Confirmation passenger={passenger}/>} />
          <Route path="/bookings" element={<MyBookings passenger={passenger}/>} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        </Routes>
      </main>
    </div>
    </>
  )
}

export default App
