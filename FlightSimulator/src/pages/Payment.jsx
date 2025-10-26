import React, { useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { bookFlight } from "../api/api";


export default function Payment() {
const { bookingId } = useParams();
const location = useLocation();
const nav = useNavigate();
const booking = location.state?.booking;


const [method, setMethod] = useState("card");
const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);


async function pay(e) {
e.preventDefault();
setLoading(true); setError(null);
try {
// payload shape must match backend expectation
const payload = {
flight_id: booking.flight.id,
seats: booking.seats,
passenger: { name: card.name || 'Passenger', contact: null },
amount_paid: booking.total
};
const response = await bookFlight(payload);
// backend should return { pnr: 'PNR1234', booking: {...} }
const pnr = response.pnr || response.booking?.pnr || 'PNR' + Math.random().toString(36).substring(2,8).toUpperCase();
nav(`/confirmation/${pnr}`, { state: { booking: response.booking || booking, pnr } });
} catch (e) { setError(e.message) }
finally { setLoading(false) }
}

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col lg:flex-row gap-6">
      
      {/* Payment Form */}
      <section className="lg:flex-2 bg-white rounded-3xl shadow-lg p-8 space-y-6">
        <h3 className="text-2xl font-bold text-blue-600 mb-4">Payment — {booking?.id || bookingId}</h3>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <form onSubmit={pay} className="space-y-6">

          {/* Payment Method */}
          <div className="flex flex-col">
            <label className="text-blue-600 font-medium mb-2">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="border border-gray-300 rounded-xl p-3 w-64 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">NetBanking</option>
            </select>
          </div>

          {/* Card Details */}
          {method === "card" && (
            <div className="space-y-4">
              {/* Card Logos */}
              <div className="flex gap-3 mb-2">
                <img src="/assets/visa.png" alt="Visa" className="h-8"/>
                <img src="/assets/mastercard.png" alt="Mastercard" className="h-8"/>
                <img src="/assets/amex.png" alt="Amex" className="h-8"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  placeholder="Card number"
                  value={card.number}
                  onChange={e => setCard({ ...card, number: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <input
                  placeholder="Name on card"
                  value={card.name}
                  onChange={e => setCard({ ...card, name: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <input
                  placeholder="MM/YY"
                  value={card.exp}
                  onChange={e => setCard({ ...card, exp: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <input
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={e => setCard({ ...card, cvv: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* UPI Payment */}
          {method === "upi" && (
            <div className="flex flex-col items-start space-y-4">
              <label className="text-blue-600 font-medium">Scan QR to Pay</label>
              {/* Placeholder QR */}
              <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded-xl shadow">
                <span className="text-gray-500">QR Code</span>
              </div>
              <input
                placeholder="UPI ID (optional)"
                className="border border-gray-300 rounded-xl p-3 w-64 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          )}

          {/* Confirm Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-64 bg-blue-600 text-white font-semibold rounded-xl py-3 shadow hover:bg-blue-700 transition transform hover:-translate-y-0.5"
            >
              {loading ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </form>
      </section>

      {/* Booking Summary */}
      <aside className="lg:flex-1 bg-white rounded-3xl shadow-lg p-6 h-fit">
        <div className="font-bold text-blue-600 mb-3 text-lg">Booking Summary</div>
        <div className="text-black text-sm mb-2">{booking?.flight?.airline} • {booking?.flight?.flightNo}</div>
        <div className="mb-4 text-black">Seats: <span className="font-medium">{booking?.seats?.join(", ")}</span></div>
        <div className="text-2xl font-bold text-blue-600">₹ {booking?.total || 1000}</div>
      </aside>

    </div>
  );
}
