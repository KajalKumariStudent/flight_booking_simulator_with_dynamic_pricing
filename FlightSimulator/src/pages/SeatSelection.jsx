import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getSeats, bookFlight } from "../api/api";


function Seat({ seatId, status, selected, onClick }) {
const base = "w-8 h-8 flex items-center justify-center rounded cursor-pointer text-xs border";
const classes = status === "unavailable" ? `${base} bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed`
: selected ? `${base} bg-blue-600 text-white border-blue-700` : `${base} bg-white border-slate-200 hover:shadow`;
return (
<div className={classes} onClick={() => status === "available" && onClick(seatId)}>
{seatId}
</div>
);
}

export default function SeatSelection({passenger}) {
  const { flightId } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const flight = location.state?.flight;


  const rows = 8;
  const cols = 6;
  const seats = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const id = `${r}${String.fromCharCode(64 + c)}`;
      seats.push(id);
    }
  }


  const [unavailable, setUnavailable] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    let mounted = true;
    async function fetchSeats() {
    setLoading(true);
    setError(null);
    try {
    const data = await getSeats(flightId);
    // backend expected to return something like { unavailableSeats: ['1A','2B'] }
    if (mounted) setUnavailable(new Set(data.unavailableSeats || data.unavailable || []));
    } catch (e) {
    setError(e.message);
    // fallback - mark a small slice as unavailable
    if (mounted) setUnavailable(new Set(seats.slice(3,9)));
    } finally { if (mounted) setLoading(false) }
    }
    fetchSeats();
    return () => { mounted = false }
  }, [flightId]);

  function toggle(seat) {
    if (unavailable.has(seat)) return;
    setSelected(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  }


  async function continueToPayment() {
    if (!passenger) {
    alert("You must login or signup before booking a seat.");
    nav("/login");
    return;
  }
  if (!selected.length) return;

  try {
    const payload = {
      flight_id: flight.flight_id,
      passenger_id: passenger.passenger_id,
      seat_no: selected[0]  // pick first seat for now
    };

    // Call backend to create booking
    const booking = await bookFlight(payload);

    // Navigate to MyBookings or a "Booking Details" page using the PNR
    nav(`/bookings/${booking.pnr}`, { state: { booking } });
  } catch (err) {
    alert("Booking failed: " + err.message);
  }
  }
  return (
<div className="grid grid-cols-3 gap-6">
  <section className="col-span-2 bg-gray-100 p-6 rounded-lg shadow">
  <h3 className="text-2xl text-blue-500 font-semibold mb-4">Select seats — Flight {flight?.flightNo || flightId}</h3>


  {loading && <div className="mb-4 text-sm">Loading seat availability...</div>}
  {error && <div className="mb-4 text-sm text-amber-600">{error}. Using local demo map.</div>}


  <div className="grid grid-cols-6 gap-3 justify-items-center">
    {seats.map(s => (
      <Seat key={s} seatId={s}
      status={unavailable.has(s) ? "unavailable" : "available"}
      selected={selected.includes(s)}
      onClick={toggle} />
   ))}
  </div>


  <div className="mt-6">
  <div className="text-sm text-slate-600">Selected: {selected.join(", ") || "None"}</div>
</div>
</section>


<aside className="bg-muted p-6 rounded-lg">
  <div className="font-semibold mb-2 text-2xl text-blue-500">Fare Summary</div>
  <div className="text-sm text-slate-600 mb-2">Base estimate (per seat)</div>
  <div className="text-xl font-bold mb-4">₹ {flight ? Math.round(flight.baseFare * 0.25) : 1200}</div>
  <button onClick={continueToPayment} className="w-full bg-blue-600 text-white py-2 rounded" disabled={selected.length===0}>
  Continue to Payment
  </button>
  </aside>
</div>
);
}