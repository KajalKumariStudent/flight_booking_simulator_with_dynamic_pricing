import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">FS</div>
          <div>
            <div className="text-lg font-semibold">FlightSim</div>
            <div className="text-xs text-slate-500">Flight booking simulator</div>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/bookings" className="text-sm text-slate-700 hover:text-primary">My Bookings</Link>
          <Link to="/" className="text-sm text-slate-700 hover:text-primary">Help</Link>
          <button className="ml-2 px-3 py-1.5 border border-primary text-primary rounded">Login</button>
        </nav>
      </div>
    </header>
  );
}
