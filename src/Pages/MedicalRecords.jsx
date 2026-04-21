import { useState, useEffect, useRef } from "react";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";
import VisitForm      from "./records/VisitForm";
import RecordInfoForm from "./records/RecordInfoForm";
import ConfirmDialog  from "../Components/ui/ConfirmDialog";
import Toast          from "../Components/ui/Toast";

// ── Helpers ────────────────────────────────────────────────

const labStatusStyle = {
  normal:   "badge-success",
  abnormal: "badge-warning",
  critical: "badge-danger",
  pending:  "badge-neutral",
};

const bloodBg = {
  "A+":"bg-red-50 text-red-700","A-":"bg-red-50 text-red-600",
  "B+":"bg-orange-50 text-orange-700","B-":"bg-orange-50 text-orange-600",
  "AB+":"bg-violet-50 text-violet-700","AB-":"bg-violet-50 text-violet-600",
  "O+":"bg-sky-50 text-sky-700","O-":"bg-sky-50 text-sky-600",
};

// ── Visit Card ─────────────────────────────────────────────

function VisitCard({ visit, onEdit, onDelete, canEdit, canDelete }) {
  const [expanded, setExpanded] = useState(false);

  const hasPrescriptions = visit.prescriptions?.length > 0;
  const hasLabs          = visit.labResults?.length    > 0;
  const hasVitals        = Object.values(visit.vitalSigns || {}).some(Boolean);

  return (
    <div className="card border border-slate-100 hover:border-slate-200 transition-colors">

      {/* Visit header */}
      <div className="flex items-start justify-between gap-4">
        <button className="flex-1 text-left" onClick={() => setExpanded((e) => !e)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-100
                            flex items-center justify-center text-navy-600 text-sm font-bold shrink-0">
              {new Date(visit.visitDate).getDate()}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {new Date(visit.visitDate).toLocaleDateString("en-US",
                  { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{visit.chiefComplaint}</p>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {hasPrescriptions && (
            <span className="badge badge-navy text-xs">{visit.prescriptions.length} Rx</span>
          )}
          {hasLabs && (
            <span className="badge badge-info text-xs">{visit.labResults.length} Labs</span>
          )}
          {canEdit && (
            <button onClick={() => onEdit(visit)}
              className="w-7 h-7 rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100
                         flex items-center justify-center text-xs transition-colors">
              ✎
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(visit)}
              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100
                         flex items-center justify-center text-xs transition-colors">
              ✕
            </button>
          )}
          <button onClick={() => setExpanded((e) => !e)}
            className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200
                       flex items-center justify-center text-xs transition-all duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            ›
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">

          {/* Diagnosis + Notes */}
          {visit.diagnosis && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Diagnosis
              </p>
              <p className="text-sm text-slate-700">{visit.diagnosis}</p>
            </div>
          )}
          {visit.doctorNotes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Doctor's Notes
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{visit.doctorNotes}</p>
            </div>
          )}

          {/* Vitals */}
          {hasVitals && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Vital Signs
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: "bloodPressure", label: "Blood Pressure", icon: "♥" },
                  { key: "heartRate",     label: "Heart Rate",     icon: "⟳" },
                  { key: "temperature",   label: "Temperature",    icon: "◌" },
                  { key: "weight",        label: "Weight",         icon: "▣" },
                  { key: "height",        label: "Height",         icon: "↕" },
                ].filter(({ key }) => visit.vitalSigns?.[key]).map(({ key, label, icon }) => (
                  <div key={key}
                    className="px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-200">
                    <p className="text-xs text-slate-400 mb-0.5">{icon} {label}</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">
                      {visit.vitalSigns[key]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {hasPrescriptions && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Prescriptions
              </p>
              <div className="space-y-2">
                {visit.prescriptions.map((p, i) => (
                  <div key={i}
                    className="px-4 py-3 rounded-xl bg-navy-50 border border-navy-100
                               flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-navy-100 flex items-center
                                    justify-center text-navy-600 text-xs font-bold shrink-0">
                      Rx
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy-800">{p.medication}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {p.dosage    && <span className="text-xs text-navy-600">{p.dosage}</span>}
                        {p.frequency && <span className="text-xs text-navy-600">· {p.frequency}</span>}
                        {p.duration  && <span className="text-xs text-navy-600">· {p.duration}</span>}
                      </div>
                      {p.notes && (
                        <p className="text-xs text-navy-500 mt-1 italic">{p.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Results */}
          {hasLabs && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Lab Results
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="table text-xs">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Result</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visit.labResults.map((l, i) => (
                      <tr key={i}>
                        <td className="font-medium text-slate-700">{l.testName}</td>
                        <td className="font-mono text-slate-600">{l.result || "—"}</td>
                        <td className="text-slate-400">{l.referenceRange || "—"}</td>
                        <td>
                          <span className={labStatusStyle[l.status] ?? "badge-neutral"}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Follow-up */}
          {visit.followUpDate && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                            bg-amber-50 border border-amber-100">
              <span className="text-amber-500 text-sm">◷</span>
              <p className="text-xs text-amber-700 font-medium">
                Follow-up scheduled:{" "}
                {new Date(visit.followUpDate).toLocaleDateString("en-US",
                  { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function MedicalRecords() {
  const { user } = useAuth();

  const canEdit   = ["admin", "doctor"].includes(user?.role);
  const canCreate = ["admin", "receptionist"].includes(user?.role);
  const canDelete = user?.role === "admin";

  const [search,          setSearch]          = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [searching,       setSearching]       = useState(false);
  const [showDropdown,    setShowDropdown]    = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [record,          setRecord]          = useState(null);
  const [recordLoading,   setRecordLoading]   = useState(false);

  const [showVisitForm,   setShowVisitForm]   = useState(false);
  const [showInfoForm,    setShowInfoForm]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [selectedVisit,   setSelectedVisit]   = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [toast,           setToast]           = useState(null);

  const searchRef = useRef(null);
  const dropRef   = useRef(null);

  // ── Patient search ───────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/patients");
        const results = data.filter((p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          p.phone?.includes(search)
        ).slice(0, 8);
        setSearchResults(results);
        setShowDropdown(true);
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearch(`${patient.firstName} ${patient.lastName}`);
    setShowDropdown(false);
    setRecord(null);
    setRecordLoading(true);
    try {
      const { data } = await api.get(`/medical-records/patient/${patient._id}`);
      setRecord(data);
    } catch (err) {
      if (err.response?.status === 404) setRecord(null);
    } finally {
      setRecordLoading(false);
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setRecord(null);
    setSearch("");
  };

  // ── Create record (first time) ───────────────────────────
  const handleCreateRecord = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/medical-records", { patient: selectedPatient._id });
      setRecord(data);
      setToast({ message: "Medical record created", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to create record", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Add / edit visit ─────────────────────────────────────
  const handleSaveVisit = async (formData) => {
    setSaving(true);
    try {
      if (selectedVisit?._id) {
        await api.put(`/medical-records/${record._id}/visits/${selectedVisit._id}`, formData);
        setToast({ message: "Visit updated", type: "success" });
      } else {
        await api.post(`/medical-records/${record._id}/visits`, formData);
        setToast({ message: "Visit added", type: "success" });
      }
      setShowVisitForm(false);
      setSelectedVisit(null);
      // Refresh record
      const { data } = await api.get(`/medical-records/patient/${selectedPatient._id}`);
      setRecord(data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Update top-level record info ─────────────────────────
  const handleSaveInfo = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/medical-records/${record._id}`, formData);
      setRecord(data);
      setShowInfoForm(false);
      setToast({ message: "Medical info updated", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete visit ─────────────────────────────────────────
  const handleDeleteVisit = async () => {
    setDeleting(true);
    try {
      await api.delete(`/medical-records/${record._id}/visits/${selectedVisit._id}`);
      setToast({ message: "Visit deleted", type: "success" });
      setShowConfirm(false);
      setSelectedVisit(null);
      const { data } = await api.get(`/medical-records/patient/${selectedPatient._id}`);
      setRecord(data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Delete failed", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const visits = record?.visits
    ? [...record.visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
    : [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Medical Records</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Search for a patient to view or manage their clinical record
          </p>
        </div>
      </div>

      {/* Patient search */}
      <div className="card p-4">
        <label className="label mb-2">Search Patient</label>
        <div className="relative" ref={dropRef}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm select-none">
              ⊘
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (selectedPatient) clearPatient(); }}
              className="input pl-9 bg-white"
              placeholder="Type patient name or phone number..."
            />
            {searching && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <span className="w-4 h-4 border-2 border-navy-200 border-t-navy-600
                                 rounded-full animate-spin block" />
              </span>
            )}
            {selectedPatient && (
              <button onClick={clearPatient}
                className="absolute right-3.5 top-1/2 -translate-y-1/2
                           text-slate-400 hover:text-rose-500 transition-colors text-sm">
                ✕
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200
                            rounded-xl shadow-card-md overflow-hidden">
              {searchResults.map((p) => (
                <button
                  key={p._id}
                  onMouseDown={() => selectPatient(p)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3
                             hover:bg-sand-50 transition-colors border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-navy-500 text-white flex items-center
                                  justify-center text-xs font-bold shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">{p.phone}</p>
                  </div>
                  <span className={`ml-auto badge text-xs ${
                    p.status === "active"     ? "badge-success" :
                    p.status === "admitted"   ? "badge-warning" : "badge-neutral"
                  }`}>{p.status}</span>
                </button>
              ))}
            </div>
          )}

          {showDropdown && searchResults.length === 0 && !searching && search.trim() && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200
                            rounded-xl shadow-card-md px-4 py-3">
              <p className="text-sm text-slate-400">No patients found for "{search}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Record loading */}
      {recordLoading && (
        <div className="card py-14 text-center">
          <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                          rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading medical record...</p>
        </div>
      )}

      {/* No record yet */}
      {selectedPatient && !recordLoading && !record && (
        <div className="card text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                          flex items-center justify-center text-2xl mx-auto mb-4">☰</div>
          <h3 className="font-display text-lg font-semibold text-slate-700 mb-1">
            No Medical Record Found
          </h3>
          <p className="text-slate-400 text-sm mb-5">
            {selectedPatient.firstName} {selectedPatient.lastName} doesn't have a record yet.
          </p>
          {canCreate && (
            <button onClick={handleCreateRecord} disabled={saving}
              className="btn-primary mx-auto">
              {saving ? "Creating..." : "Create Medical Record"}
            </button>
          )}
        </div>
      )}

      {/* Record view */}
      {selectedPatient && !recordLoading && record && (
        <div className="space-y-5">

          {/* Patient + record summary */}
          <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-navy-500 flex items-center justify-center
                            text-white text-xl font-bold shadow-navy shrink-0">
              {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {record.bloodGroup && (
                  <span className={`badge ring-1 font-bold ${bloodBg[record.bloodGroup] ?? "bg-slate-100 text-slate-600"}`}>
                    {record.bloodGroup}
                  </span>
                )}
                {record.allergies?.map((a) => (
                  <span key={a} className="badge badge-danger">{a}</span>
                ))}
                {record.chronicConditions?.map((c) => (
                  <span key={c} className="badge badge-warning">{c}</span>
                ))}
                {!record.bloodGroup && !record.allergies?.length && !record.chronicConditions?.length && (
                  <span className="text-sm text-slate-400">No medical info recorded yet</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {canEdit && (
                <button onClick={() => setShowInfoForm(true)} className="btn-outline text-sm">
                  ✎ Edit Info
                </button>
              )}
              {(canEdit || canCreate) && (
                <button onClick={() => { setSelectedVisit(null); setShowVisitForm(true); }}
                  className="btn-primary text-sm">
                  + Add Visit
                </button>
              )}
            </div>
          </div>

          {/* Visit history */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-title">Visit History</h3>
                <p className="section-sub">
                  {visits.length} visit{visits.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
            </div>

            {visits.length === 0 ? (
              <div className="card text-center py-10 border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No visits recorded yet</p>
                {(canEdit || canCreate) && (
                  <button onClick={() => { setSelectedVisit(null); setShowVisitForm(true); }}
                    className="btn-primary mt-3 mx-auto text-sm">
                    + Add First Visit
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((v) => (
                  <VisitCard
                    key={v._id}
                    visit={v}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={(visit) => { setSelectedVisit(visit); setShowVisitForm(true); }}
                    onDelete={(visit) => { setSelectedVisit(visit); setShowConfirm(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state — no patient selected */}
      {!selectedPatient && !recordLoading && (
        <div className="card text-center py-20 border-2 border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100
                          flex items-center justify-center text-3xl mx-auto mb-4">☰</div>
          <h3 className="font-display text-lg font-semibold text-slate-600">
            Search for a Patient
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Type a patient's name above to load their medical record
          </p>
        </div>
      )}

      {/* Panels */}
      {showVisitForm && (
        <VisitForm
          visit={selectedVisit}
          onSave={handleSaveVisit}
          onClose={() => { setShowVisitForm(false); setSelectedVisit(null); }}
          loading={saving}
        />
      )}
      {showInfoForm && record && (
        <RecordInfoForm
          record={record}
          onSave={handleSaveInfo}
          onClose={() => setShowInfoForm(false)}
          loading={saving}
        />
      )}
      {showConfirm && selectedVisit && (
        <ConfirmDialog
          title="Delete Visit"
          message={`Delete the visit from ${new Date(selectedVisit.visitDate).toLocaleDateString()}? This cannot be undone.`}
          onConfirm={handleDeleteVisit}
          onCancel={() => { setShowConfirm(false); setSelectedVisit(null); }}
          loading={deleting}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
