export function computeDynamicFare(baseFare, seatsLeft, totalSeats, daysUntil, demandIndex = 0.2) {
const scarcity = ((totalSeats - seatsLeft) / Math.max(totalSeats, 1)) * 0.5;
const demand = demandIndex * 0.4;
const timeFactor = daysUntil <= 7 ? (1 - daysUntil / 30) * 0.6 : 0;
const multiplier = 1 + scarcity + demand + timeFactor;
const jitter = (Math.sin(seatsLeft + daysUntil) + 1) * 0.01;
return Math.round(baseFare * multiplier * (1 + jitter));
}
