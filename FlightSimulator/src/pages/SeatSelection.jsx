import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getSeats, bookFlight } from "../api/api";

//
// 🪑 Individual Seat Component
//
function Seat({ seatId, status, selected, onClick, seatType, tooltip }) {
  const base =
    "w-10 h-10 flex items-center justify-center rounded cursor-pointer text-xs font-semibold border transition relative";
  let classes = "";

  // 🎨 Colors for seat types
  const colors = {
    BUSINESS: "bg-yellow-50 border-yellow-400 hover:bg-yellow-100",
    ECONOMY: "bg-white border-gray-300 hover:bg-blue-100",
    LEGROOM: "bg-green-50 border-green-400 hover:bg-green-100",
  };

  if (status === "unavailable") {
    classes = `${base} bg-gray-300 text-gray-400 border-gray-200 cursor-not-allowed`;
  } else if (selected) {
    classes = `${base} bg-blue-600 text-white border-blue-700`;
  } else {
    classes = `${base} ${colors[seatType] || colors.ECONOMY}`;
  }

  return (
    <div
      className={classes}
      onClick={() => status === "available" && onClick(seatId, seatType)}
      title={tooltip}
    >
      {seatId}
    </div>
  );
}

//
// ✈️ Main Seat Selection Component
//
export default function SeatSelection({ passenger }) {
  const { flightId } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const flight = location.state?.flight;

  const [unavailable, setUnavailable] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //
  // 🧭 Fetch seat availability from backend
  //
  useEffect(() => {
    let mounted = true;
    async function fetchSeats() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSeats(flightId);
        if (mounted)
          setUnavailable(
            new Set(data.unavailableSeats || data.unavailable || [])
          );
      } catch (e) {
        setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSeats();
    return () => {
      mounted = false;
    };
  }, [flightId]);

  //
  // 🎟️ Toggle seat selection
  //
  function toggle(seat, seatType) {
    if (unavailable.has(seat)) return;
    setSelectedType(seatType);
    setSelected((prev) => (prev.includes(seat) ? [] : [seat]));
  }

  //
  // 💳 Continue to Payment
  //
 async function continueToPayment() {
  if (!passenger || !passenger.passenger_id) {
    alert("You must login or signup before booking a seat.");
    nav("/login");
    return;
  }

  if (!selected.length) {
    alert("Please select a seat to continue.");
    return;
  }
  const fare = Number.isFinite(finalFare) ? finalFare : flight.base_fare;
  try {
    const payload = {
      flight_id: flight.flight_id,
      passenger_id: passenger.passenger_id,
      seat_no: String(selected[0]),
      fare_paid: fare,
    };

    const booking = await bookFlight(payload);

    // ✅ Pass both booking and flight objects here
    nav(`/payment/${booking.booking_id}`, {
      state: {
        booking: {
          ...booking,
          seat_no: selected[0],
          total: finalFare,
          passenger_id: passenger.passenger_id,
          // 👇 flatten flight details into booking itself
          airline_name: flight.airline_name,
          flight_number: flight.flight_number,
          source: flight.source_airport,
          destination: flight.destination_airport,
          flight, // 👈 this ensures flight data is available in Payment.jsx
        },
      },
    });
  } catch (err) {
    alert("Booking failed: " + err.message);
  }
}

  //
  // 📊 Dynamic Pricing Calculation
  //
  const seatDemand =
    flight && flight.total_seats
      ? (1 - flight.available_seats / flight.total_seats) * 100
      : 0;

  const timeLeft = flight
    ? (new Date(flight.departure_time) - new Date()) / (1000 * 60 * 60)
    : null;

  // 💰 Price factors per class
  const priceFactor =
    selectedType === "BUSINESS"
      ? 1.5
      : selectedType === "LEGROOM"
      ? 1.2
      : 1.0;

  const finalFare = flight
    ? (flight.dynamic_price || flight.base_fare) * priceFactor
    : 0;

  //
  // 🪑 Seat Layout Configuration
  //
  const rows = 12;
  const leftSide = ["A", "B"];
  const rightSide = ["C", "D", "E", "F"];
  const legroomRows = [10]; // row 10 = extra legroom
  const businessRows = [1, 2]; // first two rows business

  //
  // 🧩 JSX Rendering
  //
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ==== Seat Map Section ==== */}
      <section className="col-span-2 bg-gray-50 p-6 rounded-lg shadow">
        <h3 className="text-2xl text-blue-600 font-semibold mb-4">
          Select Your Seat — Flight {flight?.flight_number || flightId}
        </h3>

        {loading && <p className="text-gray-500">Loading seat map...</p>}
        {error && (
          <p className="text-amber-600">
            {error}. Showing demo layout instead.
          </p>
        )}

        {/* Seat Map Layout */}
        <div className="flex flex-col gap-3 mt-6 items-center">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1;
            const seatType = businessRows.includes(rowNum)
              ? "BUSINESS"
              : legroomRows.includes(rowNum)
              ? "LEGROOM"
              : "ECONOMY";

            return (
              <div key={rowNum} className="flex items-center gap-3">
                {/* Left seats */}
                <div className="flex gap-2">
                  {leftSide.map((col) => {
                    const id = `${rowNum}${col}`;
                    const status = unavailable.has(id)
                      ? "unavailable"
                      : "available";
                    return (
                      <Seat
                        key={id}
                        seatId={id}
                        status={status}
                        selected={selected.includes(id)}
                        seatType={seatType}
                        onClick={toggle}
                        tooltip={`${seatType} Seat ${
                          status === "unavailable" ? "(Booked)" : ""
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Aisle */}
                <div className="w-8" />

                {/* Right seats */}
                <div className="flex gap-2">
                  {rightSide.map((col) => {
                    const id = `${rowNum}${col}`;
                    const status = unavailable.has(id)
                      ? "unavailable"
                      : "available";
                    return (
                      <Seat
                        key={id}
                        seatId={id}
                        status={status}
                        selected={selected.includes(id)}
                        seatType={seatType}
                        onClick={toggle}
                        tooltip={`${seatType} Seat ${
                          status === "unavailable" ? "(Booked)" : ""
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Row Label */}
                <span className="ml-2 text-gray-600 text-xs">{rowNum}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 rounded-sm"></div> Selected
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded-sm"></div>{" "}
            Business Class
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 border border-green-400 rounded-sm"></div>{" "}
            Extra Legroom
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-300 rounded-sm"></div> Booked
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Selected Seat:{" "}
          <span className="font-medium text-blue-600">
            {selected.join(", ") || "None"}
          </span>
        </p>
      </section>

      {/* ==== Fare Summary Section ==== */}
      <aside className="bg-white border border-gray-200 rounded-lg p-6 shadow">
        <h3 className="text-2xl font-semibold text-blue-600 mb-4">
          Fare Summary
        </h3>
        {flight && (
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Base Fare:</span>
              <span>₹ {flight.base_fare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Seat Type:</span>
              <span>{selectedType || "Economy"}</span>
            </div>
            <div className="flex justify-between">
              <span>Seats Left:</span>
              <span>
                {flight.available_seats}/{flight.total_seats}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Seat Demand:</span>
              <span>{seatDemand.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Time to Departure:</span>
              <span>
                {timeLeft && timeLeft > 0
                  ? `${timeLeft.toFixed(1)} hrs`
                  : "Departed"}
              </span>
            </div>
            <hr className="my-3 border-gray-300" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Price:</span>
              <span>₹ {finalFare.toFixed(2)}</span>
            </div>
          </div>
        )}
        <button
          onClick={continueToPayment}
          disabled={selected.length === 0}
          className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Continue to Payment
        </button>
      </aside>
    </div>
  );
}
