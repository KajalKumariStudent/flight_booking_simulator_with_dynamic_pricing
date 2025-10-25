import React from "react";
import { computeDynamicFare } from "../utils/pricing";

export default function FlightCard({ flight, onBook }) {
  const price = computeDynamicFare(flight.baseFare, flight.seatsLeft, flight.totalSeats, flight.daysUntil);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between border">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-slate-100 rounded flex items-center justify-center font-semibold">{flight.airline[0]}</div>
        <div>
          <div className="font-semibold">{flight.airline} <span className="text-slate-500 ml-2">{flight.flightNo}</span></div>
          <div className="text-sm text-slate-600">{flight.from} → {flight.to} • {flight.duration}</div>
          <div className="text-xs text-slate-500 mt-1">Depart {flight.depart} • Arrive {flight.arrive}</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm text-slate-500">Seats left: <span className="font-medium text-green-600">{flight.seatsLeft}</span></div>
          <div className="text-2xl font-bold text-primary">₹ {price}</div>
        </div>

        <button onClick={onBook} className="px-4 py-2 bg-primary text-white rounded">Book Now</button>
      </div>
    </div>
  );
}
