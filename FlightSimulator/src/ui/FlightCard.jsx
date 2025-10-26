import React from "react";
import { computeDynamicFare } from "../utils/pricing";

export default function FlightCard({ flight, onBook }) {
  const price = computeDynamicFare(flight.baseFare, flight.seatsLeft, flight.totalSeats, flight.daysUntil);

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex items-center justify-between border border-blue-600 transition hover:shadow-xl">
      {/* Flight Info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
          {flight.airline[0]}
        </div>
        <div>
          <div className="font-bold black text-lg">
            {flight.airline} <span className="text-black ml-2">{flight.flightNo}</span>
          </div>
          <div className="text-sm text-black">{flight.from} → {flight.to} • {flight.duration}</div>
          <div className="text-xs text-black mt-1">Depart {flight.depart} • Arrive {flight.arrive}</div>
        </div>
      </div>

      {/* Pricing & Book Button */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm text-blue-600/70">
            Seats left: <span className="font-medium text-green-600">{flight.seatsLeft}</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">₹ {price}</div>
        </div>

        <button
          onClick={onBook}
          className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition transform hover:-translate-y-0.5"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
