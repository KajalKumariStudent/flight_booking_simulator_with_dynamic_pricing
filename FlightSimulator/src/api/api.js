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


export async function bookFlight(payload, tripType = "oneway") {
  console.log("✈️ Sending booking payload:", payload);

  // Choose endpoint based on trip type
  const endpoint =
    tripType === "round"
      ? `${BACKEND}/bookings/roundtrip`
      : `${BACKEND}/bookings/oneway`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleRes(res);
}


export async function payBooking(pnr) {
  const res = await fetch(`${BACKEND}/bookings/${pnr}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleRes(res);
}


export async function getBookings(passenger_id) {
  const res = await fetch(`${BACKEND}/bookings?passenger_id=${passenger_id}`);
  if (!res.ok) throw new Error("Failed to load bookings");
  return res.json();
}


export async function cancelBooking(pnr, leg = null) {
  // Build correct URL depending on whether "leg" is passed
  const url = leg
    ? `${BACKEND}/bookings/${pnr}/cancel?leg=${leg}`
    : `${BACKEND}/bookings/${pnr}/cancel`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  return handleRes(res);
}


export async function getFlightById(flight_id) {
  const res = await fetch(`${BACKEND}/flights/${flight_id}`);
  return handleRes(res);
}