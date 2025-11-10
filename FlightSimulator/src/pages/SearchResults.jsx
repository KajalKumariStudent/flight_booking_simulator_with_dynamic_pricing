import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchFlights } from "../api/api";
import FlightCard from "../ui/FlightCard";

export default function SearchResults() {
  const location = useLocation();
  const nav = useNavigate();
  const state = location.state || { from: "", to: "", date: "", returnDate: "", trip: "oneway", passengers: 1 };

  const [flights, setFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOnward, setSelectedOnward] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchFlights() {
      setLoading(true);
      setError(null);

      try {
        const travelDate = state.date || new Date().toISOString().split("T")[0];
        const data = await searchFlights(state.from, state.to, travelDate);
        if (mounted) setFlights(data || []);

        if (state.trip === "round" && state.returnDate) {
          const returnData = await searchFlights(state.to, state.from, state.returnDate);
          if (mounted) setReturnFlights(returnData || []);
        }
      } catch (e) {
        console.error("❌ Error fetching flights:", e);
        setError(e.message || "Failed to load flights");
        setFlights([]);
        setReturnFlights([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFlights();
    return () => {
      mounted = false;
    };
  }, [state]);

  function handleSelect(flight, type) {
    if (type === "onward") {
      setSelectedOnward(flight);
      setTimeout(() => {
        const returnSection = document.getElementById("return-flights");
        if (returnSection) returnSection.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      setSelectedReturn(flight);
    }
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

      {/* Onward Flights */}
      <div className="space-y-4">
        {!loading && flights.length === 0 && (
          <div className="text-slate-500">
            No flights found for the selected route and date.
          </div>
        )}

        {flights.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-blue-600 mb-2">
              Onward Flights ({state.from} → {state.to})
            </h3>
            {flights.map((flight) => (
              <FlightCard
                key={flight.flight_id}
                flight={flight}
                onPassengerInfo={() => {
                  if (state.trip === "oneway") {
                    // 🚀 For one-way trip → navigate immediately
                    nav(`/passenger-info/${flight.flight_id}`, {
                      state: {
                        flight,
                        trip: state.trip,
                        from: state.from,
                        to: state.to,
                        date: state.date,
                      },
                    });
                  } else {
                    // 🔁 For round-trip → mark as selected
                    handleSelect(flight, "onward");
                  }
                }}
                isSelected={selectedOnward?.flight_id === flight.flight_id}
              />
            ))}
          </>
        )}
      </div>

      {/* Return Flights */}
      {state.trip === "round" && (
        <div id="return-flights" className="space-y-4 mt-10">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">
            Return Flights ({state.to} → {state.from})
          </h3>

          {!loading && returnFlights.length === 0 && (
            <div className="text-slate-500">
              No return flights found for the selected date.
            </div>
          )}

          {returnFlights.map((flight) => (
            <FlightCard
              key={flight.flight_id}
              flight={flight}
              onPassengerInfo={() => handleSelect(flight, "return")}
              isSelected={selectedReturn?.flight_id === flight.flight_id}
            />
          ))}
        </div>
      )}

      {/* Continue Button */}
      {state.trip === "round" && (
        <div className="mt-10 text-center">
          <button
            disabled={!selectedOnward || !selectedReturn}
            onClick={() =>
              nav(`/passenger-info/${selectedOnward.flight_id}`, {
                state: {
                  flight: selectedOnward,
                  returnFlight: selectedReturn,
                  trip: state.trip,
                  from: state.from,
                  to: state.to,
                  date: state.date,
                  returnDate: state.returnDate,
                },
              })
            }
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              selectedOnward && selectedReturn
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {!selectedOnward
              ? "Select an Onward Flight"
              : !selectedReturn
              ? "Select a Return Flight"
              : "Continue with Selected Flights"}
          </button>
        </div>
      )}
    </div>
  );
}
