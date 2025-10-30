import React, { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BACKEND } from "../config.js";

export default function Confirmation() {
  const { pnr } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch booking by PNR
  useEffect(() => {
    async function fetchBooking() {
      if (!pnr || booking) return;
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/bookings/${pnr}`);
        if (!res.ok) throw new Error("Failed to fetch booking");
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [pnr, booking]);

  // ✅ Fetch flight details using flight_id
  useEffect(() => {
    async function fetchFlight() {
      if (!booking?.flight_id) return;
      try {
        const res = await fetch(`${BACKEND}/flights/${booking.flight_id}`);
        if (!res.ok) throw new Error("Failed to fetch flight details");
        const data = await res.json();
        setFlight(data);
      } catch (err) {
        console.error("❌ Error fetching flight details:", err);
      }
    }
    fetchFlight();
  }, [booking]);

  // ✅ Download as PDF
  const downloadPDF = () => {
    if (!booking || !flight) return;

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Flight Booking Receipt", 14, 20);

    doc.setFontSize(12);
    doc.text(`PNR: ${booking.pnr}`, 14, 30);
    doc.text(`Status: ${booking.status}`, 14, 37);
    doc.text(
      `Booking Date: ${new Date(booking.booking_date).toLocaleString()}`,
      14,
      44
    );
    const fare = parseFloat(booking.fare_paid?.value || booking.fare_paid || 0);
    const flightData = [
      ["Airline", flight.airline_name || "N/A"],
      ["Flight Number", flight.flight_number || "N/A"],
      ["From", flight.source_airport || "N/A"],
      ["To", flight.destination_airport || "N/A"],
      ["Seat No", booking.seat_no || "N/A"],
      ["Fare Paid", `₹${fare.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 55,
      head: [["Detail", "Information"]],
      body: flightData,
      styles: { halign: "left" },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save(`Booking_${booking.pnr}.pdf`);
  };

  if (loading) return <div className="text-center py-20">Loading booking details...</div>;
  if (error) return <div className="text-center text-red-600 py-20">{error}</div>;
  if (!booking) return <div className="text-center text-gray-500 py-20">No booking found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">✅</div>
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Booking Confirmed</h2>
            <div className="text-black mt-1">
              PNR: <span className="font-semibold text-blue-600">{booking.pnr}</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-300 rounded-xl">
            <div className="text-sm text-blue-600 font-medium mb-1">Flight</div>
            <div className="font-semibold text-black">
              {flight?.airline_name || "Unknown Airline"} • {flight?.flight_number || ""}
            </div>
            <div className="text-black/70 mt-1">
              {flight?.source_airport} → {flight?.destination_airport}
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-xl">
            <div className="text-sm text-blue-600 font-medium mb-1">Seat / Fare</div>
            <div className="font-semibold text-black">Seat {booking.seat_no}</div>
            <div className="text-black/70 mt-1">₹{booking.fare_paid}</div>
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
            onClick={downloadPDF}
            disabled={!flight}
            className={`flex-1 text-center px-4 py-3 rounded-xl font-semibold shadow transition ${
              flight
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            Download Receipt (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
