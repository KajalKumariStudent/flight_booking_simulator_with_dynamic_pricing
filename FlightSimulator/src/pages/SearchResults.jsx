import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchFlights } from "../api/api";
import FlightCard from "../ui/FlightCard";

export default function SearchResults() {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state || { from: "", to: "", date: "" };
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

        console.log("✅ Backend returned:", data);

        // No renaming — use backend fields directly
        if (mounted) setFlights(data);
      } catch (e) {
        console.error("❌ Error fetching flights:", e);
        setError(e.message || "Failed to load flights");
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
    nav(`/seat-selection/${flight.flight_id}`, { state: { flight } });
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Flights: {state.from} → {state.to}
          </h2>
          <p className="text-slate-500">
            Showing results {loading ? "(loading...)" : ""}
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

        {flights.map((flight) => (
          <FlightCard
            key={flight.flight_id}
            flight={flight}
            onBook={() => goToSelect(flight)}
          />
        ))}
      </div>
    </div>
  );
}
