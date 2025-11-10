import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getSeats, bookFlight } from "../api/api";
import { computeDynamicFare } from "../utils/pricing";

// 🪑 Seat Component
function Seat({ seatId, status, selectedBy, onClick, seatType, tooltip, disabled = false }) {
  const base =
    "w-10 h-10 flex items-center justify-center rounded cursor-pointer text-xs font-semibold border transition relative";

  const colors = {
    BUSINESS: "bg-yellow-50 border-yellow-400 hover:bg-yellow-100",
    ECONOMY: "bg-white border-gray-300 hover:bg-blue-100",
    LEGROOM: "bg-green-50 border-green-400 hover:bg-green-100",
  };

  const passengerColors = [
    "bg-blue-600 text-white border-blue-700",
    "bg-purple-600 text-white border-purple-700",
    "bg-pink-600 text-white border-pink-700",
    "bg-red-600 text-white border-red-700",
  ];

  const isSelected = selectedBy !== null;

  const classes = disabled
    ? `${base} bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed opacity-60`
    : status === "unavailable"
    ? `${base} bg-gray-300 text-gray-400 border-gray-200 cursor-not-allowed`
    : isSelected
    ? `${base} ${passengerColors[selectedBy % passengerColors.length]}`
    : `${base} ${colors[seatType] || colors.ECONOMY}`;

  return (
    <div
      className={classes}
      onClick={() => {
        if (status === "available" && !disabled) onClick(seatId);
      }}
      title={tooltip}
    >
      {seatId}
    </div>
  );
}

