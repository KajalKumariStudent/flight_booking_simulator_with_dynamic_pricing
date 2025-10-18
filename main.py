import asyncio
import random
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal, engine
import models, schemas, pricing, utils
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager

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
    return db.query(models.Flight).offset(skip).limit(limit).all()

@app.get("/search", response_model=list[schemas.FlightOut])
def search_flights(
    origin: str = Query(None),
    destination: str = Query(None),
    travel_date: str = Query(None),
    sort_by: str = Query(None, regex="^(price|duration)$"),
    order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    q = db.query(models.Flight)
    if origin:
        q = q.join(models.Airport, models.Flight.source_airport == models.Airport.airport_id)
        q = q.filter(func.lower(models.Airport.city) == origin.lower())
    if destination:
        q = q.join(models.Airport, models.Flight.destination_airport == models.Airport.airport_id)
        q = q.filter(func.lower(models.Airport.city) == destination.lower())
    if travel_date:
        try:
            td = datetime.strptime(travel_date, "%Y-%m-%d").date()
            q = q.filter(models.Flight.travel_date == td)
        except Exception:
            raise HTTPException(status_code=400, detail="travel_date must be YYYY-MM-DD")

    flights = q.all()

    def duration_seconds(f):
        if f.arrival_time and f.departure_time:
            return (f.arrival_time - f.departure_time).total_seconds()
        return 0

    if sort_by == "price":
        flights.sort(key=lambda f: pricing.calculate_dynamic_price(
            base_fare=f.base_fare,
            available_seats=f.available_seats,
            total_seats=f.total_seats,
            departure=f.departure_time
        ), reverse=(order == "desc"))
    elif sort_by == "duration":
        flights.sort(key=duration_seconds, reverse=(order == "desc"))

    return flights

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
# Passenger Endpoints
# -------------------------
@app.post("/passengers", response_model=schemas.PassengerOut, status_code=201)
def create_passenger(payload: schemas.PassengerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Passenger).filter(models.Passenger.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Passenger with this email already exists")
    p = models.Passenger(**payload.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

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

@app.get("/bookings", response_model=list[schemas.BookingOut])
def list_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).all()

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
            if random.random() < 0.12 and f.available_seats > 0:
                reduce_by = random.randint(1, min(3, f.available_seats))
                f.available_seats -= reduce_by
                p = pricing.calculate_dynamic_price(float(f.base_fare), f.available_seats, f.total_seats, f.departure_time)
                db.add(models.FareHistory(flight_id=f.flight_id, price=p))
            elif random.random() < 0.04 and f.available_seats < f.total_seats:
                inc = random.randint(1, min(2, f.total_seats - f.available_seats))
                f.available_seats += inc
                p = pricing.calculate_dynamic_price(float(f.base_fare), f.available_seats, f.total_seats, f.departure_time)
                db.add(models.FareHistory(flight_id=f.flight_id, price=p))
        db.commit()
    except Exception as e:
        db.rollback()
        print("Market simulation error:", e)
    finally:
        db.close()
