import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // We only pass the strings from the form state
      await login(form.email, form.password);
      // If login succeeds, the line above finishes and we navigate
      navigate("/");
    } catch (err) {
      // If the backend returns an error, it will be caught here
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-navy-800 flex-col justify-between p-12
                      relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                        bg-navy-700 opacity-60" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full
                        bg-navy-900 opacity-80" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full
                        bg-navy-600 opacity-40" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20
                          flex items-center justify-center text-white text-lg">✚</div>
          <span className="font-display text-xl font-semibold text-white">MediCore</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <h2 className="font-display text-4xl font-semibold text-white leading-tight mb-4">
            Smarter care starts<br />
            <span className="italic text-navy-200">with better tools.</span>
          </h2>
          <p className="text-navy-300 text-sm leading-relaxed max-w-sm">
            A complete hospital management system built for modern healthcare teams —
            from appointments to billing, all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {["Patient Records","Smart Scheduling","Role-Based Access","Billing & Invoices"].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20
                                       text-white/80 text-xs font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-navy-400 text-xs font-mono">
          © {new Date().getFullYear()} MediCore HMS · All rights reserved
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-sand-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-navy-500 flex items-center
                            justify-center text-white shadow-navy">✚</div>
            <span className="font-display text-lg font-semibold text-slate-800">MediCore</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your HMS account</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200
                            text-rose-700 text-sm flex items-center gap-2">
              <span className="text-rose-400">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} className="input"
                placeholder="you@hospital.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" name="password" value={form.password}
                onChange={handleChange} className="input"
                placeholder="••••••••" required />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                    Signing in...
                  </span>
                : "Sign in →"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 font-mono mt-8">
            Secure · HIPAA-ready · Role-based access
          </p>
        </div>
      </div>
    </div>
  );
}