// ✈️ Seat Selection Component
export default function SeatSelection({ passenger }) {
  const { flightId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const { flight, passengers = [], trip = "oneway", returnFlight } = location.state || {};

  const [passengerList, setPassengerList] = useState(
    passengers.map((p) => ({ ...p, seat_no: null, return_seat_no: null }))
  );
  const [unavailable, setUnavailable] = useState(new Set());
  const [returnUnavailable, setReturnUnavailable] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const noSeatsAvailable = flight?.available_seats === 0;
  const noSeatsAvailableOnReturn =
    trip === "round" && returnFlight?.available_seats === 0;

  // Fetch seat availability
  useEffect(() => {
    async function fetchSeats() {
      setLoading(true);
      try {
        const data = await getSeats(flightId);
        setUnavailable(new Set(data.unavailableSeats || []));
        if (trip === "round" && returnFlight) {
          const returnData = await getSeats(returnFlight.flight_id);
          setReturnUnavailable(new Set(returnData.unavailableSeats || []));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSeats();
  }, [flightId, returnFlight, trip]);

  // ✅ Seat selection logic (for onward and return)
  const toggleSeat = (seatId, seatType = "ECONOMY", segment = "onward") => {
  const unavailableSet = segment === "onward" ? unavailable : returnUnavailable;
  if (unavailableSet.has(seatId)) return;

  setPassengerList((prev) => {
    const selectedSeats = prev
      .map((p) => (segment === "onward" ? p.seat_no : p.return_seat_no))
      .filter(Boolean);
    const maxSeats = prev.length;

    // If this seat is already selected → unselect it
    if (selectedSeats.includes(seatId)) {
      return prev.map((p) =>
        segment === "onward"
          ? p.seat_no === seatId
            ? { ...p, seat_no: null }
            : p
          : p.return_seat_no === seatId
          ? { ...p, return_seat_no: null }
          : p
      );
    }

    // Find the first passenger who doesn’t have a seat yet
    const firstUnassignedIndex = prev.findIndex((p) =>
      segment === "onward" ? !p.seat_no : !p.return_seat_no
    );

    // ❌ If all passengers already have seats, ignore the click
    if (firstUnassignedIndex === -1) {
      alert(`You can only select ${maxSeats} seats.`);
      return prev;
    }

    // ✅ Otherwise, assign this seat to that passenger
    return prev.map((p, idx) => {
      if (idx === firstUnassignedIndex) {
        return segment === "onward"
          ? { ...p, seat_no: seatId }
          : { ...p, return_seat_no: seatId };
      }
      return p;
    });
  });
};


  // ✅ Handle continue → booking → payment
  const handleContinue = async () => {
    try {
      const allSelected = passengerList.every(
        (p) => p.seat_no && (trip === "oneway" || p.return_seat_no)
      );
      if (!allSelected) {
        alert("Please select seats for all passengers.");
        return;
      }

      const payload = {
        owner_passenger_id: passenger?.passenger_id,
        onward_flight_id: flight?.flight_id,
        passengers: passengerList.map((p) => ({
          full_name: p.full_name,
          age: p.age || null,
          gender: p.gender || null,
          seat_no: p.seat_no ? String(p.seat_no) : null,
          return_seat_no: trip === "round" ? String(p.return_seat_no) : null,
        })),
      };

      if (trip === "round" && returnFlight?.flight_id) {
        payload.return_flight_id = returnFlight.flight_id;
      }

      console.log("🚀 Booking Payload:", payload);
      const booking = await bookFlight(payload, trip === "round" ? "round" : "oneway");
      console.log("✅ Booking Created:", booking);

      const bookingId =
        booking.booking_id ||
        booking.primary_booking_id ||
        booking.bookings?.[0]?.booking_id ||
        booking.bookings?.[0]?.onward_booking_id ||
        null;

      if (!bookingId) {
        alert("Booking created, but booking ID not returned!");
        return;
      }

      const completeBooking = {
        ...booking,
        flight,
        passengers: passengerList,
        trip,
        total: totalFare,
        owner_passenger_id: passenger.passenger_id,
        return_flight_id: returnFlight?.flight_id || null,
      };

      nav(`/payment/${bookingId}`, {
        state: { booking: completeBooking },
      });
    } catch (err) {
      console.error("❌ Booking Error:", err);
      alert("Booking failed: " + err.message);
    }
  };

  // 🧾 Seat map config
  const rows = 30;
  const leftSide = ["A", "B"];
  const rightSide = ["C", "D", "E", "F"];
  const businessRows = [1, 2];
  const legroomRows = [10];

  const getSeatTypeInfo = (seat) => {
    if (!seat) return { type: "Economy", factor: 1.0 };
    const row = parseInt(seat);
    if (businessRows.includes(row)) return { type: "Business", factor: 1.5 };
    if (legroomRows.includes(row)) return { type: "Extra Legroom", factor: 1.2 };
    return { type: "Economy", factor: 1.0 };
  };

  // 🪙 Fare calculation (unchanged)
  const fareBreakdown = passengerList.map((p) => {
    const onwardInfo = getSeatTypeInfo(p.seat_no);
    const returnInfo =
      trip === "round" ? getSeatTypeInfo(p.return_seat_no) : { type: null, factor: 0 };

    const daysUntil = flight?.departure_time
      ? Math.max(
          0,
          (new Date(flight.departure_time) - new Date()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const onwardDynamic = computeDynamicFare(
      flight?.base_fare || 0,
      flight?.available_seats || 0,
      flight?.total_seats || 1,
      daysUntil,
      0.2
    );

    const returnDynamic =
      trip === "round" && returnFlight
        ? computeDynamicFare(
            returnFlight?.base_fare || 0,
            returnFlight?.available_seats || 0,
            returnFlight?.total_seats || 1,
            daysUntil,
            0.2
          )
        : 0;

    return {
      name: p.full_name,
      onwardSeatType: onwardInfo.type,
      returnSeatType: returnInfo.type,
      onwardFare: onwardDynamic * onwardInfo.factor,
      returnFare: returnDynamic * returnInfo.factor,
      total:
        onwardDynamic * onwardInfo.factor +
        (trip === "round" ? returnDynamic * returnInfo.factor : 0),
    };
  });

  const totalFare = fareBreakdown.reduce((acc, p) => acc + p.total, 0);

  const getSelectedBy = (seatId, segment = "onward") => {
    const idx = passengerList.findIndex((p) =>
      segment === "onward" ? p.seat_no === seatId : p.return_seat_no === seatId
    );
    return idx !== -1 ? idx : null;
  };

  const seatDemand =
    flight && flight.total_seats
      ? ((flight.total_seats - flight.available_seats) / flight.total_seats) * 100
      : 0;

  const timeLeft = flight
    ? (new Date(flight.departure_time) - new Date()) / (1000 * 60 * 60)
    : null;

  // --- JSX ---
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* 🪑 Onward Seat Map Section */}
      <section className="col-span-2 bg-gray-50 p-6 rounded-lg shadow overflow-y-auto max-h-[80vh]">
        {!noSeatsAvailable && (
          <button
            onClick={() => {
              const availableSeats = [];
              for (let i = 1; i <= rows; i++) {
                for (const col of [...leftSide, ...rightSide]) {
                  const id = `${i}${col}`;
                  if (!unavailable.has(id)) availableSeats.push(id);
                }
              }
              setPassengerList((prev) => {
                const alreadySelected = prev.map((p) => p.seat_no).filter(Boolean);
                const remaining = availableSeats.filter(
                  (s) => !alreadySelected.includes(s)
                );
                return prev.map((p) => ({
                  ...p,
                  seat_no: p.seat_no || remaining.shift() || null,
                }));
              });
            }}
            className="mb-4 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg px-4 py-2 hover:bg-blue-200"
          >
            🪑 Auto-Assign Seats
          </button>
        )}

        <p className="text-sm text-gray-600 mb-3">
          Selected seats: {passengerList.filter((p) => p.seat_no).length}/
          {passengerList.length}
        </p>

        <h3 className="text-2xl text-blue-600 font-semibold mb-4">
          Onward Flight — {flight?.flight_number}
        </h3>

        {loading && <p>Loading seat map...</p>}
        {noSeatsAvailable ? (
          <div className="text-center bg-red-100 text-red-600 font-medium py-2 rounded-lg mb-4">
            No seats left on this flight. Seat selection is disabled.
          </div>
        ) : (
          Array.from({ length: rows }).map((_, rowIndex) => {
            const rowNum = rowIndex + 1;
            const seatType = businessRows.includes(rowNum)
              ? "BUSINESS"
              : legroomRows.includes(rowNum)
              ? "LEGROOM"
              : "ECONOMY";

            return (
              <div key={rowNum} className="flex justify-center items-center gap-3 mb-1">
                {[leftSide, rightSide].map((side, sideIndex) => (
                  <div key={sideIndex} className="flex gap-2">
                    {side.map((col) => {
                      const id = `${rowNum}${col}`;
                      return (
                        <Seat
                          key={id}
                          seatId={id}
                          status={unavailable.has(id) ? "unavailable" : "available"}
                          selectedBy={getSelectedBy(id, "onward")}
                          seatType={seatType}
                          disabled={noSeatsAvailable}
                          onClick={(seatId) => toggleSeat(seatId, seatType, "onward")}
                          tooltip={`${seatType} Seat`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })
        )}

        {/* 🧩 Seat Legend */}
        <div className="flex justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-100 border border-yellow-400 rounded"></div>
            <span>Business</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-100 border border-green-400 rounded"></div>
            <span>Extra Legroom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-100 border border-gray-300 rounded"></div>
            <span>Economy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-300 border border-gray-200 rounded"></div>
            <span>Booked</span>
          </div>
        </div>

        {/* 🪑 Return Flight Section */}
        {trip === "round" && returnFlight && (
          <>
            <hr className="my-8 border-t border-gray-300" />
            <button
              onClick={() => {
                const availableSeats = [];
                for (let i = 1; i <= rows; i++) {
                  for (const col of [...leftSide, ...rightSide]) {
                    const id = `${i}${col}`;
                    if (!returnUnavailable.has(id)) availableSeats.push(id);
                  }
                }
                setPassengerList((prev) => {
                  const alreadySelected = prev.map((p) => p.return_seat_no).filter(Boolean);
                  const remaining = availableSeats.filter(
                    (s) => !alreadySelected.includes(s)
                  );
                  return prev.map((p) => ({
                    ...p,
                    return_seat_no: p.return_seat_no || remaining.shift() || null,
                  }));
                });
              }}
              className="mb-4 bg-blue-100 text-blue-700 border border-blue-400 rounded-lg px-4 py-2 hover:bg-blue-200"
            >
              🪑 Auto-Assign Return Seats
            </button>

            <p className="text-sm text-gray-600 mb-3">
              Selected return seats: {passengerList.filter((p) => p.return_seat_no).length}/
              {passengerList.length}
            </p>

            <h3 className="text-2xl text-blue-600 font-semibold mb-4">
              Return Flight — {returnFlight.flight_number}
            </h3>

            {noSeatsAvailableOnReturn ? (
              <div className="text-center bg-red-100 text-red-600 font-medium py-2 rounded-lg mb-4">
                No seats left on the return flight. Seat selection is disabled.
              </div>
            ) : (
              Array.from({ length: rows }).map((_, rowIndex) => {
                const rowNum = rowIndex + 1;
                const seatType = businessRows.includes(rowNum)
                  ? "BUSINESS"
                  : legroomRows.includes(rowNum)
                  ? "LEGROOM"
                  : "ECONOMY";

                return (
                  <div
                    key={rowNum}
                    className="flex justify-center items-center gap-3 mb-1"
                  >
                    {[leftSide, rightSide].map((side, sideIndex) => (
                      <div key={sideIndex} className="flex gap-2">
                        {side.map((col) => {
                          const id = `${rowNum}${col}`;
                          return (
                            <Seat
                              key={id}
                              seatId={id}
                              status={
                                returnUnavailable.has(id) ? "unavailable" : "available"
                              }
                              selectedBy={getSelectedBy(id, "return")}
                              seatType={seatType}
                              disabled={noSeatsAvailableOnReturn}
                              onClick={(seatId) =>
                                toggleSeat(seatId, seatType, "return")
                              }
                              tooltip={`${seatType} Seat`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </>
        )}
      </section>

      {/* Fare Summary */}
      <aside className="bg-linear-to-b from-blue-50 to-white border rounded-2xl p-6 shadow-lg">
      <h3 className="text-2xl font-semibold text-blue-700 mb-5 flex items-center gap-2">
        💰 Fare Summary
      </h3>

      {/* Base Fare Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
        <h4 className="text-blue-700 font-medium mb-3">Base Fare Details</h4>
        <div className="flex justify-between items-center text-gray-700 mb-1">
          <span>Base Fare (per passenger):</span>
          <span className="font-semibold text-gray-900">
            ₹{flight?.base_fare?.toFixed(2) || "—"}
          </span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>Total Base Fare ({passengerList.length} passengers):</span>
          <span className="font-semibold text-blue-700">
            ₹{((flight?.base_fare || 0) * passengerList.length).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Dynamic Pricing Insights */}
      <div className="bg-white/70 rounded-xl border border-blue-100 p-4 mb-5 shadow-sm">
        <h4 className="text-blue-700 font-medium mb-3">Dynamic Pricing Factors</h4>

        {/* Seat Type */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-700">Seat Type:</span>
          <span
            className={`font-semibold ${
              passengerList.some((p) => p.seat_no)
                ? getSeatTypeInfo(passengerList.find((p) => p.seat_no)?.seat_no).type === "Business"
                  ? "text-yellow-600"
                  : getSeatTypeInfo(passengerList.find((p) => p.seat_no)?.seat_no).type ===
                    "Extra Legroom"
                  ? "text-green-600"
                  : "text-gray-700"
                : "text-gray-400"
            }`}
          >
            {passengerList.some((p) => p.seat_no)
              ? getSeatTypeInfo(passengerList.find((p) => p.seat_no)?.seat_no).type
              : "Not selected"}
          </span>
        </div>

        {/* Scarcity (Seats Left) */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-700">Seats Left:</span>
          <span className="font-semibold text-orange-600">
            {flight?.available_seats}/{flight?.total_seats}
          </span>
        </div>

        {/* Demand Factor Visual Scale */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Demand Level</span>
            <span>{seatDemand.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(seatDemand, 100)}%`,
                background:
                  seatDemand < 40
                    ? "#4ade80" // green
                    : seatDemand < 70
                    ? "#facc15" // yellow
                    : "#f87171", // red
              }}
            />
          </div>
        </div>

        {/* Time Left */}
        <div className="flex justify-between items-center mt-3">
          <span className="text-gray-700">Time Until Departure:</span>
          <span className="font-semibold text-indigo-700">
            {timeLeft && timeLeft > 0
              ? timeLeft > 24
                ? `${(timeLeft / 24).toFixed(1)} days`
                : `${timeLeft.toFixed(1)} hrs`
              : "Departed"}
          </span>
        </div>
      </div>

      {/* Fare Details per Passenger */}
      <div className="space-y-3">
        {fareBreakdown.map((p, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-blue-700">{p.name}</span>
              <span className="text-gray-500 text-sm">#{idx + 1}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Onward ({p.onwardSeatType}):</span>
              <span className="font-medium text-gray-800">
                ₹{p.onwardFare.toFixed(2)}
              </span>
            </div>
            {trip === "round" && (
              <div className="flex justify-between text-sm mb-1">
                <span>Return ({p.returnSeatType}):</span>
                <span className="font-medium text-gray-800">
                  ₹{p.returnFare.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-1">
              <span>Subtotal:</span>
              <span className="text-blue-700">₹{p.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total Fare Card */}
      <div className="bg-blue-600 text-white rounded-xl p-5 mt-6 shadow-md">
        <div className="flex justify-between items-center mb-1">
          <span className="text-lg font-medium">Total Dynamic Fare:</span>
          <span className="text-xl font-bold">₹{totalFare.toFixed(2)}</span>
        </div>
        <p className="text-sm text-blue-100">
          Includes base fare and all dynamic adjustments.
        </p>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={noSeatsAvailable || (trip === "round" && noSeatsAvailableOnReturn)}
        className={`mt-6 w-full py-2.5 rounded-xl text-lg font-semibold transition ${
          noSeatsAvailable || (trip === "round" && noSeatsAvailableOnReturn)
            ? "bg-gray-400 cursor-not-allowed text-gray-100"
            : "bg-blue-700 hover:bg-blue-800 text-white"
        }`}
      >
        Continue to Payment
      </button>

    </aside>
    </div>
  );
}
