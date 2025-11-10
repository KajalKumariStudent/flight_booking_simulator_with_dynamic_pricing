# models.py
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, DECIMAL, Enum, Date, Float, func, TIMESTAMP, UniqueConstraint
)
from sqlalchemy.orm import relationship
from database import Base
import enum
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Boolean

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
    current_price = Column(Float, default=0)

    # ✅ Relationships
    airline = relationship("Airline", back_populates="flights")

    source_airport_rel = relationship(
        "Airport", foreign_keys=[source_airport], lazy="joined", overlaps="flights"
    )
    destination_airport_rel = relationship(
        "Airport", foreign_keys=[destination_airport], lazy="joined", overlaps="flights"
    )

    bookings = relationship(
        "Booking",
        back_populates="flight",
        foreign_keys="Booking.flight_id"
    )
    fare_history = relationship("FareHistory", back_populates="flight")

class Passenger(Base):
    __tablename__ = "passengers"
    passenger_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(15))
    hashed_password = Column(String(255), nullable=False)
    bookings = relationship("Booking", back_populates="passenger")

class BookingPassenger(Base):
    __tablename__ = "booking_passengers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"))
    full_name = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(String(10))
    seat_no = Column(String(5))
    return_seat_no = Column(String(5), nullable=True)

    booking = relationship("Booking", back_populates="booking_passengers")

    __table_args__ = (
        UniqueConstraint('booking_id', 'seat_no', name='uq_booking_seat'),
    )

class TripType(enum.Enum):
    ONE_WAY = "ONE_WAY"
    ROUND_TRIP = "ROUND_TRIP"

class Booking(Base):
    __tablename__ = "bookings"
    booking_id = Column(Integer, primary_key=True, autoincrement=True)
    flight_id = Column(Integer, ForeignKey("flights.flight_id"))
    passenger_id = Column(Integer, ForeignKey("passengers.passenger_id"))
    seat_no = Column(String(5))
    fare_paid = Column(DECIMAL(10, 2))
    total_fare = Column(DECIMAL(10, 2), nullable=True)
    booking_date = Column(DateTime, server_default=func.now())
    status = Column(String(20), default="PENDING_PAYMENT")  # e.g., PENDING_PAYMENT, CONFIRMED, CANCELLED
    pnr = Column(String(12), unique=True, nullable=True)

    # ✅ New columns for round trip
    trip_type = Column(SQLAlchemyEnum(TripType), default=TripType.ONE_WAY)
    return_flight_id = Column(Integer, ForeignKey("flights.flight_id"), nullable=True)
    is_return_leg = Column(Boolean, default=False)


    flight = relationship(
        "Flight",
        back_populates="bookings",
        foreign_keys=[flight_id]
    )
    return_flight = relationship(
        "Flight",
        foreign_keys=[return_flight_id],
        viewonly=True
    )
    passenger = relationship("Passenger", back_populates="bookings")
    booking_passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")


class FareHistory(Base):
    __tablename__ = "fare_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    flight_id = Column(Integer, ForeignKey("flights.flight_id"))
    recorded_at = Column(TIMESTAMP, server_default=func.now())
    price = Column(DECIMAL(12,2))

    flight = relationship("Flight", back_populates="fare_history")

