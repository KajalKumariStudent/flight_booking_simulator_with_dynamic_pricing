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
    <div className="grid grid-cols-3 gap-6">
<section className="col-span-2 bg-white p-6 rounded-lg shadow">
<h3 className="text-lg font-semibold mb-4">Payment — {booking?.id || bookingId}</h3>


{error && <div className="mb-4 text-sm text-red-600">{error}</div>}


<form onSubmit={pay} className="space-y-4">
<div>
<label className="text-sm text-slate-600 block mb-1">Payment Method</label>
<select value={method} onChange={e => setMethod(e.target.value)} className="border rounded w-56 p-2">
<option value="card">Credit / Debit Card</option>
<option value="upi">UPI</option>
<option value="netbanking">NetBanking</option>
</select>
</div>


{method === "card" && (
<div className="grid grid-cols-2 gap-3">
<input placeholder="Card number" value={card.number} onChange={e=>setCard({...card, number:e.target.value})} className="border p-2 rounded" required />
<input placeholder="Name on card" value={card.name} onChange={e=>setCard({...card, name:e.target.value})} className="border p-2 rounded" required />
<input placeholder="MM/YY" value={card.exp} onChange={e=>setCard({...card, exp:e.target.value})} className="border p-2 rounded" required />
<input placeholder="CVV" value={card.cvv} onChange={e=>setCard({...card, cvv:e.target.value})} className="border p-2 rounded" required />
</div>
)}


{method === "upi" && (
<div>
<input placeholder="UPI ID" className="border p-2 rounded w-64" />
</div>
)}


<div>
<button className="bg-primary text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Processing...' : 'Confirm & Pay'}</button>
</div>
</form>
</section>


<aside className="bg-muted p-6 rounded-lg">
<div className="font-semibold mb-3">Booking Summary</div>
<div className="text-sm text-slate-600 mb-2">{booking?.flight?.airline} • {booking?.flight?.flightNo}</div>
<div className="mb-4">Seats: <span className="font-medium">{booking?.seats?.join(", ")}</span></div>
<div className="text-xl font-bold">₹ {booking?.total || 1000}</div>
</aside>
</div>
  );
}
