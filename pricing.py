# pricing.py
from datetime import datetime
import random

def calculate_dynamic_price(
    base_fare: float,
    available_seats: int,
    total_seats: int,
    departure: datetime,
    demand_index: float = 1.0,
    tier_multiplier: float = 1.0
) -> float:
    """
    Compose price using:
    - seat scarcity: more sold => higher
    - time to departure: gets more expensive as departure approaches
    - demand index: external demand multiplier
    - tier_multiplier: reserved for airline tier (1.0 default)
    """
    try:
        base = float(base_fare)
    except Exception:
        base = float(base_fare or 0.0)

    total_seats = max(1, int(total_seats or 1))
    available_seats = max(0, int(available_seats or 0))

    sold_ratio = (total_seats - available_seats) / total_seats  # 0..1
    seat_factor = 1.0 + 0.6 * sold_ratio  # up to +60%

    now = datetime.utcnow()
    secs = (departure - now).total_seconds()
    days = secs / (3600 * 24)
    if days <= 0:
        time_factor = 1.5
    else:
        # closer -> higher multiplier; cap it
        time_factor = 1.0 + max(0, (30.0 / max(1.0, days))) * 0.05
        time_factor = min(time_factor, 1.6)

    demand_factor = max(0.5, min(2.0, demand_index))  # clamp

    jitter = random.uniform(0.97, 1.06)

    price = base * seat_factor * time_factor * demand_factor * tier_multiplier * jitter
    return round(price, 2)
