import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { bookFlight } from "../api/api";

export default function Payment() {
  const { bookingId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const booking = location.state?.booking;
  const flight = booking?.flight;

  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pnr, setPnr] = useState(null);
  const [error, setError] = useState(null);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    console.log("🧾 Payment Page Loaded", { booking, flight });
  }, [booking, flight]);

  async function handlePayment(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise((res) => setTimeout(res, 1800));

      // const payload = {
      //   flight_id: flight.flight_id,
      //   passenger_id: booking.passenger_id,
      //   seat_no: booking.seat_no,
      //   fare_paid: booking.total,
      // };

      // Simulate successful payment without re-booking
      const response = booking; 


      const generatedPNR =
        response.pnr ||
        response.booking?.pnr ||
        "PNR" + Math.random().toString(36).substring(2, 8).toUpperCase();

      setPnr(generatedPNR);
      setPaid(true);
      setShowSuccessModal(true);

      // Navigate after confirmation
      setTimeout(() => {
        nav(`/confirmation/${generatedPNR}`, {
          state: {
            booking: {
              ...booking,
              flight,
              pnr: generatedPNR,
              status: "CONFIRMED",
              airline_name: booking.airline_name || flight?.airline_name,
              flight_number: booking.flight_number || flight?.flight_number,
              source: booking.source || flight?.source_airport,
              destination: booking.destination || flight?.destination_airport,
            },
            pnr: generatedPNR,
          },
        });
      }, 3000);
    } catch (err) {
      setError("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8 flex flex-col lg:flex-row gap-8 relative overflow-hidden">
      {/* Animated background waves */}
      <div className="absolute inset-0 bg-[url('/assets/payment-bg.svg')] opacity-10 animate-pulse"></div>

      {/* ==== LEFT: Payment Form ==== */}
      <section className="flex-1 bg-white/90 backdrop-blur rounded-3xl shadow-xl p-8 space-y-6 relative z-10">
        <h2 className="text-2xl font-bold text-blue-700">
          💳 Secure Payment — Booking #{bookingId}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm animate-shake">
            {error}
          </div>
        )}

        {!paid ? (
          <form onSubmit={handlePayment} className="space-y-6">
            {/* Payment Method */}
            <div>
              <label className="text-blue-700 font-medium mb-2 block">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="border border-gray-300 rounded-xl p-3 w-full sm:w-64 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="card">💳 Credit / Debit Card</option>
                <option value="upi">📱 UPI</option>
                <option value="netbanking">🏦 NetBanking</option>
              </select>
            </div>

            {/* CARD PAYMENT */}
            {method === "card" && (
              <div className="space-y-4 transition-all duration-500 ease-in-out">
                {/* Animated card preview */}
                <div className="relative bg-linear-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl p-5 shadow-lg transform hover:scale-105 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm opacity-80">CARD NUMBER</div>
                      <div className="text-lg font-mono tracking-widest">
                        {card.number || "•••• •••• •••• ••••"}
                      </div>
                    </div>
                    <img
                      src="/assets/chip.png"
                      alt="chip"
                      className="h-8 opacity-80"
                    />
                  </div>
                  <div className="mt-6 flex justify-between text-sm">
                    <div>
                      <div className="opacity-80">NAME</div>
                      <div className="font-semibold uppercase">
                        {card.name || "YOUR NAME"}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-80">EXP</div>
                      <div>{card.exp || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                {/* Inputs */}
                <div className="flex gap-3 mb-3 mt-4">
                  <img src="/assets/visa.png" alt="Visa" className="h-8" />
                  <img src="/assets/mastercard.png" alt="Mastercard" className="h-8" />
                  <img src="/assets/amex.png" alt="Amex" className="h-8" />
                </div>

                <input
                  placeholder="Card Number"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 w-full text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <input
                  placeholder="Name on Card"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 w-full text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="MM/YY"
                    value={card.exp}
                    onChange={(e) => setCard({ ...card, exp: e.target.value })}
                    className="border border-gray-300 rounded-xl p-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                  <input
                    placeholder="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    className="border border-gray-300 rounded-xl p-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* UPI PAYMENT */}
            {method === "upi" && (
              <div className="space-y-4 animate-fadeIn">
                <p className="text-blue-700 font-medium">Scan to Pay</p>
                <div className="relative w-48 h-48 bg-gray-100 border-2 border-dashed border-blue-300 flex items-center justify-center rounded-xl shadow-inner">
                  <img
                    src="/assets/upi-qr.png"
                    alt="UPI QR"
                    className="w-40 h-40 object-contain animate-pulse-slow"
                  />
                </div>
                <input
                  placeholder="Enter your UPI ID (e.g., name@bank)"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="border border-gray-300 rounded-xl p-3 w-full sm:w-64 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* NETBANKING */}
            {method === "netbanking" && (
              <div className="space-y-4 animate-fadeIn">
                <label className="text-blue-700 font-medium">Select Bank</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="border border-gray-300 rounded-xl p-3 w-full sm:w-64 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                >
                  <option value="">-- Select Bank --</option>
                  <option value="SBI">State Bank of India</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="Axis">Axis Bank</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-64 font-semibold rounded-xl py-3 shadow-lg transition transform hover:-translate-y-0.5 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "Processing Payment..." : "Confirm & Pay"}
            </button>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-3 animate-bounce">✅</div>
            <h3 className="text-2xl font-bold text-green-600 mb-1">
              Payment Successful!
            </h3>
            <p className="text-gray-600">Your booking is confirmed.</p>
            <p className="mt-4 text-blue-700 font-semibold text-lg">
              PNR: {pnr}
            </p>
          </div>
        )}
      </section>

      {/* ==== RIGHT: Booking Summary ==== */}
      <aside className="w-full lg:w-1/3 bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 h-fit relative z-10 animate-slideIn">
        <h3 className="font-bold text-blue-700 mb-4 text-xl">
          Booking Summary
        </h3>

        {flight ? (
          <>
            <div className="font-medium text-lg text-black mb-1">
              {flight.airline_name || "Airline"} • {flight.flight_number}
            </div>
            <div className="text-gray-600 text-sm mb-2">
              {flight.source_airport} → {flight.destination_airport}
            </div>
            <div className="text-sm text-gray-500">
              Departure:{" "}
              {new Date(flight.departure_time).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Arrival:{" "}
              {new Date(flight.arrival_time).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm mb-4">
            Flight details unavailable.
          </p>
        )}

        <div className="border-t border-gray-200 mt-3 pt-3 text-sm text-gray-700 space-y-1">
          <div>
            Seat:{" "}
            <span className="font-medium">{booking?.seat_no || "—"}</span>
          </div>
          <div>
            Status:{" "}
            <span
              className={`font-medium ${
                paid ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {paid ? "CONFIRMED" : "Pending Payment"}
            </span>
          </div>
          {pnr && (
            <div>
              PNR: <span className="font-semibold text-blue-700">{pnr}</span>
            </div>
          )}
        </div>

        <hr className="my-4 border-gray-300" />

        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Fare:</span>
          <span className="text-2xl font-bold text-blue-700">
            ₹ {booking?.total?.toFixed(2) || "—"}
          </span>
        </div>
      </aside>

      {/* ==== SUCCESS MODAL ==== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl w-[90%] sm:w-[400px] animate-popIn">
            <div className="text-6xl mb-4 animate-bounce text-green-600">🎉</div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-gray-600 mb-4">
              Your payment has been successfully processed.
            </p>
            <div className="text-blue-700 font-semibold text-lg">
              PNR: {pnr}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
