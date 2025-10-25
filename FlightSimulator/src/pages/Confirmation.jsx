import React from "react";
import { useLocation, useParams, Link } from "react-router-dom";

export default function Confirmation() {
  const { pnr } = useParams();
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-4">
        <div className="text-3xl">✅</div>
        <div>
          <h2 className="text-2xl font-bold">Booking Confirmed</h2>
          <div className="text-slate-600">PNR: <span className="font-semibold">{pnr || location.state?.pnr}</span></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Flight</div>
          <div className="font-semibold">{booking?.flight?.airline} • {booking?.flight?.flightNo}</div>
          <div className="text-slate-500 mt-1">{booking?.flight?.from} → {booking?.flight?.to}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-slate-600">Passenger / Seats</div>
          <div className="font-semibold">{booking?.seats?.join(", ")}</div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/bookings" className="px-4 py-2 border rounded">Go to My Bookings</Link>
        <button className="px-4 py-2 bg-primary text-white rounded">Download Receipt (PDF)</button>
      </div>
    </div>
  );
}
