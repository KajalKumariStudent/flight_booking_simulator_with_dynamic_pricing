import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PassengerInfo() {
  const location = useLocation();
  const nav = useNavigate();
  const flight = location.state?.flight;
  const initialPassengers = Array(location.state.passengers || 1).fill({ full_name: "", age: "", gender: "" });
  const [passengers, setPassengers] = useState(initialPassengers);

  //
  // ➕ Add a new passenger row
  //
  function addPassenger() {
    setPassengers([...passengers, { full_name: "", age: "", gender: "" }]);
  }

  //
  // ✏️ Handle input changes
  //
  function handleChange(index, field, value) {
    const updated = [...passengers];
    updated[index][field] = field === "age" ? Number(value) : value;
    setPassengers(updated);
  }

  //
  // 🚀 Proceed to Seat Selection
  //
  function handleContinue() {
    // validation
    for (const p of passengers) {
      if (!p.full_name || !p.age || !p.gender) {
        alert("Please fill all passenger details before continuing.");
        return;
      }
    }

    nav(`/seat-selection/${flight.flight_id}`, {
      state: {
            ...location.state, // keep all previous flight + trip info
            passengers: passengers, // newly added passengers list
        },
    });
  }

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
        <h2 className="text-3xl font-extrabold text-blue-600 mb-2 text-center">
          Passenger Information
        </h2>
        <p className="text-blue-600 mb-6 text-center">
          Fill out passenger details for flight{" "}
          <span className="font-semibold">{flight?.flight_number}</span>
        </p>

        <div className="space-y-6">
          {passengers.map((p, i) => (
            <div
              key={i}
              className="border border-blue-200 rounded-lg p-5 shadow-sm bg-blue-50/30"
            >
              <h3 className="font-semibold text-blue-700 mb-3">
                Passenger {i + 1}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={p.full_name}
                    onChange={(e) =>
                      handleChange(i, "full_name", e.target.value)
                    }
                    placeholder="Enter full name"
                    className="mt-1 w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-600">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={p.age}
                    onChange={(e) => handleChange(i, "age", e.target.value)}
                    placeholder="Age"
                    className="mt-1 w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-600">
                    Gender
                  </label>
                  <select
                    value={p.gender}
                    onChange={(e) => handleChange(i, "gender", e.target.value)}
                    className="mt-1 w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add passenger button */}
        <div className="mt-6 flex justify-between items-center">
          <button
            type="button"
            onClick={addPassenger}
            className="px-4 py-2 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold"
          >
            + Add Another Passenger
          </button>

          <button
            onClick={handleContinue}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow"
          >
            Continue to Seat Selection
          </button>
        </div>
      </div>
    </div>
  );
}
