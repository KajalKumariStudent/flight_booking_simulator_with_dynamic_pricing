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

```

flight_booking_simulator_with_dynamic_pricing/
├── backend/
│ ├── main.py # FastAPI entry point
│ ├── pricing_engine.py # Logic for dynamic fare adjustments
│ ├── db_config.py # Database connection/configuration
│ ├── models.py # SQLAlchemy / Pydantic models & schemas
│ └── utils.py # Helper functions (e.g., PNR generator)
├── frontend/ # React project (can be named FlightSimulator or similar)
│ ├── src/
│ │ ├── api/ # API service functions
│ │ ├── components/ # Shared UI components
│ │ ├── pages/ # Page-level React components (SearchFlights, Booking, Payment, Confirmation, etc.)
│ │ └── App.js # Main entry point
│ ├── package.json
│ └── tailwind.config.js
├── database/ # Optional folder for DB scripts / migrations
└── LICENSE.txt

```

---

## 🔍 Usage Flow

On UI, search flights by origin, destination & date.

Select a flight from results (fare shown dynamically).

Choose a seat (seat map uses availability) → proceed to payment.

Complete payment (simulation) → get PNR & confirmation → downloadable e-ticket PDF.

My Bookings page: view all your bookings, cancel if needed.  


## 📄 e-Ticket PDF Details

The downloaded receipt includes:

Ticket Reference (PNR) & booking details

Passenger information

Flight information: airline name, flight number, from/to airports, seat

Fare breakdown: base fare, taxes/fees (calculated), discount (if any), total fare paid

Footer with project branding.

## 🧪 Dynamic Pricing Explanation

The engine adjusts fares using factors such as:

Remaining seats vs. total seats

Time until departure

Demand/supply ratio

Seat class multipliers (Economy, Business, Extra legroom)
This gives a realistic “supply & demand” feel.


---

## 🛠 Setup & Installation

### Prerequisites
- Node.js & npm/yarn  
- Python 3.8+  
- MySQL (or any supported SQL DB) instance  
- (Optional) Docker & docker-compose for containerised run

### Frontend Setup
```bash
cd frontend
npm install                  # or `yarn install`
npm start                    # or `yarn start`
```
## Opens UI at http://localhost:3000

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate     # (or `venv\Scripts\activate` on Windows)
pip install -r requirements.txt
# Edit `db_config.py` to point to your database credentials
uvicorn main:app --reload    
```
## runs server at http://127.0.0.1:8000
