# schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date

# Airlines/Airports
class AirlineOut(BaseModel):
    airline_id: int
    airline_name: str
    iata_code: Optional[str]
    class Config: orm_mode = True

class AirportOut(BaseModel):
    airport_id: int
    airport_name: str
    city: Optional[str]
    country: Optional[str]
    class Config: orm_mode = True

# Flight
class FlightOut(BaseModel):
    flight_id: int
    flight_number: str
    airline_id: Optional[int] = None
    source_airport: Optional[int] = None
    destination_airport: Optional[int] = None
    departure_time: datetime
    arrival_time: datetime
    base_fare: float
    total_seats: int
    available_seats: int
    flight_type: Optional[str] = None
    travel_date: Optional[date] = None
    dynamic_price: Optional[float] = None
    class Config:
        orm_mode = True


# Passenger
class PassengerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str]
    password: str
    
    class Config:
        orm_mode = True

class PassengerLogin(BaseModel):
    email: EmailStr
    password: str 

    class Config:
        orm_mode = True


class PassengerOut(PassengerCreate):
    passenger_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

    class Config:
        orm_mode = True

# Booking(milestone 3)
class BookingCreate(BaseModel):
    flight_id: int
    passenger_id: int
    seat_no: Optional[str] = None

class BookingOut(BaseModel):
    booking_id: int
    flight_id: int
    passenger_id: int
    seat_no: Optional[int]
    fare_paid: Optional[float]
    booking_date: Optional[datetime]
    status: str
    pnr: Optional[str] = None
    class Config: orm_mode = True

# Price responses
class PriceResponse(BaseModel):
    flight_id: int
    flight_number: str
    dynamic_price: float
    base_fare: float
    available_seats: int
    class Config: orm_mode = True
