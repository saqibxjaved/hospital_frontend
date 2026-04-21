import { useState, useEffect } from "react";
import api from "../../api/axiosClient";

const EMPTY = {
  appointment: "",
  consultationFee: "",
  medicationCharges: [],
  labTestCharges: [],
  roomCharges: "",
  insurance: { provider: "", policyNumber: "", coveredAmount: "" },
  notes: "",
};

const EMPTY_MED = { name: "", amount: "" };
const EMPTY_LAB = { testName: "", amount: "" };

export default function BillForm({ onSave, onClose, loading }) {
  const [form,         setForm]         = useState(EMPTY);
  const [appointments, setAppointments] = useState([]);
  const [fetching,     setFetching]     = useState(true);
  const [errors,       setErrors]       = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const [apptRes, billRes] = await Promise.all([
          api.get("/appointments"),
          api.get("/billing"),
        ]);
        // Only show appointments that don't already have a bill
        const billedApptIds = new Set(
          billRes.data.map((b) => b.appointment?._id || b.appointment)
        );
        setAppointments(
          apptRes.data
            .filter((a) => !billedApptIds.has(a._id) && a.status !== "cancelled")
            .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
        );
      } catch { /* ignore */ }
      finally { setFetching(false); }
    };
    fetch();
  }, []);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const setInsurance = (k, v) =>
    setForm((f) => ({ ...f, insurance: { ...f.insurance, [k]: v } }));

  // Medication charges
  const addMed    = () => setForm((f) => ({ ...f, medicationCharges: [...f.medicationCharges, { ...EMPTY_MED }] }));
  const updateMed = (i, k, v) => setForm((f) => ({
    ...f, medicationCharges: f.medicationCharges.map((m, idx) => idx === i ? { ...m, [k]: v } : m),
  }));
  const removeMed = (i) => setForm((f) => ({ ...f, medicationCharges: f.medicationCharges.filter((_, idx) => idx !== i) }));

  // Lab charges
  const addLab    = () => setForm((f) => ({ ...f, labTestCharges: [...f.labTestCharges, { ...EMPTY_LAB }] }));
  const updateLab = (i, k, v) => setForm((f) => ({
    ...f, labTestCharges: f.labTestCharges.map((l, idx) => idx === i ? { ...l, [k]: v } : l),
  }));
  const removeLab = (i) => setForm((f) => ({ ...f, labTestCharges: f.labTestCharges.filter((_, idx) => idx !== i) }));

  // Live subtotal
  const subtotal =
    (parseFloat(form.consultationFee) || 0) +
    form.medicationCharges.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0) +
    form.labTestCharges.reduce((s, l)    => s + (parseFloat(l.amount) || 0), 0) +
    (parseFloat(form.roomCharges) || 0);

  const covered = parseFloat(form.insurance.coveredAmount) || 0;
  const total   = Math.max(0, subtotal - covered);

  const validate = () => {
    const e = {};
    if (!form.appointment)      e.appointment     = "Select an appointment";
    if (!form.consultationFee)  e.consultationFee = "Enter consultation fee";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      consultationFee: parseFloat(form.consultationFee) || 0,
      roomCharges:     parseFloat(form.roomCharges)     || 0,
      medicationCharges: form.medicationCharges.map((m) => ({ ...m, amount: parseFloat(m.amount) || 0 })),
      labTestCharges:    form.labTestCharges.map((l)    => ({ ...l, amount: parseFloat(l.amount) || 0 })),
      insurance: {
        ...form.insurance,
        coveredAmount: parseFloat(form.insurance.coveredAmount) || 0,
      },
    });
  };

  const selectedAppt = appointments.find((a) => a._id === form.appointment);

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
            <h2 className="font-display text-xl font-semibold text-slate-900">New Bill</h2>
            <p className="text-sm text-slate-400 mt-0.5">Create a bill linked to an appointment</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-sand-50">
          {fetching ? (
            <div className="py-10 text-center">
              <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                              rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm mt-3">Loading appointments...</p>
            </div>
          ) : (
            <>
              {/* Appointment picker */}
              <div className="card p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Linked Appointment
                </p>
                <div>
                  <label className="label">Appointment *</label>
                  <select value={form.appointment}
                    onChange={(e) => set("appointment", e.target.value)}
                    className={`input ${errors.appointment ? "input-error" : ""}`}>
                    <option value="">Select appointment...</option>
                    {appointments.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.patient?.firstName} {a.patient?.lastName} ·{" "}
                        {new Date(a.appointmentDate).toLocaleDateString("en-US",
                          { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                        Dr. {a.doctor?.lastName}
                      </option>
                    ))}
                  </select>
                  <FieldError name="appointment" />
                  {appointments.length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      All appointments already have bills, or none exist yet.
                    </p>
                  )}
                </div>

                {/* Selected appointment preview */}
                {selectedAppt && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                  bg-navy-50 border border-navy-100">
                    <div className="w-8 h-8 rounded-lg bg-navy-500 text-white flex items-center
                                    justify-center text-xs font-bold shrink-0">
                      {selectedAppt.patient?.firstName?.[0]}{selectedAppt.patient?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-800">
                        {selectedAppt.patient?.firstName} {selectedAppt.patient?.lastName}
                      </p>
                      <p className="text-xs text-navy-600">
                        Dr. {selectedAppt.doctor?.firstName} {selectedAppt.doctor?.lastName} ·{" "}
                        {selectedAppt.timeSlot} · {selectedAppt.type}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Charges */}
              <div className="card p-4 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Charges
                </p>

                {/* Consultation fee */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Consultation Fee *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                                       text-slate-400 text-sm font-medium">$</span>
                      <input type="number" min="0" step="0.01" value={form.consultationFee}
                        onChange={(e) => set("consultationFee", e.target.value)}
                        className={`input pl-7 ${errors.consultationFee ? "input-error" : ""}`}
                        placeholder="0.00" />
                    </div>
                    <FieldError name="consultationFee" />
                  </div>
                  <div>
                    <label className="label">Room / Ward Charges</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2
                                       text-slate-400 text-sm font-medium">$</span>
                      <input type="number" min="0" step="0.01" value={form.roomCharges}
                        onChange={(e) => set("roomCharges", e.target.value)}
                        className="input pl-7" placeholder="0.00" />
                    </div>
                  </div>
                </div>

                {/* Medication charges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Medication Charges</label>
                    <button type="button" onClick={addMed}
                      className="btn-outline text-xs py-1 px-2.5">+ Add</button>
                  </div>
                  {form.medicationCharges.length === 0
                    ? <p className="text-xs text-slate-300">None added</p>
                    : form.medicationCharges.map((m, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={m.name}
                            onChange={(e) => updateMed(i, "name", e.target.value)}
                            className="input flex-1 text-sm py-2" placeholder="Medication name" />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input type="number" min="0" step="0.01" value={m.amount}
                              onChange={(e) => updateMed(i, "amount", e.target.value)}
                              className="input pl-6 text-sm py-2" placeholder="0.00" />
                          </div>
                          <button onClick={() => removeMed(i)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400
                                       hover:bg-rose-100 flex items-center justify-center
                                       text-xs shrink-0 transition-colors">✕</button>
                        </div>
                      ))
                  }
                </div>

                {/* Lab charges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Lab Test Charges</label>
                    <button type="button" onClick={addLab}
                      className="btn-outline text-xs py-1 px-2.5">+ Add</button>
                  </div>
                  {form.labTestCharges.length === 0
                    ? <p className="text-xs text-slate-300">None added</p>
                    : form.labTestCharges.map((l, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input value={l.testName}
                            onChange={(e) => updateLab(i, "testName", e.target.value)}
                            className="input flex-1 text-sm py-2" placeholder="Test name" />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input type="number" min="0" step="0.01" value={l.amount}
                              onChange={(e) => updateLab(i, "amount", e.target.value)}
                              className="input pl-6 text-sm py-2" placeholder="0.00" />
                          </div>
                          <button onClick={() => removeLab(i)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400
                                       hover:bg-rose-100 flex items-center justify-center
                                       text-xs shrink-0 transition-colors">✕</button>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Insurance */}
              <div className="card p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Insurance (Optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Provider</label>
                    <input value={form.insurance.provider}
                      onChange={(e) => setInsurance("provider", e.target.value)}
                      className="input" placeholder="e.g. Blue Cross" />
                  </div>
                  <div>
                    <label className="label">Policy Number</label>
                    <input value={form.insurance.policyNumber}
                      onChange={(e) => setInsurance("policyNumber", e.target.value)}
                      className="input" placeholder="e.g. POL-12345" />
                  </div>
                </div>
                <div>
                  <label className="label">Covered Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min="0" step="0.01"
                      value={form.insurance.coveredAmount}
                      onChange={(e) => setInsurance("coveredAmount", e.target.value)}
                      className="input pl-7" placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="card p-4">
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className="input resize-none h-16" placeholder="Any additional billing notes..." />
              </div>

              {/* Live total preview */}
              <div className="card p-4 bg-navy-50 border-navy-100">
                <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">
                  Bill Summary
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  {covered > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Insurance Coverage</span>
                      <span className="font-mono">− ${covered.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-navy-800 pt-2
                                  border-t border-navy-200 text-base">
                    <span>Total Due</span>
                    <span className="font-mono">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || fetching}
            className="btn-primary flex-1 justify-center">
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              : "Create Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
