import { BACKEND } from '../config.js'


async function handleRes(res) {
if (!res.ok) {
const text = await res.text()
let json
try { json = JSON.parse(text) } catch (e) { json = { detail: text } }
throw new Error(json.detail || res.statusText)
}
return res.json()
}



export async function searchFlights(origin, destination, travel_date, sort_by, order) {
  try {
    const params = new URLSearchParams();
    if (origin) params.append("origin", origin);
    if (destination) params.append("destination", destination);
    if (travel_date) params.append("travel_date", travel_date);
    if (sort_by) params.append("sort_by", sort_by);
    if (order) params.append("order", order);

    const res = await fetch(`http://localhost:8000/search?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
}



export async function getSeats(flightId) {
const res = await fetch(`${BACKEND}/flights/${flightId}/seats`)
return handleRes(res)
}


export async function bookFlight(payload) {
  console.log("✈️ Sending booking payload:", payload);
  const res = await fetch(`${BACKEND}/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
  })
  return handleRes(res)
}


export async function getBookings(passenger_id) {
  const res = await fetch(`${BACKEND}/bookings?passenger_id=${passenger_id}`);
  if (!res.ok) throw new Error("Failed to load bookings");
  return res.json();
}


export async function cancelBooking(pnr) {
const res = await fetch(`${BACKEND}/bookings/${pnr}/cancel`, { method: 'POST' })
return handleRes(res)
}