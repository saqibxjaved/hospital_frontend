import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";
import DoctorForm    from "./doctors/DoctorForm";
import ConfirmDialog from "../Components/ui/ConfirmDialog";
import Toast         from "../Components/ui/Toast";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const STATUS_FILTERS = ["all", "active", "inactive", "on-leave"];

const statusDot = {
  active:     "bg-emerald-500",
  inactive:   "bg-slate-400",
  "on-leave": "bg-amber-500",
};

export default function Doctors() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const canWrite  = user?.role === "admin";
  const canDelete = user?.role === "admin";

  const [doctors,       setDoctors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState("");

  const [showForm,      setShowForm]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [toast,         setToast]         = useState(null);

  // Filters
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [specFilter,    setSpecFilter]    = useState("all");
  const [deptFilter,    setDeptFilter]    = useState("all");
  const [dayFilter,     setDayFilter]     = useState("all");

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/doctors");
      setDoctors(data);
    } catch {
      setError("Failed to load doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  // Derive unique values for filter dropdowns
  const specializations = useMemo(() =>
    ["all", ...new Set(doctors.map((d) => d.specialization).filter(Boolean))],
  [doctors]);

  const departments = useMemo(() =>
    ["all", ...new Set(doctors.map((d) => d.department).filter(Boolean))],
  [doctors]);

  // Apply all filters
  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchSearch =
        !search ||
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        d.department?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchSpec   = specFilter   === "all" || d.specialization === specFilter;
      const matchDept   = deptFilter   === "all" || d.department === deptFilter;
      const matchDay    = dayFilter    === "all" || d.availableDays?.includes(dayFilter);

      return matchSearch && matchStatus && matchSpec && matchDept && matchDay;
    });
  }, [doctors, search, statusFilter, specFilter, deptFilter, dayFilter]);

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all");
    setSpecFilter("all"); setDeptFilter("all"); setDayFilter("all");
  };

  const isFiltered = search || statusFilter !== "all" || specFilter !== "all"
                     || deptFilter !== "all" || dayFilter !== "all";

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selected?._id) {
        await api.put(`/doctors/${selected._id}`, formData);
        setToast({ message: "Doctor updated successfully", type: "success" });
      } else {
        await api.post("/doctors", formData);
        setToast({ message: "Doctor registered successfully", type: "success" });
      }
      setShowForm(false);
      setSelected(null);
      fetchDoctors();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/doctors/${selected._id}`);
      setToast({ message: "Doctor removed successfully", type: "success" });
      setShowConfirm(false);
      setSelected(null);
      fetchDoctors();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Delete failed", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // Status counts for tabs
  const counts = useMemo(() => ({
    all:        doctors.length,
    active:     doctors.filter((d) => d.status === "active").length,
    inactive:   doctors.filter((d) => d.status === "inactive").length,
    "on-leave": doctors.filter((d) => d.status === "on-leave").length,
  }), [doctors]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Doctors</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} on staff
          </p>
        </div>
        {canWrite && (
          <button onClick={() => { setSelected(null); setShowForm(true); }} className="btn-primary">
            + New Doctor
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200
                        text-rose-700 text-sm flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm select-none">
          ⊘
        </span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 bg-white" placeholder="Search by name, specialization, department..." />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Status tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? "bg-navy-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-sand-100"
              }`}>
              {s === "on-leave" ? "On Leave" : s}
              <span className={`ml-1.5 text-xs ${statusFilter === s ? "text-navy-200" : "text-slate-300"}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Specialization dropdown */}
        <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)}
          className="input w-auto bg-white text-xs py-2 pr-8 cursor-pointer">
          {specializations.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Specializations" : s}</option>
          ))}
        </select>

        {/* Department dropdown */}
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="input w-auto bg-white text-xs py-2 pr-8 cursor-pointer">
          {departments.map((d) => (
            <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
          ))}
        </select>

        {/* Day dropdown */}
        <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}
          className="input w-auto bg-white text-xs py-2 pr-8 cursor-pointer">
          <option value="all">All Days</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Clear */}
        {isFiltered && (
          <button onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-rose-500 transition-colors font-medium">
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Grid / Table toggle — using a card grid */}
      {loading ? (
        <div className="table-wrapper py-14 text-center">
          <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                          rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading doctors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="table-wrapper py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                          flex items-center justify-center text-2xl mx-auto mb-3">✚</div>
          <p className="text-slate-600 font-medium">
            {isFiltered ? "No doctors match your filters" : "No doctors registered yet"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {isFiltered ? "Try adjusting your filters" : "Add the first doctor to get started"}
          </p>
          {canWrite && !isFiltered && (
            <button onClick={() => { setSelected(null); setShowForm(true); }}
              className="btn-primary mt-4 mx-auto">
              + Register First Doctor
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Doctor cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div key={d._id}
                onClick={() => navigate(`/doctors/${d._id}`)}
                className="card-hover cursor-pointer group">

                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-navy-500 flex items-center
                                    justify-center text-white font-bold text-sm shadow-navy">
                      {d.firstName?.[0]}{d.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm group-hover:text-navy-700
                                    transition-colors">
                        Dr. {d.firstName} {d.lastName}
                      </p>
                      <p className="text-xs text-navy-600 font-medium">{d.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[d.status] ?? "bg-slate-400"}`} />
                    <span className="text-xs text-slate-400 capitalize">
                      {d.status === "on-leave" ? "On Leave" : d.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-300">▦</span>
                    <span>{d.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-300">✉</span>
                    <span className="truncate">{d.email}</span>
                  </div>
                  {d.yearsOfExperience != null && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="text-slate-300">★</span>
                      <span>{d.yearsOfExperience} years experience</span>
                    </div>
                  )}
                </div>

                {/* Available days */}
                {d.availableDays?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {DAYS.map((day) => (
                      <span key={day}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                          d.availableDays.includes(day)
                            ? "bg-navy-50 text-navy-600 border-navy-100"
                            : "bg-slate-50 text-slate-200 border-slate-100"
                        }`}>
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {d.licenseNumber}
                  </span>
                  {canWrite && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelected(d); setShowForm(true); }}
                        className="w-7 h-7 rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100
                                   flex items-center justify-center text-xs transition-colors">
                        ✎
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => { setSelected(d); setShowConfirm(true); }}
                          className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100
                                     flex items-center justify-center text-xs transition-colors">
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 text-right">
            Showing {filtered.length} of {doctors.length} doctors
          </p>
        </>
      )}

      {/* Panels */}
      {showForm && (
        <DoctorForm
          doctor={selected}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelected(null); }}
          loading={saving}
        />
      )}
      {showConfirm && selected && (
        <ConfirmDialog
          title="Delete Doctor"
          message={`Are you sure you want to permanently remove Dr. ${selected.firstName} ${selected.lastName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => { setShowConfirm(false); setSelected(null); }}
          loading={deleting}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
