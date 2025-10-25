import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function Home() {
const nav = useNavigate();
const [from, setFrom] = useState("DEL");
const [to, setTo] = useState("BOM");
const [date, setDate] = useState("");
const [trip, setTrip] = useState("oneway");


function submit(e) {
e.preventDefault();
nav("/search", { state: { from, to, date, trip } });
}


return (
<div className="grid grid-cols-12 gap-8">
<section className="col-span-7">
<div className="bg-white rounded-lg shadow p-8">
<h1 className="text-2xl font-bold mb-3">Book your flight with real-time pricing simulation</h1>
<p className="text-slate-600 mb-6">Search flights, select seats, and simulate dynamic fare changes.</p>


<form onSubmit={submit} className="grid grid-cols-2 gap-4">
<div>
<label className="block text-sm text-slate-600">From</label>
<input value={from} onChange={e=>setFrom(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
</div>
<div>
<label className="block text-sm text-slate-600">To</label>
<input value={to} onChange={e=>setTo(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
</div>
<div>
<label className="block text-sm text-slate-600">Departure</label>
<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
</div>
<div>
<label className="block text-sm text-slate-600">Trip type</label>
<select value={trip} onChange={e=>setTrip(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
<option value="oneway">One-way</option>
<option value="round">Round-trip</option>
</select>
</div>


<div className="col-span-2 mt-3">
<button className="bg-blue text-black px-5 py-2 rounded">Search Flights</button>
</div>
</form>
</div>
</section>


<aside className="col-span-5">
<div className="bg-muted rounded-lg p-6">
<h3 className="font-semibold mb-2">Why FlightSim?</h3>
<ul className="text-sm text-slate-700">
<li>• Dynamic pricing simulation based on seat availability and time-to-departure.</li>
<li>• Simulate concurrent bookings and FAKE inventory constraints.</li>
<li>• Learn transactional booking flows and PNR generation.</li>
</ul>
</div>
</aside>
</div>
);
}