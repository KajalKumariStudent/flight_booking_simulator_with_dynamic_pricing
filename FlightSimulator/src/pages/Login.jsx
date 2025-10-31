import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ for redirection
import { BACKEND } from "../config.js";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ useNavigate hook

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND}/passengers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      // ✅ Save passenger info in localStorage for persistence
      localStorage.setItem("passenger", JSON.stringify(data));
      

      // ✅ Update state in App (triggers Header update)
      onLogin(data);

      // ✅ Redirect to home page after login
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md flex flex-col gap-5"
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
          Login
        </h2>

        {/* Email Input */}
        <div className="flex flex-col">
          <label className="text-blue-600 font-medium mb-1">Email</label>
          <input
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col">
          <label className="text-blue-600 font-medium mb-1">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold rounded-xl py-3 shadow hover:bg-blue-700 transition transform hover:-translate-y-0.5"
        >
          Login
        </button>

        {/* Error Message */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
