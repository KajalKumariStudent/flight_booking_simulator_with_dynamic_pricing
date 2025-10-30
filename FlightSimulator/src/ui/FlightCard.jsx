import React from "react";
import { computeDynamicFare } from "../utils/pricing";

export default function FlightCard({ flight, onBook }) {
  // Compute the dynamic price (fallback if backend didn't send one)
  const price = flight.dynamic_price
    ? flight.dynamic_price.toFixed(0)
    : computeDynamicFare(
        flight.base_fare,
        flight.available_seats,
        flight.total_seats,
        flight.departure_time
      );

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex items-center justify-between border border-blue-600 transition hover:shadow-xl">
      {/* Flight Info */}
      <div className="flex items-center gap-4">
        {/* Airline Logo Placeholder */}
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
          {flight.airline_name
            ? flight.airline_name[0]
            : flight.airline_id?.toString()[0]}
        </div>

        {/* Flight Details */}
        <div>
          <div className="font-bold text-lg text-black">
            {flight.airline_name || "Unknown Airline"}{" "}
            <span className="text-black ml-2">{flight.flight_number}</span>
          </div>

          <div className="text-sm text-black">
            {flight.source_airport || "From"} →{" "}
            {flight.destination_airport || "To"}
          </div>

          <div className="text-xs text-black mt-1">
            Depart{" "}
            {new Date(flight.departure_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • Arrive{" "}
            {new Date(flight.arrival_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Pricing & Book Button */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm text-blue-600/70">
            Seats left:{" "}
            <span className="font-medium text-green-600">
              {flight.available_seats}
            </span>
          </div>

          <div className="text-2xl font-bold text-blue-600 mt-1">
            ₹ {price}
          </div>
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
