import { useState, useEffect } from "react";
import api from "../../api/axiosClient";

export default function AdmitForm({ bed, wardName, onSave, onClose, loading }) {
  const [patients,   setPatients]   = useState([]);
  const [patientId,  setPatientId]  = useState("");
  const [fetching,   setFetching]   = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/patients");
        // Only active patients who aren't already admitted
        setPatients(data.filter((p) => p.status === "active"));
      } catch { setError("Failed to load patients."); }
      finally { setFetching(false); }
    };
    fetch();
  }, []);

  const handleSubmit = () => {
    if (!patientId) { setError("Please select a patient."); return; }
    onSave(patientId);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-card-lg
                      border border-slate-100 p-6 animate-scale-in">

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100
                          flex items-center justify-center text-emerald-600 text-lg">▦</div>
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">Admit Patient</h3>
            <p className="text-xs text-slate-400">
              {wardName} · Bed <span className="font-mono font-semibold">{bed?.bedNumber}</span>
            </p>
          </div>
        </div>

        {fetching ? (
          <div className="py-6 text-center">
            <div className="w-5 h-5 border-2 border-navy-200 border-t-navy-600
                            rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <label className="label">Select Patient</label>
            <select value={patientId} onChange={(e) => { setPatientId(e.target.value); setError(""); }}
              className={`input mb-2 ${error ? "input-error" : ""}`}>
              <option value="">Choose a patient...</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} · {p.phone}
                </option>
              ))}
            </select>
            {error && <p className="text-rose-500 text-xs mb-3">{error}</p>}
            {patients.length === 0 && (
              <p className="text-xs text-slate-400 mb-3">No active patients available to admit.</p>
            )}
          </>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || fetching}
            className="btn-success flex-1 justify-center">
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Admitting...
                </span>
              : "Admit Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
