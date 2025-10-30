import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ passenger, setPassenger }) {
  const navigate = useNavigate();

  // ✅ Load logged-in passenger from localStorage when component mounts
  useEffect(() => {
    const storedPassenger = localStorage.getItem("full_name");
    const storedEmail = localStorage.getItem("email");
    const storedId = localStorage.getItem("passenger_id");

    if (storedPassenger && storedEmail && storedId) {
      setPassenger({
        full_name: storedPassenger,
        email: storedEmail,
        passenger_id: storedId,
      });
    }
  }, [setPassenger]);

  // ✅ Logout clears everything
  const handleLogout = () => {
    localStorage.removeItem("passenger_id");
    localStorage.removeItem("full_name");
    localStorage.removeItem("email");
    setPassenger(null);
    navigate("/");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            🛩
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">FlightSim</div>
            <div className="text-sm text-gray-500">Flight booking simulator</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {passenger ? (
            // ✅ When logged in
            <>
              <Link
                to="/bookings"
                className="text-sm text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
              >
                My Bookings
              </Link>
              <span className="text-sm text-gray-700 font-medium">
                Hello, {passenger.full_name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 shadow-sm"
              >
                Logout
              </button>
            </>
          ) : (
            // ❌ When not logged in
            <>
              <Link
                to="/login"
                className="px-4 py-2 bg-white border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors duration-200 shadow-sm"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-md"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
