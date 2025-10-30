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
ALTER TABLE flights
ADD COLUMN current_price FLOAT DEFAULT 0;


-- Passengers
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    hashed_password VARCHAR(255) NOT NULL
);



-- Bookings
DROP TABLE IF EXISTS bookings;

CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT,
    passenger_id INT,
    seat_no VARCHAR(5),
    fare_paid DECIMAL(10,2),
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    pnr VARCHAR(12) UNIQUE,
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

-- Clear old data (optional for testing)
DELETE FROM fare_history;
DELETE FROM bookings;
DELETE FROM flights;
DELETE FROM airlines;
DELETE FROM airports;

ALTER TABLE airlines AUTO_INCREMENT = 1;
ALTER TABLE airports AUTO_INCREMENT = 1;
ALTER TABLE flights AUTO_INCREMENT = 1;
-- ==============================
--  AIRLINES
-- ==============================
INSERT INTO airlines (airline_name, iata_code) VALUES
('Air India', 'AI'),
('IndiGo', '6E'),
('SpiceJet', 'SG'),
('Vistara', 'UK'),
('Go First', 'G8'),
('AirAsia India', 'I5');

-- ==============================
--  AIRPORTS
-- ==============================
INSERT INTO airports (airport_name, city, country) VALUES
('Indira Gandhi International Airport', 'Delhi', 'India'),
('Chhatrapati Shivaji International Airport', 'Mumbai', 'India'),
('Kempegowda International Airport', 'Bangalore', 'India'),
('Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India'),
('Chennai International Airport', 'Chennai', 'India'),
('Rajiv Gandhi International Airport', 'Hyderabad', 'India'),
('Cochin International Airport', 'Kochi', 'India'),
('Pune International Airport', 'Pune', 'India'),
('Jaipur International Airport', 'Jaipur', 'India'),
('Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'India');

SELECT * FROM airlines;
SELECT * FROM airports;

-- ==============================
--  FLIGHTS (20 realistic routes)
-- ==============================
INSERT INTO flights (airline_id, flight_number, source_airport, destination_airport, departure_time, arrival_time, base_fare, total_seats, available_seats)
VALUES
(1, 'AI101', 1, 2, '2025-11-05 08:00:00', '2025-11-05 10:00:00', 5200, 150, 120),
(2, '6E202', 2, 3, '2025-11-05 09:30:00', '2025-11-05 11:45:00', 4800, 180, 160),
(3, 'SG303', 3, 4, '2025-11-06 07:15:00', '2025-11-06 09:45:00', 4300, 160, 145),
(4, 'UK404', 4, 5, '2025-11-06 10:00:00', '2025-11-06 12:30:00', 5500, 170, 160),
(5, 'G805', 5, 1, '2025-11-07 06:30:00', '2025-11-07 08:45:00', 4100, 150, 100),
(6, 'I506', 6, 2, '2025-11-07 12:00:00', '2025-11-07 14:00:00', 4700, 180, 175),
(1, 'AI107', 1, 4, '2025-11-08 09:00:00', '2025-11-08 11:30:00', 6200, 150, 140),
(2, '6E208', 2, 5, '2025-11-08 10:45:00', '2025-11-08 13:00:00', 4950, 180, 165),
(3, 'SG309', 3, 6, '2025-11-09 13:00:00', '2025-11-09 15:00:00', 5200, 160, 158),
(4, 'UK410', 4, 1, '2025-11-09 14:30:00', '2025-11-09 17:00:00', 5600, 170, 160),
(5, 'G812', 5, 2, '2025-11-10 07:00:00', '2025-11-10 09:30:00', 4200, 150, 140),
(6, 'I514', 6, 3, '2025-11-10 11:15:00', '2025-11-10 13:30:00', 4600, 180, 170),
(1, 'AI115', 1, 6, '2025-11-11 06:00:00', '2025-11-11 08:10:00', 5400, 150, 145),
(2, '6E218', 2, 4, '2025-11-11 12:45:00', '2025-11-11 15:00:00', 4900, 180, 160),
(3, 'SG320', 3, 5, '2025-11-12 09:30:00', '2025-11-12 12:00:00', 4600, 160, 155),
(4, 'UK425', 4, 6, '2025-11-12 08:00:00', '2025-11-12 10:15:00', 5300, 170, 155),
(5, 'G830', 5, 3, '2025-11-13 16:00:00', '2025-11-13 18:15:00', 4400, 150, 130),
(6, 'I545', 6, 5, '2025-11-14 17:30:00', '2025-11-14 19:30:00', 4800, 180, 178),
(2, '6E250', 2, 1, '2025-11-15 07:00:00', '2025-11-15 09:15:00', 5100, 180, 170),
(3, 'SG350', 3, 2, '2025-11-15 11:30:00', '2025-11-15 13:45:00', 4700, 160, 150);

-- ==============================
--  FARE HISTORY
-- ==============================
INSERT INTO fare_history (flight_id, price)
SELECT flight_id, base_fare FROM flights;
