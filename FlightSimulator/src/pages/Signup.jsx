import { useState } from "react";
import { BACKEND } from "../config.js";

export default function Signup({ onLogin }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND}/passengers/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.message || "Signup failed");
      
      alert("Signup successful! You can now login.");
      onLogin(data);  // optional: automatically log in after signup
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
        <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">Sign Up</h2>

        {/* Full Name */}
        <div className="flex flex-col">
          <label className="text-blue-600 font-medium mb-1">Full Name</label>
          <input
            name="full_name"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
          />
        </div>

        {/* Email */}
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

        {/* Phone */}
        <div className="flex flex-col">
          <label className="text-blue-600 font-medium mb-1">Phone</label>
          <input
            name="phone"
            placeholder="Enter your phone number"
            value={form.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded-xl px-4 py-3 text-black focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
          />
        </div>

        {/* Password */}
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

        {/* Sign Up Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold rounded-xl py-3 shadow hover:bg-blue-700 transition transform hover:-translate-y-0.5"
        >
          Sign Up
        </button>

        {/* Error Message */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
