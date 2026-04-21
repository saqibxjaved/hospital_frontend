import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";
import WardForm      from "./wards/WardForm";
import BedGrid       from "./wards/BedGrid";
import ConfirmDialog from "../Components/ui/ConfirmDialog";
import Toast         from "../Components/ui/Toast";

const WARD_TYPE_STYLE = {
  "general":           { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     icon: "▦" },
  "icu":               { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    icon: "♥" },
  "private":           { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  icon: "◈" },
  "emergency":         { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: "⚡" },
  "operating-theatre": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✚" },
};

function OccupancyBar({ total, occupied, maintenance }) {
  const availPct = total > 0 ? ((total - occupied - maintenance) / total) * 100 : 0;
  const occPct   = total > 0 ? (occupied    / total) * 100 : 0;
  const maintPct = total > 0 ? (maintenance / total) * 100 : 0;

  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
      <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${availPct}%` }} />
      <div className="bg-rose-400   h-full transition-all duration-500" style={{ width: `${occPct}%`   }} />
      <div className="bg-amber-400  h-full transition-all duration-500" style={{ width: `${maintPct}%` }} />
    </div>
  );
}

function WardCard({ ward, canWrite, canDelete, onEdit, onDelete, onAdmit, onDischarge, onMaintenance }) {
  const [expanded, setExpanded] = useState(false);

  const typeStyle  = WARD_TYPE_STYLE[ward.type] ?? WARD_TYPE_STYLE.general;
  const available  = ward.availableBeds  ?? 0;
  const occupied   = ward.occupiedBeds   ?? 0;
  const maintenance= (ward.beds ?? []).filter((b) => b.status === "maintenance").length;
  const total      = ward.totalBeds ?? 0;

  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className={`card border transition-all duration-200
                     ${expanded ? "shadow-card-md" : "hover:shadow-card-md hover:-translate-y-0.5"}`}>

      {/* Ward header — always visible */}
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                         text-lg shrink-0 border ${typeStyle.bg} ${typeStyle.border}`}>
          <span className={typeStyle.text}>{typeStyle.icon}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg font-semibold text-slate-900">{ward.name}</h3>
            <span className={`badge text-xs font-semibold capitalize border
                              ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
              {ward.type === "operating-theatre" ? "OR" : ward.type.toUpperCase()}
            </span>
            {ward.floor && (
              <span className="text-xs text-slate-400 font-mono">{ward.floor}</span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-500">{available} available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs text-slate-500">{occupied} occupied</span>
            </div>
            {maintenance > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500">{maintenance} maintenance</span>
              </div>
            )}
            <span className="text-xs text-slate-400 ml-auto font-mono">
              {occupancyPct}% full
            </span>
          </div>

          {/* Occupancy bar */}
          <div className="mt-2">
            <OccupancyBar total={total} occupied={occupied} maintenance={maintenance} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canWrite && (
            <button onClick={() => onEdit(ward)}
              className="w-8 h-8 rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100
                         flex items-center justify-center text-xs transition-colors">
              ✎
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(ward)}
              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100
                         flex items-center justify-center text-xs transition-colors">
              ✕
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500
                       flex items-center justify-center transition-all duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            ›
          </button>
        </div>
      </div>

      {/* Expandable bed grid */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bed Map · {total} beds
            </p>
          </div>
          <BedGrid
            ward={ward}
            canWrite={canWrite}
            onAdmit={onAdmit}
            onDischarge={onDischarge}
            onMaintenance={onMaintenance}
          />
          {ward.description && (
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">{ward.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function Wards() {
  const { user } = useAuth();

  const canWrite  = ["admin", "receptionist"].includes(user?.role);
  const canDelete = user?.role === "admin";

  const [wards,       setWards]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState("");

  const [showForm,    setShowForm]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [toast,       setToast]       = useState(null);

  const [typeFilter,  setTypeFilter]  = useState("all");

  const fetchWards = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/wards");
      setWards(data);
    } catch {
      setError("Failed to load wards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWards(); }, []);

  // Global stats
  const stats = useMemo(() => ({
    totalBeds:   wards.reduce((s, w) => s + (w.totalBeds       ?? 0), 0),
    available:   wards.reduce((s, w) => s + (w.availableBeds   ?? 0), 0),
    occupied:    wards.reduce((s, w) => s + (w.occupiedBeds    ?? 0), 0),
    maintenance: wards.reduce((s, w) => s + (w.beds ?? []).filter((b) => b.status === "maintenance").length, 0),
  }), [wards]);

  const filteredWards = useMemo(() =>
    typeFilter === "all" ? wards : wards.filter((w) => w.type === typeFilter),
  [wards, typeFilter]);

  // ── CRUD handlers ─────────────────────────────────────────
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selected?._id) {
        await api.put(`/wards/${selected._id}`, formData);
        setToast({ message: "Ward updated successfully", type: "success" });
      } else {
        await api.post("/wards", formData);
        setToast({ message: "Ward created successfully", type: "success" });
      }
      setShowForm(false);
      setSelected(null);
      fetchWards();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/wards/${selected._id}`);
      setToast({ message: "Ward deleted", type: "success" });
      setShowConfirm(false);
      setSelected(null);
      fetchWards();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Delete failed — ward may have occupied beds", type: "error" });
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Bed action handlers ───────────────────────────────────
  const handleAdmit = async (wardId, bedNumber, patientId) => {
    try {
      await api.post(`/wards/${wardId}/admit`, { bedNumber, patientId });
      setToast({ message: "Patient admitted successfully", type: "success" });
      fetchWards();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Admission failed", type: "error" });
    }
  };

  const handleDischarge = async (wardId, bedNumber) => {
    try {
      await api.post(`/wards/${wardId}/discharge`, { bedNumber });
      setToast({ message: "Patient discharged", type: "success" });
      fetchWards();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Discharge failed", type: "error" });
    }
  };

  const handleMaintenance = async (wardId, bedNumber) => {
    try {
      await api.post(`/wards/${wardId}/maintenance`, { bedNumber });
      setToast({ message: "Bed status updated", type: "success" });
      fetchWards();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Action failed", type: "error" });
    }
  };

  const wardTypes = ["all", ...new Set(wards.map((w) => w.type))];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Wards & Beds</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {wards.length} ward{wards.length !== 1 ? "s" : ""} · {stats.totalBeds} total beds
          </p>
        </div>
        {canWrite && (
          <button onClick={() => { setSelected(null); setShowForm(true); }} className="btn-primary">
            + New Ward
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200
                        text-rose-700 text-sm flex gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Beds",   value: stats.totalBeds,   color: "text-slate-700",   bg: "bg-slate-50",    icon: "▦" },
          { label: "Available",    value: stats.available,   color: "text-emerald-700", bg: "bg-emerald-50",  icon: "✓" },
          { label: "Occupied",     value: stats.occupied,    color: "text-rose-700",    bg: "bg-rose-50",     icon: "♥" },
          { label: "Maintenance",  value: stats.maintenance, color: "text-amber-700",   bg: "bg-amber-50",    icon: "⚙" },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center
                             justify-center text-base shrink-0`}>
              <span className={color}>{icon}</span>
            </div>
            <div>
              <p className={`text-2xl font-display font-semibold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Type filter */}
      {wardTypes.length > 2 && (
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1
                        shadow-sm w-fit">
          {wardTypes.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                typeFilter === t
                  ? "bg-navy-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-sand-100"
              }`}>
              {t === "operating-theatre" ? "OR" : t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      )}

      {/* Ward cards */}
      {loading ? (
        <div className="card py-14 text-center">
          <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                          rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading wards...</p>
        </div>
      ) : filteredWards.length === 0 ? (
        <div className="card text-center py-16 border-2 border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                          flex items-center justify-center text-2xl mx-auto mb-4">▦</div>
          <p className="text-slate-600 font-medium">
            {typeFilter !== "all" ? `No ${typeFilter} wards found` : "No wards created yet"}
          </p>
          {canWrite && typeFilter === "all" && (
            <button onClick={() => { setSelected(null); setShowForm(true); }}
              className="btn-primary mt-4 mx-auto">
              + Create First Ward
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWards.map((ward) => (
            <WardCard
              key={ward._id}
              ward={ward}
              canWrite={canWrite}
              canDelete={canDelete}
              onEdit={(w)   => { setSelected(w);    setShowForm(true);    }}
              onDelete={(w) => { setSelected(w);    setShowConfirm(true); }}
              onAdmit={handleAdmit}
              onDischarge={handleDischarge}
              onMaintenance={handleMaintenance}
            />
          ))}
        </div>
      )}

      {/* Panels */}
      {showForm && (
        <WardForm
          ward={selected}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelected(null); }}
          loading={saving}
        />
      )}
      {showConfirm && selected && (
        <ConfirmDialog
          title="Delete Ward"
          message={`Permanently delete "${selected.name}"? All bed data will be lost. Wards with occupied beds cannot be deleted.`}
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
