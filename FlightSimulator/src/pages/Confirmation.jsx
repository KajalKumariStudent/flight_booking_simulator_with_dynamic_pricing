import React, { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BACKEND } from "../config.js";
import logo from "../assets/logo.png";

export default function Confirmation() {
  const { pnr } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch booking by PNR if not already available
  useEffect(() => {
    async function fetchBooking() {
      if (!pnr) return;
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND}/bookings/${pnr}`);
        if (!res.ok) throw new Error("Failed to fetch booking");
        const data = await res.json();
        console.log("🛰️ Booking API Response:", data);
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [pnr]);

  // ✅ Download as PDF (UI and text unchanged)
  const downloadPDF = () => {
  if (!booking) return;

  const storedPassenger = JSON.parse(localStorage.getItem("passenger"));
  const passengerName = storedPassenger?.full_name || "N/A";
  const passengerEmail = storedPassenger?.email || "N/A";
  const passengerPhone = storedPassenger?.phone || "9873456789";

  const doc = new jsPDF();

  const logoImg = new Image();
  logoImg.src = logo;

  logoImg.onload = () => {
    // === HEADER ===
    const logoX = 14, logoY = 10, logoSize = 20;
    doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);

    const centerX = 110;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("e-Ticket", centerX, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      "This is your E-Ticket Itinerary. Please carry a copy for check-in and security verification.",
      14,
      32,
      { maxWidth: 180 }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Important Information", 14, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const info = [
      "• This document serves as your travel e-ticket. Each passenger must carry a copy.",
      "• Arrive 3 hours before international flights and 2 hours before domestic flights.",
      "• Boarding closes 15 minutes prior to departure.",
    ];
    doc.text(info, 14, 48);

    const sectionHeader = (title, y) => {
      doc.setFillColor(230, 230, 230);
      doc.rect(14, y - 5, 182, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, 16, y);
    };

    // === TICKET INFORMATION ===
    sectionHeader("TICKET INFORMATION", 68);

    const bookingDate = new Date(booking.booking_date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const ticketInfo = [
      ["Ticket Reference", booking.pnr],
      ["Booking Date & Time", bookingDate],
      ["Status", booking.status],
      ["Class", "Economy"],
    ];

    autoTable(doc, {
      startY: 72,
      body: ticketInfo,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    // === PASSENGER INFORMATION ===
    sectionHeader("PASSENGER INFORMATION", doc.lastAutoTable.finalY + 8);

    const passengerInfoBody = booking.passengers?.flatMap((p, index) => [
      ["S No.", (index + 1).toString()],
      ["Passenger Name", p.full_name.toUpperCase()],
      ["Age", p.age.toString()],
      ["Gender", p.gender.charAt(0).toUpperCase() + p.gender.slice(1)],
      ["Class", p.class || booking.class || "Economy"]
    ]) || [
      ["S No.", "1"],
      ["Passenger Name", passengerName.toUpperCase()],
      ["Age", "24"],
      ["Gender", "Male"],
      ["Class", booking.class || "Economy"]
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      body: passengerInfoBody,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    // === FLIGHT INFORMATION ===
    sectionHeader("FLIGHT INFORMATION", doc.lastAutoTable.finalY + 8);

    const flights = booking.flights || [booking]; // fallback for one-way
    const flightInfo = [];
    flights.forEach((f, idx) => {
      const isOnward = idx === 0; // first = onward, second = return (for round trip)
      // 🪑 Select seat numbers based on the flight index
      const seatList = booking.passengers
        ?.map((p) =>
          isOnward ? p.seat_no || "—" : p.return_seat_no || "—"
        )
        .join(", ") || "—";
      flightInfo.push(
        ["Airline", f.airline_name || "—"],
        ["Flight Number", f.flight_number || "—"],
        ["From", f.source || "—"],
        ["To", f.destination || "—"],
        ["Seat(s)", seatList]
      );
      
      if (idx === 0 && flights.length > 1) {
        // separator for onward/return
        flightInfo.push(["---", "---"]);
      }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      body: flightInfo,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    // === FARE DETAILS ===
    sectionHeader("FARE DETAILS", doc.lastAutoTable.finalY + 8);

    // ✅ Use the backend-provided total fare directly
    const totalFare = booking.total_fare || booking.fare_paid || 0;

    // You can derive base and taxes for visual breakdown
    const baseFare = totalFare * 0.85;
    const taxesAndFees = totalFare * 0.15;
    const discount = booking.discount || 0;

    const fareInfo = [
      ["Base Fare", `INR ${baseFare.toFixed(2)}`],
      ["Taxes & Fees", `INR ${taxesAndFees.toFixed(2)}`],
      ["Discount", `INR (-) ${discount.toFixed(2)}`],
      ["Total Fare Paid", `INR ${totalFare.toFixed(2)}`],
    ];


    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      body: fareInfo,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
    });

    // === FOOTER ===
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("© 2025 Flight Inc. All rights reserved.", 105, 285, { align: "center" });

    doc.save(`Booking_${booking.pnr}.pdf`);
  };
};


  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-600 font-semibold text-lg">
        Fetching your booking details...
      </div>
    );

  if (error)
    return <div className="text-center text-red-600 py-20">{error}</div>;
  if (!booking)
    return <div className="text-center text-gray-500 py-20">No booking found.</div>;

  // --- Compute total fare for all passengers ---
  const totalFare = booking.total_fare || booking.fare_paid || 0;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {booking.overall_status === "CANCELLED"
              ? "❌"
              : booking.overall_status === "PARTIALLY_CANCELLED"
              ? "🟠"
              : "✅"}
          </div>
          <div>
            <h2
              className={`text-2xl font-bold ${
                booking.overall_status === "CANCELLED"
                  ? "text-red-600"
                  : booking.overall_status === "PARTIALLY_CANCELLED"
                  ? "text-orange-500"
                  : "text-blue-600"
              }`}
            >
              {booking.overall_status === "CANCELLED"
                ? "Booking Cancelled"
                : booking.overall_status === "PARTIALLY_CANCELLED"
                ? "Partially Cancelled"
                : "Booking Confirmed"}
            </h2>
            <div className="text-black mt-1">
              PNR:{" "}
              <span className="font-semibold text-blue-600">{booking.pnr}</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4">
          {(booking.flights || []).length > 0 ? (
            booking.flights.map((f, i) => {
              const isOnward = !f.is_return_leg && i === 0;

              // Get seat info based on flight direction
              const seatList =
                booking.passengers
                  ?.map((p) =>
                    isOnward ? p.seat_no || "—" : p.return_seat_no || "—"
                  )
                  .join(", ") || "—";

              // Flight-specific status badge
              const statusBadge =
                f.status === "CANCELLED" ? (
                  <span className="text-red-600 font-semibold">❌ Cancelled</span>
                ) : f.status === "PARTIALLY_CANCELLED" ? (
                  <span className="text-orange-500 font-semibold">
                    🟠 Partially Cancelled
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold">✅ Confirmed</span>
                );

              return (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Flight Details */}
                  <div className="p-4 border border-gray-300 rounded-xl">
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isOnward ? "text-blue-600" : "text-green-600"
                      }`}
                    >
                      {isOnward ? "Onward Flight" : "Return Flight"}
                    </div>
                    <div className="font-semibold text-black">
                      {f.airline_name} • {f.flight_number}
                    </div>
                    <div className="text-black/70 mt-1">
                      {f.source} → {f.destination}
                    </div>
                    <div className="mt-2">{statusBadge}</div>
                  </div>

                  {/* Right: Seat / Fare */}
                  <div className="p-4 border border-gray-300 rounded-xl">
                    <div className="text-sm text-blue-600 font-medium mb-1">
                      Seats / Total Fare
                    </div>
                    <div className="font-semibold text-black">
                      Seats: {seatList}
                    </div>
                    <div className="text-black/70 mt-1">
                      ₹{(booking.total_fare || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-600 text-center">
              No flight details available.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            to="/bookings"
            className="flex-1 text-center px-4 py-3 border border-blue-600 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Go to My Bookings
          </Link>

          {/* ✅ Download PDF button (disabled only if all cancelled) */}
          <button
            onClick={downloadPDF}
            disabled={booking.overall_status === "CANCELLED"}
            className={`flex-1 text-center px-4 py-3 rounded-xl font-semibold shadow transition ${
              booking.overall_status !== "CANCELLED"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {booking.overall_status === "CANCELLED"
              ? "Download Disabled (Cancelled)"
              : "Download Receipt (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}