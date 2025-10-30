import asyncio
import random
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func
from database import SessionLocal, engine
import models, schemas, pricing, utils
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from utils import hash_password, verify_password
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional


models.Base.metadata.create_all(bind=engine)

# -------------------------
# Lifespan (replaces on_event)
# -------------------------
async def market_loop():
    await asyncio.sleep(1)
    while True:
        await simulate_market_step()
        await asyncio.sleep(30)  # run every 30 seconds

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(market_loop())
    yield

# Create FastAPI app once (before defining routes)
app = FastAPI(title="Flight Booking Simulator (Upgraded)", lifespan=lifespan)

# -------------------------
# CORS Middleware (Allow Frontend Access)
# -------------------------


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# DB Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
# -------------------------
# Root Endpoint 
# -------------------------
@app.get("/")
def root():
    return {"message": "Flight Booking Simulator API is running"}


# -------------------------
# Flight listing & search
# -------------------------
@app.get("/flights", response_model=list[schemas.FlightOut])
def list_flights(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    try:
        src = aliased(models.Airport)
        dst = aliased(models.Airport)

        flights = (
            db.query(
                models.Flight.flight_id,
                models.Flight.flight_number,
                models.Flight.departure_time,
                models.Flight.arrival_time,
                models.Flight.available_seats,
                models.Flight.total_seats,
                models.Flight.base_fare,
                models.Airline.airline_name,
                src.city.label("source_airport"),
                dst.city.label("destination_airport"),
            )
            .join(models.Airline, models.Flight.airline_id == models.Airline.airline_id)
            .join(src, models.Flight.source_airport == src.airport_id)
            .join(dst, models.Flight.destination_airport == dst.airport_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for f in flights:
            dynamic_price = pricing.calculate_dynamic_price(
                base_fare=f.base_fare,
                available_seats=f.available_seats,
                total_seats=f.total_seats,
                departure=f.departure_time,
            )
            result.append({
                "flight_id": f.flight_id,
                "flight_number": f.flight_number,
                "departure_time": f.departure_time,
                "arrival_time": f.arrival_time,
                "available_seats": f.available_seats,
                "total_seats": f.total_seats,
                "base_fare": float(f.base_fare),
                "dynamic_price": dynamic_price,
                "airline_name": f.airline_name,
                "source_airport": f.source_airport,
                "destination_airport": f.destination_airport,
            })

        return result

    except Exception as e:
        print("❌ Flights endpoint error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/flights/{flight_id}", response_model=schemas.FlightOut)
def get_flight_by_id(flight_id: int, db: Session = Depends(get_db)):
    """
    Return full flight details by flight_id, including airline and airport info.
    """
    src = aliased(models.Airport)
    dst = aliased(models.Airport)

    f = (
        db.query(
            models.Flight.flight_id,
            models.Flight.flight_number,
            models.Flight.departure_time,
            models.Flight.arrival_time,
            models.Flight.available_seats,
            models.Flight.total_seats,
            models.Flight.base_fare,
            models.Airline.airline_name,
            src.city.label("source_airport"),
            dst.city.label("destination_airport"),
        )
        .join(models.Airline, models.Flight.airline_id == models.Airline.airline_id)
        .join(src, models.Flight.source_airport == src.airport_id)
        .join(dst, models.Flight.destination_airport == dst.airport_id)
        .filter(models.Flight.flight_id == flight_id)
        .first()
    )

    if not f:
        raise HTTPException(status_code=404, detail="Flight not found")

    # ✅ Optionally compute dynamic fare for the response
    dynamic_price = pricing.calculate_dynamic_price(
        base_fare=f.base_fare,
        available_seats=f.available_seats,
        total_seats=f.total_seats,
        departure=f.departure_time,
    )

    return {
        "flight_id": f.flight_id,
        "flight_number": f.flight_number,
        "departure_time": f.departure_time,
        "arrival_time": f.arrival_time,
        "available_seats": f.available_seats,
        "total_seats": f.total_seats,
        "base_fare": float(f.base_fare),
        "dynamic_price": dynamic_price,
        "airline_name": f.airline_name,
        "source_airport": f.source_airport,
        "destination_airport": f.destination_airport,
    }


@app.get("/search", response_model=list[schemas.FlightOut])
def search_flights(
    origin: str = Query(None),
    destination: str = Query(None),
    travel_date: str = Query(None),
    sort_by: str = Query("price", regex="^(price|duration)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    try:
        src = aliased(models.Airport)
        dst = aliased(models.Airport)

        q = (
            db.query(
                models.Flight.flight_id,
                models.Flight.flight_number,
                models.Flight.departure_time,
                models.Flight.arrival_time,
                models.Flight.available_seats,
                models.Flight.total_seats,
                models.Flight.base_fare,
                models.Airline.airline_name,
                src.city.label("source_airport"),
                dst.city.label("destination_airport"),
            )
            .join(models.Airline, models.Flight.airline_id == models.Airline.airline_id)
            .join(src, models.Flight.source_airport == src.airport_id)
            .join(dst, models.Flight.destination_airport == dst.airport_id)
        )

        # Handle filters
        if origin:
            q = q.filter(func.lower(src.city) == origin.lower())
        if destination:
            q = q.filter(func.lower(dst.city) == destination.lower())

        if travel_date:
            td = datetime.strptime(travel_date, "%Y-%m-%d").date()
            q = q.filter(func.date(models.Flight.departure_time) == td)

        # Sorting
        if sort_by == "price":
            q = q.order_by(models.Flight.base_fare.asc() if order == "asc" else models.Flight.base_fare.desc())
        elif sort_by == "duration":
            duration_expr = func.extract("epoch", models.Flight.arrival_time - models.Flight.departure_time)
            q = q.order_by(duration_expr.asc() if order == "asc" else duration_expr.desc())

        flights = q.offset(skip).limit(limit).all()

        result = []
        for f in flights:
            dynamic_price = pricing.calculate_dynamic_price(
                base_fare=f.base_fare,
                available_seats=f.available_seats,
                total_seats=f.total_seats,
                departure=f.departure_time,
            )
            result.append({
                "flight_id": f.flight_id,
                "flight_number": f.flight_number,
                "departure_time": f.departure_time,
                "arrival_time": f.arrival_time,
                "available_seats": f.available_seats,
                "total_seats": f.total_seats,
                "base_fare": float(f.base_fare),
                "dynamic_price": dynamic_price,
                "airline_name": f.airline_name,
                "source_airport": f.source_airport,
                "destination_airport": f.destination_airport,
            })

        return result

    except Exception as e:
        print("❌ Search endpoint error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------
# Seat Availability Endpoint
# -------------------------
@app.get("/flights/{flight_id}/seats")
def get_seat_availability(flight_id: int, db: Session = Depends(get_db)):
    """
    Returns total seats, available seats, and a simulated list of available seat numbers.
    """
    flight = db.query(models.Flight).filter(models.Flight.flight_id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")

    # Optional: generate a simple list of available seat numbers
    total = flight.total_seats
    available = flight.available_seats

    # This generates seat numbers like [1, 2, 3, ... available]
    available_seat_numbers = [i for i in range(1, total + 1)][:available]

    return {
        "flight_id": flight.flight_id,
        "total_seats": total,
        "available_seats": available,
        "available_seat_numbers": available_seat_numbers
    }


# -------------------------
# Dynamic Price Endpoint
# -------------------------
@app.get("/flights/{flight_id}/price", response_model=schemas.PriceResponse)
def get_price(flight_id: int, db: Session = Depends(get_db)):
    f = db.query(models.Flight).filter(models.Flight.flight_id == flight_id).first()
    if not f:
        raise HTTPException(404, "Flight not found")
    price = pricing.calculate_dynamic_price(float(f.base_fare), f.available_seats, f.total_seats, f.departure_time)
    return {
        "flight_id": f.flight_id,
        "flight_number": f.flight_number,
        "dynamic_price": price,
        "base_fare": float(f.base_fare),
        "available_seats": f.available_seats
    }
# -------------------------
# Airport Endpoints
# -------------------------
@app.get("/airports")
def list_airports(db: Session = Depends(get_db)):
    airports = (
        db.query(models.Airport.airport_id, models.Airport.city, models.Airport.country)
        .order_by(models.Airport.city.asc())
        .all()
    )
    return [{"airport_id": a.airport_id, "city": a.city, "country": a.country} for a in airports]


# -------------------------
# Passenger Endpoints
# -------------------------
@app.post("/passengers", response_model=schemas.PassengerOut, status_code=201)
def create_passenger(payload: schemas.PassengerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Passenger).filter(models.Passenger.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Passenger with this email already exists")
    
    # Hash the password before storing
    hashed_pw = utils.hash_password(payload.password)
    
    p = models.Passenger(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hashed_pw
    )
    
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

# Signup
@app.post("/passengers/signup", response_model=schemas.PassengerOut, status_code=201)
def signup_passenger(payload: schemas.PassengerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Passenger).filter(models.Passenger.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Passenger already exists")
    hashed_pw = utils.hash_password(payload.password)
    p = models.Passenger(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hashed_pw
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

# Login
@app.post("/passengers/login")
def login_passenger(payload: schemas.PassengerLogin, db: Session = Depends(get_db)):
    passenger = db.query(models.Passenger).filter(models.Passenger.email == payload.email).first()
    
    if not passenger:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    try:
        valid = utils.verify_password(payload.password, passenger.hashed_password)
    except Exception:
        valid = False
    
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "passenger_id": passenger.passenger_id,
        "full_name": passenger.full_name,
        "email": passenger.email
    }


# -------------------------
# Booking Endpoints
# -------------------------
@app.post("/bookings", response_model=schemas.BookingOut, status_code=201)
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    try:
        flight = db.query(models.Flight).filter(models.Flight.flight_id == payload.flight_id).with_for_update().first()
        if not flight:
            raise HTTPException(status_code=404, detail="Flight not found")
        if flight.available_seats <= 0:
            raise HTTPException(status_code=400, detail="No seats available")

        passenger = db.query(models.Passenger).filter(models.Passenger.passenger_id == payload.passenger_id).first()
        if not passenger:
            raise HTTPException(status_code=404, detail="Passenger not found")

        seat_no = payload.seat_no or random.randint(1, flight.total_seats)
        price = pricing.calculate_dynamic_price(float(flight.base_fare), flight.available_seats, flight.total_seats, flight.departure_time)
        flight.available_seats = max(0, flight.available_seats - 1)

        pnr = None
        for _ in range(5):
            candidate = utils.generate_pnr(8)
            if db.query(models.Booking).filter(models.Booking.pnr == candidate).first() is None:
                pnr = candidate
                break
        if pnr is None:
            pnr = f"PNR{int(datetime.now(timezone.utc).timestamp())}"

        booking = models.Booking(
            flight_id=payload.flight_id,
            passenger_id=payload.passenger_id,
            seat_no=seat_no,
            fare_paid=price,
            booking_date=datetime.now(timezone.utc),
            status="CONFIRMED",
            pnr=pnr
        )
        db.add(booking)
        db.add(models.FareHistory(flight_id=flight.flight_id, price=price))
        db.commit()
        db.refresh(booking)
        return booking
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Booking failed: {exc}")

@app.get("/bookings")
def list_bookings(
    passenger_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    src = aliased(models.Airport)
    dst = aliased(models.Airport)

    q = (
        db.query(
            models.Booking,
            models.Flight,
            models.Airline.airline_name,
            src.city.label("source_city"),
            dst.city.label("destination_city"),
        )
        .join(models.Flight, models.Booking.flight_id == models.Flight.flight_id)
        .join(models.Airline, models.Flight.airline_id == models.Airline.airline_id)
        .join(src, models.Flight.source_airport == src.airport_id)
        .join(dst, models.Flight.destination_airport == dst.airport_id)
    )

    # ✅ Filter by passenger_id if provided
    if passenger_id is not None:
        q = q.filter(models.Booking.passenger_id == passenger_id)

    results = q.all()

    return [
        {
            "pnr": b.pnr,
            "status": b.status,
            "fare_paid": float(b.fare_paid),
            "seat_no": b.seat_no,
            "booking_date": b.booking_date,
            "flight_number": f.flight_number,
            "airline_name": airline_name,
            "source": source_city,
            "destination": destination_city,
            "passenger_id": b.passenger_id,
        }
        for b, f, airline_name, source_city, destination_city in results
    ]

@app.get("/bookings/{pnr}", response_model=schemas.BookingOut)
def get_booking_by_pnr(pnr: str, db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.pnr == pnr).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b

@app.post("/bookings/{pnr}/pay")
def pay_booking(pnr: str, db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.pnr == pnr).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    success = random.random() < 0.9
    b.status = "PAID" if success else "PAYMENT_FAILED"
    db.commit()
    return {"message": "Payment successful" if success else "Payment failed", "pnr": b.pnr, "status": b.status}

@app.post("/bookings/{pnr}/cancel")
def cancel_booking(pnr: str, db: Session = Depends(get_db)):
    try:
        b = db.query(models.Booking).filter(models.Booking.pnr == pnr).with_for_update().first()
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        if b.status == "CANCELLED":
            return {"message": "Already cancelled", "pnr": pnr}

        flight = db.query(models.Flight).filter(models.Flight.flight_id == b.flight_id).first()
        if flight:
            flight.available_seats = min(flight.total_seats, flight.available_seats + 1)
        b.status = "CANCELLED"
        db.commit()
        return {"message": "Cancelled", "pnr": pnr}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Cancel failed: {exc}")

# -------------------------
# Fare History
# -------------------------
@app.get("/flights/{flight_id}/fare_history")
def fare_history(flight_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.FareHistory).filter(models.FareHistory.flight_id == flight_id).order_by(models.FareHistory.recorded_at.desc()).limit(100).all()
    return [{"recorded_at": r.recorded_at, "price": float(r.price)} for r in rows]

# -------------------------
# Market Simulation
# -------------------------
async def simulate_market_step(interval_seconds: int = 30):
    db = SessionLocal()
    try:
        flights = db.query(models.Flight).all()
        for f in flights:
            # simulate seat changes
            if random.random() < 0.12 and f.available_seats > 0:
                reduce_by = random.randint(1, min(3, f.available_seats))
                f.available_seats -= reduce_by
            elif random.random() < 0.04 and f.available_seats < f.total_seats:
                inc = random.randint(1, min(2, f.total_seats - f.available_seats))
                f.available_seats += inc

            # compute dynamic price and record in FareHistory (do not store in Flight)
            price = pricing.calculate_dynamic_price(
                base_fare=f.base_fare,
                available_seats=f.available_seats,
                total_seats=f.total_seats,
                departure=f.departure_time
            )
            db.add(models.FareHistory(flight_id=f.flight_id, price=price))

        db.commit()
    except Exception as e:
        db.rollback()
        print("Market simulation error:", e)
    finally:
        db.close()
