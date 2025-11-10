import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { payBooking } from "../api/api";

export default function Payment() {
  const { bookingId } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  // booking data received from seat-selection page
  const booking = location.state?.booking;
  const flight = booking?.flight;
  const passengers = booking?.passengers || [];
  const trip = booking?.trip || "oneway";
  const totalFare = booking?.total || 0;

  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pnrList, setPnrList] = useState([]);
  const [error, setError] = useState(null);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    console.log("🧾 Payment Page Loaded", { booking, flight, passengers });
  }, [booking, flight, passengers]);

  async function handlePayment(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // UX delay
      await new Promise((res) => setTimeout(res, 1500));

      // ✅ Fetch the booking PNR 
      const bookingPNR = 
      booking?.pnr ||
      booking?.onward_pnr ||
      booking?.bookings?.[0]?.onward_pnr ||
      booking?.bookings?.[0]?.pnr ||
      null;
      if (!bookingPNR) {
        throw new Error("PNR not found. Cannot process payment.");
      }

      // ✅ Call your backend’s payment endpoint
      console.log("💳 Initiating payment for PNR:", bookingPNR);
      const response = await payBooking(bookingPNR);

      // ✅ Extract the new confirmed PNR
      const pnrFromBackend =
        response?.pnr || response?.booking?.pnr || bookingPNR;

      // ✅ Update frontend state
      setPnrList([pnrFromBackend]);
      setPaid(true);
      setShowSuccessModal(true);

      // ✅ Navigate to Confirmation page
      setTimeout(() => {
        nav(`/confirmation/${pnrFromBackend}`, {
          state: {
            booking: {
              ...booking,
              flight,
              passengers,
              pnrs: [pnrFromBackend],
              status: "CONFIRMED",
            },
          },
        });
      }, 2500);
    } catch (err) {
      console.error("❌ Payment Error:", err);
      setError("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-linear-gradient-to-br from-blue-50 to-indigo-100 p-8 flex flex-col lg:flex-row gap-8 relative overflow-hidden">
      {/* Background decorative layer */}
      <div className="absolute inset-0 bg-[url('/assets/payment-bg.svg')] opacity-10 animate-pulse"></div>

      {/* ==== LEFT: Payment Form ==== */}
      <section className="flex-1 bg-white/90 backdrop-blur rounded-3xl shadow-xl p-8 space-y-6 relative z-10">
        <h2 className="text-2xl font-bold text-blue-700">
          💳 Secure Payment — Booking #{bookingId}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
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
              <div className="space-y-4">
                <input
                  placeholder="Card Number"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <input
                  placeholder="Name on Card"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="MM/YY"
                    value={card.exp}
                    onChange={(e) => setCard({ ...card, exp: e.target.value })}
                    className="border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                  <input
                    placeholder="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    className="border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* UPI PAYMENT */}
            {method === "upi" && (
              <div className="space-y-4">
                <p className="text-blue-700 font-medium">Enter UPI ID</p>
                <input
                  placeholder="example@upi"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="border border-gray-300 rounded-xl p-3 w-full sm:w-64 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* NETBANKING */}
            {method === "netbanking" && (
              <div className="space-y-4">
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
              className={`w-full sm:w-64 font-semibold rounded-xl py-3 shadow-lg transition ${
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
            <p className="text-gray-600">Your bookings are confirmed.</p>
            {pnrList.map((pnr, i) => (
              <p key={i} className="text-blue-700 font-semibold text-lg mt-2">
                PNR {i + 1}: {pnr}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* ==== RIGHT: Booking Summary ==== */}
      <aside className="w-full lg:w-1/3 bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 h-fit relative z-10">
        <h3 className="font-bold text-blue-700 mb-4 text-xl">Booking Details</h3>

        {flight ? (
          <>
            {/* Flight Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg text-black">
                {flight.airline_name}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                ✈️ {flight.flight_number}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between mb-1">
              <div className="text-gray-700 font-medium">
                {flight.source_airport}
              </div>
              <span className="text-blue-500 text-lg font-bold">→</span>
              <div className="text-gray-700 font-medium">
                {flight.destination_airport}
              </div>
            </div>

            {/* Departure / Arrival */}
            <div className="text-gray-500 text-sm mb-1">
              <span className="font-medium">Departure:</span>{" "}
              {new Date(flight.departure_time).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
            <div className="text-gray-500 text-sm">
              <span className="font-medium">Arrival:</span>{" "}
              {new Date(flight.arrival_time).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
          </>
        ) : (
          <p className="text-gray-500">No flight information available.</p>
        )}

        <hr className="my-4 border-gray-300" />

        {/* Passenger Summary */}
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Passengers:</strong> {passengers.length}
          </p>
          {passengers.map((p, idx) => (
            <div
              key={idx}
              className="flex flex-col border-b border-gray-100 py-2 text-sm text-gray-700"
            >
              <div className="flex justify-between">
                <span>
                  {idx + 1}. {p.full_name} ({p.gender}, {p.age})
                </span>
              </div>

              {/* Onward Seat */}
              <div className="flex justify-between text-blue-700 font-medium mt-0.5">
                <span>Onward Seat:</span>
                <span>{p.seat_no || "—"}</span>
              </div>

              {/* Return Seat — only if round trip */}
              {trip === "round" && (
                <div className="flex justify-between text-green-700 font-medium mt-0.5">
                  <span>Return Seat:</span>
                  <span>{p.return_seat_no || "—"}</span>
                </div>
              )}
            </div>
          ))}

        </div>

        <hr className="my-4 border-gray-300" />

        {/* Fare Summary */}
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Base Fare:</span>
            <span>₹{flight?.base_fare?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Dynamic Adjustments:</span>
            <span className="text-blue-700 font-medium">Included</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-1">
            <span>Total Fare:</span>
            <span>₹{totalFare.toFixed(2)}</span>
          </div>
        </div>

        <hr className="my-4 border-gray-300" />

        {/* Payment Status */}
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Payment Status:</span>
          <span
            className={`font-semibold ${
              paid ? "text-green-600" : "text-orange-600"
            }`}
          >
            {paid ? "✅ Successful" : "🕓 Pending"}
          </span>
        </div>
      </aside>


      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl w-[90%] sm:w-[400px]">
            <div className="text-6xl mb-4 text-green-600">🎉</div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-gray-600 mb-4">
              Your payment has been successfully processed.
            </p>
            {pnrList.map((pnr, i) => (
              <p key={i} className="text-blue-700 font-semibold text-lg">
                PNR {i + 1}: {pnr}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
