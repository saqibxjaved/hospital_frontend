import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";
import BillForm   from "./billing/BillForm";
import BillDetail from "./billing/BillDetail";
import Toast      from "../Components/ui/Toast";

const STATUS_FILTERS = ["all", "unpaid", "partial", "paid"];

const statusBadge = {
  unpaid:  "badge-danger",
  partial: "badge-warning",
  paid:    "badge-success",
};

const statusDot = {
  unpaid:  "bg-rose-400",
  partial: "bg-amber-400",
  paid:    "bg-emerald-400",
};

export default function Billing() {
  const { user } = useAuth();

  const canCreate = ["admin", "receptionist"].includes(user?.role);

  const [bills,        setBills]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [payLoading,   setPayLoading]   = useState(false);
  const [error,        setError]        = useState("");

  const [showForm,     setShowForm]     = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [toast,        setToast]        = useState(null);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/billing");
      setBills(data);
    } catch {
      setError("Failed to load billing records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue  = bills.filter((b) => b.paymentStatus === "paid")
      .reduce((s, b) => s + (b.totalAmount || 0), 0);
    const totalOutstanding = bills.filter((b) => b.paymentStatus !== "paid")
      .reduce((s, b) => s + (b.balanceDue || 0), 0);
    return {
      total:       bills.length,
      unpaid:      bills.filter((b) => b.paymentStatus === "unpaid").length,
      partial:     bills.filter((b) => b.paymentStatus === "partial").length,
      paid:        bills.filter((b) => b.paymentStatus === "paid").length,
      totalRevenue,
      totalOutstanding,
    };
  }, [bills]);

  // Filter
  const filtered = useMemo(() => {
    return bills.filter((b) => {
      const patient = b.appointment?.patient;
      const matchSearch =
        !search ||
        `${patient?.firstName} ${patient?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        b._id?.slice(-8).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || b.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bills, search, statusFilter]);

  const counts = useMemo(() => ({
    all:     bills.length,
    unpaid:  stats.unpaid,
    partial: stats.partial,
    paid:    stats.paid,
  }), [bills, stats]);

  // Create bill
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await api.post("/billing", formData);
      setToast({ message: "Bill created successfully", type: "success" });
      setShowForm(false);
      fetchBills();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to create bill", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Record payment
  const handlePayment = async (billId, paymentData) => {
    setPayLoading(true);
    try {
      const { data } = await api.patch(`/billing/${billId}/payment`, paymentData);
      // Update selected bill in-place
      setSelected(data);
      setBills((prev) => prev.map((b) => b._id === billId ? data : b));
      setToast({ message: "Payment recorded successfully", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Payment failed", type: "error" });
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Billing</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {bills.length} bill{bills.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + New Bill
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200
                        text-rose-700 text-sm flex gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",    value: `$${stats.totalRevenue.toFixed(2)}`,    color: "text-emerald-700", bg: "bg-emerald-50", icon: "◈" },
          { label: "Outstanding",      value: `$${stats.totalOutstanding.toFixed(2)}`,color: "text-rose-700",    bg: "bg-rose-50",    icon: "⚠" },
          { label: "Unpaid / Partial", value: stats.unpaid + stats.partial,           color: "text-amber-700",   bg: "bg-amber-50",   icon: "◷" },
          { label: "Paid Bills",       value: stats.paid,                             color: "text-navy-700",    bg: "bg-navy-50",    icon: "✓" },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-base shrink-0`}>
              <span className={color}>{icon}</span>
            </div>
            <div>
              <p className={`text-xl font-display font-semibold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm select-none">⊘</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 bg-white" placeholder="Search by patient name or bill ID..." />
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? "bg-navy-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-sand-100"
              }`}>
              {s}
              <span className={`ml-1.5 text-xs ${statusFilter === s ? "text-navy-200" : "text-slate-300"}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="py-14 text-center">
            <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                            rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm mt-3">Loading bills...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                            flex items-center justify-center text-2xl mx-auto mb-3">◈</div>
            <p className="text-slate-600 font-medium">
              {search || statusFilter !== "all" ? "No bills match your filters" : "No bills yet"}
            </p>
            {canCreate && !search && statusFilter === "all" && (
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">
                + Create First Bill
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Appointment</th>
                <th>Doctor</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const patient = b.appointment?.patient;
                const doctor  = b.appointment?.doctor;
                return (
                  <tr key={b._id}
                    onClick={() => { setSelected(b); setShowDetail(true); }}
                    className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-navy-500 text-white flex items-center
                                        justify-center text-xs font-bold shrink-0">
                          {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {patient?.firstName} {patient?.lastName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            #{b._id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-slate-600">
                        {b.appointment?.appointmentDate
                          ? new Date(b.appointment.appointmentDate).toLocaleDateString("en-US",
                              { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">{b.appointment?.type}</p>
                    </td>
                    <td className="text-sm text-slate-600">
                      {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—"}
                    </td>
                    <td className="font-mono text-sm font-semibold text-slate-800">
                      ${(b.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="font-mono text-sm text-emerald-600">
                      ${(b.amountPaid || 0).toFixed(2)}
                    </td>
                    <td className={`font-mono text-sm font-semibold
                                    ${b.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      ${(b.balanceDue || 0).toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[b.paymentStatus] ?? "bg-slate-300"}`} />
                        <span className={statusBadge[b.paymentStatus] ?? "badge-neutral"}>
                          {b.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="text-slate-400 text-sm font-mono">
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString("en-US",
                            { month: "short", day: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {bills.length} bills
        </p>
      )}

      {/* Panels */}
      {showForm && (
        <BillForm
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          loading={saving}
        />
      )}
      {showDetail && selected && (
        <BillDetail
          bill={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          onPayment={handlePayment}
          paymentLoading={payLoading}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
