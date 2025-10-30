import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = "http://127.0.0.1:8000"; // adjust if needed

export default function Home() {
  const nav = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [trip, setTrip] = useState("oneway");
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    // fetch airport list from backend
    fetch(`${BACKEND}/airports`)
      .then((res) => res.json())
      .then((data) => setAirports(data))
      .catch((err) => console.error("Failed to load airports:", err));
  }, []);

  function submit(e) {
    e.preventDefault();
    if (!from || !to || from === to) {
      alert("Please select different origin and destination cities.");
      return;
    }
    nav("/search", { state: { from, to, date, trip } });
  }

  return (
    <div className="grid grid-cols-12 gap-8 min-h-screen white p-6">
      {/* Main Form Section */}
      <section className="col-span-12 lg:col-span-7">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h1 className="text-3xl font-extrabold text-blue-600 mb-4">
            Book your flight with real-time pricing simulation
          </h1>
          <p className="text-blue-600 mb-6 text-lg">
            Search flights, select seats, and simulate dynamic fare changes.
          </p>

          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* From Dropdown */}
            <div>
              <label className="block text-sm font-medium text-blue-600">From</label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full border border-blue-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              >
                <option value="">Select origin city</option>
                {airports.map((a) => (
                  <option key={a.airport_id} value={a.city}>
                    {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* To Dropdown */}
            <div>
              <label className="block text-sm font-medium text-blue-600">To</label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full border border-blue-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              >
                <option value="">Select destination city</option>
                {airports.map((a) => (
                  <option key={a.airport_id} value={a.city}>
                    {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-sm font-medium text-blue-600">Departure</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full border border-blue-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              />
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-sm font-medium text-blue-600">Trip type</label>
              <select
                value={trip}
                onChange={(e) => setTrip(e.target.value)}
                className="mt-1 w-full border border-blue-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              >
                <option value="oneway">One-way</option>
                <option value="round">Round-trip</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="col-span-1 sm:col-span-2 mt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:-translate-y-0.5"
              >
                Search Flights
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Sidebar Section */}
      <aside className="col-span-12 lg:col-span-5">
        <div className="bg-white rounded-2xl shadow p-6 border border-blue-600">
          <h3 className="font-bold text-xl mb-3 text-blue-600">Why FlightSim?</h3>
          <ul className="text-blue-600 text-base space-y-2 list-disc list-inside">
            <li>Dynamic pricing simulation based on seat availability and time-to-departure.</li>
            <li>Simulate concurrent bookings and FAKE inventory constraints.</li>
            <li>Learn transactional booking flows and PNR generation.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
