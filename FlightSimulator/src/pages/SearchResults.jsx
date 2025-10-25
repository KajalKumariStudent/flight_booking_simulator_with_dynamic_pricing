import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchFlights } from "../api/api";
import FlightCard from "../ui/FlightCard";

export default function SearchResults() {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state || { from: "", to: "" };
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchFlights() {
      setLoading(true);
      setError(null);
      try {
        const travelDate = state.date || new Date().toISOString().split("T")[0];
        const data = await searchFlights(state.from, state.to, travelDate);

        console.log("Backend returned:", data);

        // ✅ Normalize backend fields to match FlightCard props
        const formatted = data.map((f) => ({
          id: f.flight_id,
          airline: f.airline_id ? `Airline ${f.airline_id}` : "Unknown Airline",
          flightNo: f.flight_number,
          from: state.from || "DEL",
          to: state.to || "BOM",
          depart: new Date(f.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          arrive: new Date(f.arrival_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: "", // optional
          seatsLeft: f.available_seats,
          totalSeats: f.total_seats,
          baseFare: f.base_fare,
          dynamicPrice: f.dynamic_price,
        }));

        if (mounted) setFlights(formatted);
      } catch (e) {
        console.error(e);
        setError(e.message);
        setFlights([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFlights();
    return () => {
      mounted = false;
    };
  }, [state]);

  function goToSelect(flight) {
    nav(`/select-seat/${flight.id}`, { state: { flight } });
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Flights: {state.from} → {state.to}
          </h2>
          <p className="text-slate-500">
            Showing results {loading ? " (loading...)" : ""}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 text-sm text-red-600">
          Failed to fetch from backend: {error}
        </div>
      )}

      <div className="space-y-4">
        {!loading && flights.length === 0 && (
          <div className="text-slate-500">
            No flights found for the selected route and date.
          </div>
        )}

        {flights.map((f) => (
          <FlightCard key={f.id} flight={f} onBook={() => goToSelect(f)} />
        ))}
      </div>
    </div>
  );
}
