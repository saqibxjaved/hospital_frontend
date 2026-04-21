import { useState, useEffect } from "react";

const EMPTY_PRESCRIPTION = { medication: "", dosage: "", frequency: "", duration: "", notes: "" };
const EMPTY_LAB          = { testName: "", result: "", referenceRange: "", status: "normal" };

const EMPTY = {
  visitDate: new Date().toISOString().split("T")[0],
  chiefComplaint: "",
  diagnosis: "",
  vitalSigns: { bloodPressure: "", heartRate: "", temperature: "", weight: "", height: "" },
  prescriptions: [],
  labResults: [],
  doctorNotes: "",
  followUpDate: "",
};

export default function VisitForm({ visit, onSave, onClose, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visit) {
      setForm({
        ...EMPTY,
        ...visit,
        visitDate: visit.visitDate
          ? new Date(visit.visitDate).toISOString().split("T")[0]
          : EMPTY.visitDate,
        followUpDate: visit.followUpDate
          ? new Date(visit.followUpDate).toISOString().split("T")[0]
          : "",
        vitalSigns:    { ...EMPTY.vitalSigns,    ...(visit.vitalSigns    || {}) },
        prescriptions: visit.prescriptions?.map((p) => ({ ...EMPTY_PRESCRIPTION, ...p })) || [],
        labResults:    visit.labResults?.map((l)    => ({ ...EMPTY_LAB,          ...l })) || [],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [visit]);

  const isEdit = !!visit?._id;

  // ── Generic field handlers ────────────────────────────────
  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const setVital = (key, value) =>
    setForm((f) => ({ ...f, vitalSigns: { ...f.vitalSigns, [key]: value } }));

  // ── Prescriptions ────────────────────────────────────────
  const addPrescription = () =>
    setForm((f) => ({ ...f, prescriptions: [...f.prescriptions, { ...EMPTY_PRESCRIPTION }] }));

  const updatePrescription = (i, key, val) =>
    setForm((f) => ({
      ...f,
      prescriptions: f.prescriptions.map((p, idx) => idx === i ? { ...p, [key]: val } : p),
    }));

  const removePrescription = (i) =>
    setForm((f) => ({ ...f, prescriptions: f.prescriptions.filter((_, idx) => idx !== i) }));

  // ── Lab Results ──────────────────────────────────────────
  const addLab = () =>
    setForm((f) => ({ ...f, labResults: [...f.labResults, { ...EMPTY_LAB }] }));

  const updateLab = (i, key, val) =>
    setForm((f) => ({
      ...f,
      labResults: f.labResults.map((l, idx) => idx === i ? { ...l, [key]: val } : l),
    }));

  const removeLab = (i) =>
    setForm((f) => ({ ...f, labResults: f.labResults.filter((_, idx) => idx !== i) }));

  // ── Validate + submit ────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.visitDate)           e.visitDate       = "Required";
    if (!form.chiefComplaint.trim()) e.chiefComplaint = "Required";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const FieldError = ({ name }) =>
    errors[name] ? <p className="text-rose-500 text-xs mt-1">{errors[name]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {isEdit ? "Edit Visit" : "Add Visit Entry"}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEdit ? "Update this visit record" : "Record a new clinical visit"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-sand-50">

          {/* Basic info */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visit Info</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Visit Date *</label>
                <input type="date" value={form.visitDate}
                  onChange={(e) => set("visitDate", e.target.value)}
                  className={`input ${errors.visitDate ? "input-error" : ""}`} />
                <FieldError name="visitDate" />
              </div>
              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" value={form.followUpDate}
                  onChange={(e) => set("followUpDate", e.target.value)}
                  min={form.visitDate} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Chief Complaint *</label>
              <input value={form.chiefComplaint}
                onChange={(e) => set("chiefComplaint", e.target.value)}
                className={`input ${errors.chiefComplaint ? "input-error" : ""}`}
                placeholder="Primary reason for visit..." />
              <FieldError name="chiefComplaint" />
            </div>
            <div>
              <label className="label">Diagnosis</label>
              <input value={form.diagnosis}
                onChange={(e) => set("diagnosis", e.target.value)}
                className="input" placeholder="Clinical diagnosis..." />
            </div>
            <div>
              <label className="label">Doctor's Notes</label>
              <textarea value={form.doctorNotes}
                onChange={(e) => set("doctorNotes", e.target.value)}
                className="input resize-none h-20"
                placeholder="Additional clinical observations..." />
            </div>
          </div>

          {/* Vital Signs */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vital Signs</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "bloodPressure", label: "Blood Pressure", placeholder: "120/80 mmHg" },
                { key: "heartRate",     label: "Heart Rate",     placeholder: "72 bpm"      },
                { key: "temperature",   label: "Temperature",    placeholder: "98.6 °F"     },
                { key: "weight",        label: "Weight",         placeholder: "70 kg"       },
                { key: "height",        label: "Height",         placeholder: "175 cm"      },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input value={form.vitalSigns[key] || ""}
                    onChange={(e) => setVital(key, e.target.value)}
                    className="input" placeholder={placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Prescriptions
              </p>
              <button type="button" onClick={addPrescription}
                className="btn-outline text-xs py-1 px-2.5">
                + Add
              </button>
            </div>

            {form.prescriptions.length === 0 ? (
              <p className="text-sm text-slate-300 py-2">No prescriptions added</p>
            ) : (
              form.prescriptions.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-navy-600">
                      Prescription {i + 1}
                    </span>
                    <button type="button" onClick={() => removePrescription(i)}
                      className="w-6 h-6 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100
                                 flex items-center justify-center text-xs transition-colors">
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Medication</label>
                      <input value={p.medication}
                        onChange={(e) => updatePrescription(i, "medication", e.target.value)}
                        className="input text-xs py-1.5" placeholder="Drug name" />
                    </div>
                    <div>
                      <label className="label">Dosage</label>
                      <input value={p.dosage}
                        onChange={(e) => updatePrescription(i, "dosage", e.target.value)}
                        className="input text-xs py-1.5" placeholder="500mg" />
                    </div>
                    <div>
                      <label className="label">Frequency</label>
                      <input value={p.frequency}
                        onChange={(e) => updatePrescription(i, "frequency", e.target.value)}
                        className="input text-xs py-1.5" placeholder="Twice daily" />
                    </div>
                    <div>
                      <label className="label">Duration</label>
                      <input value={p.duration}
                        onChange={(e) => updatePrescription(i, "duration", e.target.value)}
                        className="input text-xs py-1.5" placeholder="7 days" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input value={p.notes}
                      onChange={(e) => updatePrescription(i, "notes", e.target.value)}
                      className="input text-xs py-1.5" placeholder="Take after meals..." />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lab Results */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Lab Results
              </p>
              <button type="button" onClick={addLab}
                className="btn-outline text-xs py-1 px-2.5">
                + Add
              </button>
            </div>

            {form.labResults.length === 0 ? (
              <p className="text-sm text-slate-300 py-2">No lab results added</p>
            ) : (
              form.labResults.map((l, i) => (
                <div key={i} className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-600">Lab Result {i + 1}</span>
                    <button type="button" onClick={() => removeLab(i)}
                      className="w-6 h-6 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100
                                 flex items-center justify-center text-xs transition-colors">
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Test Name</label>
                      <input value={l.testName}
                        onChange={(e) => updateLab(i, "testName", e.target.value)}
                        className="input text-xs py-1.5" placeholder="CBC, HbA1c..." />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select value={l.status}
                        onChange={(e) => updateLab(i, "status", e.target.value)}
                        className="input text-xs py-1.5">
                        <option value="normal">Normal</option>
                        <option value="abnormal">Abnormal</option>
                        <option value="critical">Critical</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Result</label>
                      <input value={l.result}
                        onChange={(e) => updateLab(i, "result", e.target.value)}
                        className="input text-xs py-1.5" placeholder="5.4 mmol/L" />
                    </div>
                    <div>
                      <label className="label">Reference Range</label>
                      <input value={l.referenceRange}
                        onChange={(e) => updateLab(i, "referenceRange", e.target.value)}
                        className="input text-xs py-1.5" placeholder="3.9–5.6" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              : isEdit ? "Save Changes" : "Add Visit"}
          </button>
        </div>
      </div>
    </div>
  );
}
