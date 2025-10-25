# ✈️ Flight Booking Simulator with Dynamic Pricing

A full-stack **Flight Booking System** that simulates searching, booking, and canceling flights with **real-time dynamic pricing**.  
This project demonstrates database management, backend API integration, frontend rendering, and real-world pricing logic.

---

## 🚀 Features

### 🧩 Core Features
- Search flights between source and destination airports.
- Dynamic fare calculation based on demand and seat availability.
- Passenger booking and ticket generation.
- Booking management (view/cancel bookings).
- Responsive frontend for smooth user experience.

### ⚙️ Technical Highlights
- **Backend:** FastAPI for REST APIs
- **Frontend:** React.js with Tailwind CSS
- **Database:** MySQL
- **Dynamic Pricing Engine:** Python-based algorithm that adjusts fare according to occupancy and demand
- **Deployment:** Dockerized backend + frontend hosted on Netlify

---

## 🏗️ Project Structure

flight_booking_simulator_with_dynamic_pricing/
│
├── backend/
│ ├── main.py # Main FastAPI app
│ ├── pricing_engine.py # Dynamic pricing logic
│ ├── db_config.py # Database connection setup
│ ├── models.py # Pydantic models and schema
│ └── utils.py # Helper utilities (e.g., PNR generator)
│
├── FlightSimulator(frontend)/
│ ├── src/
│ │ ├── api/ # API service functions
│ │ ├── components/ # UI components
│ │ ├── pages/ # Page-level React components
│ │ └── App.js # Main entry
│ ├── package.json
│ └── tailwind.config.js
│
└── README.md
