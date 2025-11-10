import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBookings, cancelBooking } from "../api/api";

export default function MyBookings({ passenger }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelledBooking, setCancelledBooking] = useState(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const navigate = useNavigate();

  // 🧩 Reusable function to fetch, sort, and group bookings
  async function fetchAndSetBookings() {
    const id = passenger?.passenger_id || localStorage.getItem("passenger_id");
    if (!id) {
      setError("You must be logged in to view bookings.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getBookings(id);
      if (!Array.isArray(data)) {
        setBookings([]);
        return;
      }

      // ✅ Sort bookings by latest date
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.booking_date || a.created_at || 0);
        const dateB = new Date(b.booking_date || b.created_at || 0);
        return dateB - dateA;
      });

      // ✅ Group bookings by PNR
      const grouped = Object.values(
        sorted.reduce((acc, b) => {
          const key = b.pnr || "UNKNOWN";
          if (!acc[key]) {
            acc[key] = {
              ...b,
              passengers: [
                {
                  full_name:
                    b.passenger_name || b.full_name || "Unknown Passenger",
                  seat_no: b.seat_no || "-",
                },
              ],
            };
          } else {
            acc[key].passengers.push({
              full_name:
                b.passenger_name || b.full_name || "Unknown Passenger",
              seat_no: b.seat_no || "-",
            });
            acc[key].fare_paid += b.fare_paid || 0;
          }
          return acc;
        }, {})
      );

      setBookings(grouped);
    } catch (e) {
      console.error("❌ Failed to fetch bookings:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // 🧩 Fetch bookings on mount or passenger change
  useEffect(() => {
    if (passenger) fetchAndSetBookings();
  }, [passenger]);

  // 🧩 Handle booking cancellation
  async function handleCancel(b, mode = "full") {
    try {
      setCancelling(true);
      if (!b) throw new Error("No booking selected.");

      if (b.pnrs && b.pnrs.length > 0) {
        // Multi-airline (two PNRs)
        if (mode === "return" && b.pnrs.length > 1) {
          await cancelBooking(b.pnrs[b.pnrs.length - 1], "return");
        } else {
          for (const pnr of b.pnrs) await cancelBooking(pnr);
        }
      } else if (b.pnr) {
        // Single PNR
        await cancelBooking(b.pnr, mode);
      } else throw new Error("No PNR found for this booking.");

      setShowChoiceModal(false);
      setCancelledBooking(b);
      setShowModal(true);

      // ✅ Refetch and reprocess booking data
      await fetchAndSetBookings();
    } catch (e) {
      alert("Failed to cancel: " + e.message);
    } finally {
      setCancelling(false);
    }
  }

  // 🧩 Navigate to confirmation page
  function handleViewBooking(b) {
    navigate(`/confirmation/${b.pnr}`, { state: { booking: b } });
  }

  // 🧩 UI Rendering
  if (loading)
    return (
      <div className="text-center py-10 text-gray-600">Loading bookings...</div>
    );
  if (error)
    return (
      <div className="text-red-600 text-center py-10">
        Failed to load bookings: {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl text-blue-600 font-bold text-center mb-6">
        My Bookings
      </h2>

      <div className="space-y-4 max-w-4xl mx-auto">
        {bookings.length === 0 && (
          <div className="p-6 bg-white rounded-lg text-center text-gray-600 shadow">
            No bookings found.
          </div>
        )}

        {bookings.map((b, index) => (
          <div
            key={b.pnr || index}
            className="bg-white border rounded-lg shadow p-5 flex flex-col sm:flex-row justify-between items-center hover:shadow-md transition"
          >
            {/* Left: Flight Info */}
            <div className="text-left">
              <div className="font-semibold text-lg text-blue-700">
                {b.airline_name} • {b.flight_number}
              </div>
              <div className="text-gray-700">
                {b.source} → {b.destination}
                {b.return_flight_id && (
                  <>
                    <br />
                    {b.destination} → {b.source}
                  </>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Seats: {b.passengers?.map((p) => p.seat_no).join(", ")} | ₹
                {b.fare_paid.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                PNR: {b.pnrs ? b.pnrs.join(", ") : b.pnr}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="text-right mt-3 sm:mt-0">
              <div
                className={`font-medium ${
                  b.status === "CONFIRMED"
                    ? "text-green-600"
                    : b.status === "PARTIALLY_CANCELLED"
                    ? "text-orange-500"
                    : "text-red-500"
                }`}
              >
                {b.status === "PARTIALLY_CANCELLED"
                  ? "Partially Cancelled"
                  : b.status}
              </div>

              <div className="mt-2 flex gap-2 justify-end">
                <button
                  onClick={() => handleViewBooking(b)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  View
                </button>

                {b.status !== "CANCELLED" && (
                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setShowChoiceModal(true);
                    }}
                    disabled={cancelling}
                    className={`px-3 py-2 text-white rounded-lg text-sm ${
                      cancelling
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {cancelling ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🧩 Cancel Options Modal */}
      {showChoiceModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center w-80 animate-fadeIn">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">
              Choose Cancellation Type
            </h3>
            <p className="text-gray-600 mb-5">
              Do you want to cancel only the return flight or the entire trip?
            </p>

            <div className="flex flex-col gap-3">
              {selectedBooking?.trip_type === "ROUND_TRIP" && (
                <button
                  onClick={() => handleCancel(selectedBooking, "return")}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Cancel Return Flight Only
                </button>
              )}
              <button
                onClick={() => handleCancel(selectedBooking, "full")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Entire Trip
              </button>
              <button
                onClick={() => setShowChoiceModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Cancel Success Modal */}
      {showModal && cancelledBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center w-80 animate-fadeIn">
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Booking Cancelled
            </h3>
            <p className="text-gray-700 mb-1">
              PNR: <span className="font-semibold">{cancelledBooking.pnr}</span>
            </p>
            <p className="text-gray-600">
              Flight: {cancelledBooking.source} → {cancelledBooking.destination}
            </p>
            <p className="text-gray-600 mb-4">
              Seat: {cancelledBooking.seat_no}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
