import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBookings, cancelBooking } from "../api/api";

export default function MyBookings({ passenger }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelledBooking, setCancelledBooking] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch all bookings
  useEffect(() => {
    if (passenger === null) return;

    const id = passenger?.passenger_id || localStorage.getItem("passenger_id");

    if (!id) {
      setError("You must be logged in to view bookings.");
      return;
    }

    setLoading(true);
    setError(null);

    getBookings(id)
      .then((data) => setBookings(data))
      .catch((e) => {
        console.error("❌ Failed to fetch bookings:", e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [passenger]);

  // ✅ Cancel a booking
  async function handleCancel(pnr) {
    try {
      await cancelBooking(pnr);
      const booking = bookings.find((b) => b.pnr === pnr);
      setCancelledBooking(booking);
      setShowModal(true);
      setBookings((prev) =>
        prev.map((b) => (b.pnr === pnr ? { ...b, status: "CANCELLED" } : b))
      );
    } catch (e) {
      alert("Failed to cancel: " + e.message);
    }
  }

  // ✅ Handle View Booking — only pass booking (no flight fetch)
  function handleViewBooking(b) {
    navigate(`/confirmation/${b.pnr}`, { state: { booking: b } });
  }

  if (loading)
    return <div className="text-center py-10 text-gray-600">Loading bookings...</div>;
  if (error)
    return <div className="text-red-600 text-center py-10">Failed to load bookings: {error}</div>;

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
            className="bg-white border rounded-lg shadow p-5 flex flex-col sm:flex-row justify-between items-center hover:shadow-md"
          >
            {/* Left: Flight Info */}
            <div className="text-left">
              <div className="font-semibold text-lg text-blue-700">
                {b.airline_name} • {b.flight_number}
              </div>
              <div className="text-gray-700">
                {b.source} → {b.destination}
              </div>
              <div className="text-sm text-gray-500">
                Seat: {b.seat_no} | ₹{b.fare_paid.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">PNR: {b.pnr}</div>
            </div>

            {/* Right: Actions */}
            <div className="text-right mt-3 sm:mt-0">
              <div
                className={`font-medium ${
                  b.status === "CONFIRMED" ? "text-green-600" : "text-red-500"
                }`}
              >
                {b.status}
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
                    onClick={() => handleCancel(b.pnr)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
