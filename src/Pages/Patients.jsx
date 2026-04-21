import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";
import PatientForm   from "./patients/PatientForm";
import PatientDetail from "./patients/PatientDetail";
import ConfirmDialog from "../Components/ui/ConfirmDialog";
import Toast         from "../Components/ui/Toast";

const STATUS_FILTERS = ["all", "active", "admitted", "discharged"];

const statusBadge = {
  active:     "badge-success",
  admitted:   "badge-warning",
  discharged: "badge-neutral",
};

const bloodStyle = {
  "A+":"bg-red-50 text-red-700 ring-red-200",
  "A-":"bg-red-50 text-red-600 ring-red-100",
  "B+":"bg-orange-50 text-orange-700 ring-orange-200",
  "B-":"bg-orange-50 text-orange-600 ring-orange-100",
  "AB+":"bg-violet-50 text-violet-700 ring-violet-200",
  "AB-":"bg-violet-50 text-violet-600 ring-violet-100",
  "O+":"bg-sky-50 text-sky-700 ring-sky-200",
  "O-":"bg-sky-50 text-sky-600 ring-sky-100",
};

export default function Patients() {
  const { user } = useAuth();

  const canWrite  = ["admin", "receptionist"].includes(user?.role);
  const canDelete = ["admin", "receptionist"].includes(user?.role);

  const [patients,     setPatients]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [error,        setError]        = useState("");

  const [showForm,     setShowForm]     = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [toast,        setToast]        = useState(null);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/patients");
      setPatients(data);
    } catch {
      setError("Failed to load patients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        !search ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search) ||
        p.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [patients, search, statusFilter]);

  const handleRowClick    = (p) => { setSelected(p); setShowDetail(true); };
  const handleNewClick    = ()  => { setSelected(null); setShowForm(true); };
  const handleEditClick   = (p) => { setSelected(p); setShowDetail(false); setShowForm(true); };
  const handleDeleteClick = (p) => { setSelected(p); setShowDetail(false); setShowConfirm(true); };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selected?._id) {
        await api.put(`/patients/${selected._id}`, formData);
        setToast({ message: "Patient updated successfully", type: "success" });
      } else {
        await api.post("/patients", formData);
        setToast({ message: "Patient registered successfully", type: "success" });
      }
      setShowForm(false);
      setSelected(null);
      fetchPatients();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to save patient", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/patients/${selected._id}`);
      setToast({ message: "Patient deleted successfully", type: "success" });
      setShowConfirm(false);
      setSelected(null);
      fetchPatients();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to delete patient", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // Counts for filter tabs
  const counts = useMemo(() => ({
    all:        patients.length,
    active:     patients.filter((p) => p.status === "active").length,
    admitted:   patients.filter((p) => p.status === "admitted").length,
    discharged: patients.filter((p) => p.status === "discharged").length,
  }), [patients]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Patients</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {patients.length} total patient{patients.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {canWrite && (
          <button onClick={handleNewClick} className="btn-primary">
            + New Patient
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200
                        text-rose-700 text-sm flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm select-none">
            ⊘
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 bg-white" placeholder="Search name, phone or email..." />
        </div>

        {/* Status tabs */}
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
            <p className="text-slate-400 text-sm mt-3">Loading patients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                            flex items-center justify-center text-2xl mx-auto mb-3">♡</div>
            <p className="text-slate-600 font-medium">
              {search || statusFilter !== "all" ? "No patients match your search" : "No patients yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Register the first patient to get started"}
            </p>
            {canWrite && !search && statusFilter === "all" && (
              <button onClick={handleNewClick} className="btn-primary mt-4 mx-auto">
                + Register First Patient
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Blood Type</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} onClick={() => handleRowClick(p)} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy-500 text-white
                                      flex items-center justify-center text-xs font-bold
                                      shrink-0 shadow-sm">
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{p.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="capitalize text-slate-600 text-sm">{p.gender || "—"}</td>
                  <td className="font-mono text-sm text-slate-700">{p.phone}</td>
                  <td>
                    {p.bloodGroup ? (
                      <span className={`badge ring-1 text-xs font-bold ${bloodStyle[p.bloodGroup] ?? "bg-slate-100 text-slate-600"}`}>
                        {p.bloodGroup}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>
                  <td>
                    <span className={statusBadge[p.status] ?? "badge-neutral"}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-slate-400 text-sm font-mono">
                    {new Date(p.createdAt).toLocaleDateString("en-US",
                      { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {patients.length} patients
        </p>
      )}

      {/* Panels */}
      {showForm && (
        <PatientForm
          patient={selected}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelected(null); }}
          loading={saving}
        />
      )}
      {showDetail && selected && (
        <PatientDetail
          patient={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}
      {showConfirm && selected && (
        <ConfirmDialog
          title="Delete Patient"
          message={`Are you sure you want to permanently delete ${selected.firstName} ${selected.lastName}'s record? This action cannot be undone.`}
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
