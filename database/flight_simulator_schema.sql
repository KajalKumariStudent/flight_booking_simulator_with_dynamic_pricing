-- ==============================
--  FLIGHT BOOKING SIMULATOR DB 
-- ==============================

CREATE DATABASE IF NOT EXISTS flight_simulator;
USE flight_simulator;

-- ==============================
--  TABLEs
-- ==============================


-- Airlines
CREATE TABLE IF NOT EXISTS airlines (
    airline_id INT AUTO_INCREMENT PRIMARY KEY,
    airline_name VARCHAR(100) NOT NULL,
    iata_code VARCHAR(10) UNIQUE
);

-- Airports
CREATE TABLE IF NOT EXISTS airports (
    airport_id INT AUTO_INCREMENT PRIMARY KEY,
    airport_name VARCHAR(100) NOT NULL,
    city VARCHAR(50),
    country VARCHAR(50)
);

-- Flights
CREATE TABLE IF NOT EXISTS flights (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    airline_id INT,
    flight_number VARCHAR(20) UNIQUE,
    source_airport INT,
    destination_airport INT,
    departure_time DATETIME,
    arrival_time DATETIME,
    base_fare DECIMAL(10,2),
    total_seats INT DEFAULT 100,
    available_seats INT DEFAULT 100,
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id),
    FOREIGN KEY (source_airport) REFERENCES airports(airport_id),
    FOREIGN KEY (destination_airport) REFERENCES airports(airport_id)
);

-- Passengers
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15)
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT,
    passenger_id INT,
    seat_no INT,
    fare_paid DECIMAL(10,2),
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id)
);

-- Fare history
CREATE TABLE IF NOT EXISTS fare_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price DECIMAL(12,2),
  FOREIGN KEY (flight_id) REFERENCES flights(flight_id)
);

-- ==============================
--  SAMPLE DATA
-- ==============================

-- Airlines
INSERT INTO airlines (airline_name, iata_code) VALUES
('Air India', 'AI'),
('IndiGo', '6E'),
('SpiceJet', 'SG');

-- Airports
INSERT INTO airports (airport_name, city, country) VALUES
('Indira Gandhi International', 'Delhi', 'India'),
('Chhatrapati Shivaji', 'Mumbai', 'India'),
('Kempegowda International', 'Bangalore', 'India'),
('Netaji Subhas Chandra Bose', 'Kolkata', 'India');

-- Flights
INSERT INTO flights (airline_id, flight_number, source_airport, destination_airport, departure_time, arrival_time, base_fare, total_seats, available_seats)
VALUES
(1, 'AI101', 1, 2, '2025-10-12 08:00:00', '2025-10-12 10:00:00', 5000, 150, 140),
(2, '6E202', 2, 3, '2025-10-13 09:00:00', '2025-10-13 11:00:00', 4500, 180, 170),
(3, 'SG303', 3, 4, '2025-10-14 07:00:00', '2025-10-14 09:30:00', 4000, 160, 150);

-- Passengers
INSERT INTO passengers (full_name, email, phone) VALUES
('Rohit Sharma', 'rohit@example.com', '9999911111'),
('Priya Singh', 'priya@example.com', '8888822222'),
('Aman Verma', 'aman@example.com', '7777733333'),
('Kajal Kumari', 'kajal@example.com', '6666644444');

-- Bookings (example)
INSERT INTO bookings (flight_id, passenger_id, seat_no, fare_paid)
VALUES
(1, 1, 101, 5000),
(2, 2, 105, 4500),
(3, 3, 110, 4000);

-- Fare history (example)
INSERT INTO fare_history (flight_id, price) VALUES
(1, 5000),
(2, 4500),
(3, 4000);
