import React from "react";
import { useLocation, useParams, Link } from "react-router-dom";

export default function Confirmation() {
  const { pnr } = useParams();
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">✅</div>
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Booking Confirmed</h2>
            <div className="text-black mt-1">
              PNR: <span className="font-semibold text-blue-600">{pnr || location.state?.pnr}</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-300 rounded-xl">
            <div className="text-sm text-blue-600 font-medium mb-1">Flight</div>
            <div className="font-semibold text-black">{booking?.flight?.airline} • {booking?.flight?.flightNo}</div>
            <div className="text-black/70 mt-1">{booking?.flight?.from} → {booking?.flight?.to}</div>
          </div>

          <div className="p-4 border border-gray-300 rounded-xl">
            <div className="text-sm text-blue-600 font-medium mb-1">Passenger / Seats</div>
            <div className="font-semibold text-black">{booking?.seats?.join(", ")}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            to="/bookings"
            className="flex-1 text-center px-4 py-3 border border-blue-600 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Go to My Bookings
          </Link>
          <button
            className="flex-1 text-center px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition"
          >
            Download Receipt (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
