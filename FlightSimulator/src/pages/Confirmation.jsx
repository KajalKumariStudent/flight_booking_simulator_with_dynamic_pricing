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

 


  // ✅ Download as PDF 
  const downloadPDF = () => {
  if (!booking) return;

  const storedPassenger = JSON.parse(localStorage.getItem("passenger"));
  const passengerName = storedPassenger?.full_name || "N/A";
  const passengerEmail = storedPassenger?.email || "N/A";
  const passengerPhone = storedPassenger?.phone || "9873456789";

  const doc = new jsPDF();

  // === HEADER ===
  const logoImg = new Image();
  logoImg.src = logo;

  logoImg.onload = () => {
    // Logo
    const logoX = 14, logoY = 10, logoSize = 20;
    doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);

    // Title
    const centerX = 110;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("e-Ticket", centerX, 20, { align: "center" });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      "This is your E-Ticket Itinerary. Please carry a copy for check-in and security verification.",
      14,
      32,
      { maxWidth: 180 }
    );

    // Important Info
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

    // Section Header Helper
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

    const passengerInfo = [
      ["S No.", "1"],
      ["Passenger Name", passengerName.toUpperCase()],
      ["Email", passengerEmail],
      ["Mobile", passengerPhone],
      ["Class", "Economy"],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      body: passengerInfo,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    // === FLIGHT INFORMATION ===
    sectionHeader("FLIGHT INFORMATION", doc.lastAutoTable.finalY + 8);

    const flightInfo = [
      ["Airline", booking.airline_name || "—"],
      ["Flight Number", booking.flight_number || "—"],
      ["From", booking.source || "—"],
      ["To", booking.destination || "—"],
      ["Seat No.", booking.seat_no || "—"],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      body: flightInfo,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    // === FARE DETAILS ===
    sectionHeader("FARE DETAILS", doc.lastAutoTable.finalY + 8);

    // assume example fare breakdown (replace as per your logic)
    const baseFare = (booking.fare_paid || 0) * 0.85;
    const taxesAndFees = (booking.fare_paid || 0) * 0.15;
    const discount = (booking.discount || 0);
    const totalFare = booking.fare_paid || 0;

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
    doc.text("© 2025 Flight Inc. All rights reserved.", 105, 285, {
      align: "center",
    });

    doc.save(`Booking_${booking.pnr}.pdf`);
  };
};




  if (loading)
    return <div className="text-center py-20">Loading booking details...</div>;
  if (error)
    return <div className="text-center text-red-600 py-20">{error}</div>;
  if (!booking)
    return <div className="text-center text-gray-500 py-20">No booking found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {booking.status === "CANCELLED" ? "❌" : "✅"}
          </div>
          <div>
            <h2
              className={`text-2xl font-bold ${
                booking.status === "CANCELLED" ? "text-red-600" : "text-blue-600"
              }`}
            >
              {booking.status === "CANCELLED"
                ? "Booking Cancelled"
                : "Booking Confirmed"}
            </h2>
            <div className="text-black mt-1">
              PNR:{" "}
              <span className="font-semibold text-blue-600">{booking.pnr}</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-300 rounded-xl">
            <div className="text-sm text-blue-600 font-medium mb-1">Flight</div>
            <div className="font-semibold text-black">
              {booking?.airline_name || "Unknown Airline"} •{" "}
              {booking?.flight_number || ""}
            </div>
            <div className="text-black/70 mt-1">
              {booking?.source} → {booking?.destination}
            </div>
          </div>

          <div className="p-4 border border-gray-300 rounded-xl">
            <div className="text-sm text-blue-600 font-medium mb-1">
              Seat / Fare
            </div>
            <div className="font-semibold text-black">
              Seat {booking.seat_no}
            </div>
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

          {/* ✅ Download PDF button */}
          <button
            onClick={downloadPDF}
            disabled={booking.status?.toUpperCase() === "CANCELLED"}
            className={`flex-1 text-center px-4 py-3 rounded-xl font-semibold shadow transition ${
              booking.status?.toUpperCase() === "CONFIRMED"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {booking.status?.toUpperCase() === "CANCELLED"
              ? "Download Disabled (Cancelled)"
              : "Download Receipt (PDF)"}
        </button>

        </div>
      </div>
    </div>
  );
}
