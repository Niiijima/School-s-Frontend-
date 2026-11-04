import React, { useState } from "react";
import { User, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [admissionNumber, setAdmissionNumber] = useState("SCH2025002");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate network delay for realistic feel
    setTimeout(() => {
      try {
        // Mock success response
        localStorage.setItem("token", "mock-jwt-token-12345");
        localStorage.setItem("studentId", "6ae7cc6eeeb93169ac649638");

        if (onLoginSuccess) {
          onLoginSuccess("6ae7cc6eeeb93169ac649638");
        }
      } catch (err) {
        setError("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 font-['Quicksand',sans-serif]">
      
      {/* School Brand Header */}
      <div className="text-center mb-8">
        <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
          O'lak Triumph School
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-3">Student Portal</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to access your academic records and profile</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Admission Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password / Access PIN
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In (Test Mode)</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Tip: Click sign in with pre-filled mock credentials to view profile.
        </div>
      </div>
    </div>
  );
}