# models.py
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, DECIMAL, Enum, Date, Float, func, TIMESTAMP
)
from sqlalchemy.orm import relationship
from database import Base
import enum

class FlightType(enum.Enum):
    DOMESTIC = "DOMESTIC"
    INTERNATIONAL = "INTERNATIONAL"

class Airline(Base):
    __tablename__ = "airlines"
    airline_id = Column(Integer, primary_key=True, autoincrement=True)
    airline_name = Column(String(100), nullable=False)
    iata_code = Column(String(10), unique=True)
    flights = relationship("Flight", back_populates="airline")

class Airport(Base):
    __tablename__ = "airports"
    airport_id = Column(Integer, primary_key=True, autoincrement=True)
    airport_name = Column(String(100), nullable=False)
    city = Column(String(50))
    country = Column(String(50))

class Flight(Base):
    __tablename__ = "flights"
    flight_id = Column(Integer, primary_key=True, autoincrement=True)
    airline_id = Column(Integer, ForeignKey("airlines.airline_id"))
    flight_number = Column(String(20), unique=True)
    source_airport = Column(Integer, ForeignKey("airports.airport_id"))
    destination_airport = Column(Integer, ForeignKey("airports.airport_id"))
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    base_fare = Column(DECIMAL(12, 2))
    total_seats = Column(Integer, default=100)
    available_seats = Column(Integer, default=100)
    flight_type = Column(Enum(FlightType), default=FlightType.DOMESTIC)
    travel_date = Column(Date)

    airline = relationship("Airline", back_populates="flights")
    bookings = relationship("Booking", back_populates="flight")
    fare_history = relationship("FareHistory", back_populates="flight")

class Passenger(Base):
    __tablename__ = "passengers"
    passenger_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(15))
    bookings = relationship("Booking", back_populates="passenger")

class Booking(Base):
    __tablename__ = "bookings"
    booking_id = Column(Integer, primary_key=True, autoincrement=True)
    flight_id = Column(Integer, ForeignKey("flights.flight_id"))
    passenger_id = Column(Integer, ForeignKey("passengers.passenger_id"))
    seat_no = Column(Integer)
    fare_paid = Column(DECIMAL(10, 2))
    booking_date = Column(DateTime, server_default=func.now())
    status = Column(String(20), default="CONFIRMED")
    pnr = Column(String(12), unique=True, nullable=False)

    flight = relationship("Flight", back_populates="bookings")
    passenger = relationship("Passenger", back_populates="bookings")

class FareHistory(Base):
    __tablename__ = "fare_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    flight_id = Column(Integer, ForeignKey("flights.flight_id"))
    recorded_at = Column(TIMESTAMP, server_default=func.now())
    price = Column(DECIMAL(12,2))

    flight = relationship("Flight", back_populates="fare_history")
