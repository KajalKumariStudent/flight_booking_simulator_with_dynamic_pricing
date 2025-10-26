import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBookings, cancelBooking } from "../api/api";


export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
  let mounted = true;
  setLoading(true);
  getBookings().then(data => { if (mounted) setBookings(data) }).catch(e => { if (mounted) setError(e.message) }).finally(() => { if (mounted) setLoading(false) });
  return () => { mounted = false }
  }, []);


  async function handleCancel(pnr) {
  try {
  await cancelBooking(pnr);
  setBookings(prev => prev.map(b => b.pnr === pnr ? { ...b, status: 'Cancelled' } : b));
  } catch (e) {
  alert('Failed to cancel: ' + e.message)
  }
  }


  if (loading) return <div>Loading bookings...</div>
  if (error) return <div className="text-red-600">Failed to load bookings: {error}</div>


  return (
    <div>
      <h2 className="text-2xl text-blue-600 font-semibold mb-4">My Bookings</h2>
      <div className="space-y-3">
        {bookings.length === 0 && <div className="p-4 bg-muted rounded">No bookings found.</div>}
        {bookings.map((b, index) => (
          <div key={b.pnr || b.booking_id || index} className="bg-white border rounded p-4 flex items-center justify-between">

          <div>
            <div className="font-semibold">{b.route || (b.flight?.from + ' → ' + b.flight?.to)} • {b.date || b.created_at?.split?.('T')?.[0]}</div>
              <div className="text-sm text-slate-500">PNR: {b.pnr}</div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${b.status === "Confirmed" ? "text-green-600" : "text-red-500"}`}>{b.status}</div>
              <div className="mt-2">
              <Link to="#" className="text-sm text-slate-600 mr-2">View</Link>
              {b.status !== 'Cancelled' && <button onClick={() => handleCancel(b.pnr)} className="text-sm text-red-600">Cancel</button>}
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}