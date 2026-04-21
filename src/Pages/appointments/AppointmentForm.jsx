import { useState, useEffect } from "react";
import api from "../../api/axiosClient";

const TIME_SLOTS = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM",
  "05:00 PM",
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const EMPTY = {
  patient: "", doctor: "", appointmentDate: "", timeSlot: "",
  type: "in-person", reason: "", notes: "",
};

export default function AppointmentForm({ prefillDate, onSave, onClose, loading }) {
  const [form,     setForm]     = useState({ ...EMPTY, appointmentDate: prefillDate || "" });
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [fetching, setFetching] = useState(true);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get("/patients"),
          api.get("/doctors"),
        ]);
        setPatients(pRes.data.filter((p) => p.status === "active"));
        setDoctors(dRes.data.filter((d) => d.status === "active"));
      } catch { /* ignore */ }
      finally { setFetching(false); }
    };
    fetchData();
  }, []);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const selectedDoctor = doctors.find((d) => d._id === form.doctor);

  // Show which days this doctor is available
  const availableDayHint = selectedDoctor?.availableDays?.join(", ");

  const validate = () => {
    const e = {};
    if (!form.patient)         e.patient         = "Select a patient";
    if (!form.doctor)          e.doctor          = "Select a doctor";
    if (!form.appointmentDate) e.appointmentDate = "Select a date";
    if (!form.timeSlot)        e.timeSlot        = "Select a time slot";
    // Block past dates
    if (form.appointmentDate && new Date(form.appointmentDate) < new Date().setHours(0,0,0,0)) {
      e.appointmentDate = "Cannot book appointments in the past";
    }
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const FieldError = ({ name }) =>
    errors[name] ? <p className="text-rose-500 text-xs mt-1">{errors[name]}</p> : null;

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              New Appointment
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Schedule a patient consultation</p>
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
            </div>
          ) : (
            <>
              {/* Patient & Doctor */}
              <div className="card p-4 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Participants
                </p>
                <div>
                  <label className="label">Patient *</label>
                  <select value={form.patient}
                    onChange={(e) => set("patient", e.target.value)}
                    className={`input ${errors.patient ? "input-error" : ""}`}>
                    <option value="">Select patient...</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.firstName} {p.lastName} · {p.phone}
                      </option>
                    ))}
                  </select>
                  <FieldError name="patient" />
                </div>
                <div>
                  <label className="label">Doctor *</label>
                  <select value={form.doctor}
                    onChange={(e) => set("doctor", e.target.value)}
                    className={`input ${errors.doctor ? "input-error" : ""}`}>
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.firstName} {d.lastName} · {d.specialization}
                      </option>
                    ))}
                  </select>
                  <FieldError name="doctor" />
                  {availableDayHint && (
                    <p className="text-xs text-emerald-600 mt-1.5">
                      ✓ Available: {availableDayHint}
                    </p>
                  )}
                </div>
              </div>

              {/* Date, Time & Type */}
              <div className="card p-4 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Schedule
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date *</label>
                    <input type="date" min={today} value={form.appointmentDate}
                      onChange={(e) => set("appointmentDate", e.target.value)}
                      className={`input ${errors.appointmentDate ? "input-error" : ""}`} />
                    <FieldError name="appointmentDate" />
                  </div>
                  <div>
                    <label className="label">Time Slot *</label>
                    <select value={form.timeSlot}
                      onChange={(e) => set("timeSlot", e.target.value)}
                      className={`input ${errors.timeSlot ? "input-error" : ""}`}>
                      <option value="">Select time...</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <FieldError name="timeSlot" />
                  </div>
                </div>

                {/* ── Appointment type toggle ── */}
                <div>
                  <label className="label">Appointment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button"
                      onClick={() => set("type", "in-person")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4
                                  rounded-xl border text-sm font-semibold transition-all ${
                        form.type === "in-person"
                          ? "bg-navy-500 text-white border-navy-500 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}>
                      🏥 In-Person
                    </button>
                    <button type="button"
                      onClick={() => set("type", "online")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4
                                  rounded-xl border text-sm font-semibold transition-all ${
                        form.type === "online"
                          ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}>
                      🎥 Online
                    </button>
                  </div>

                  {/* Online info banner */}
                  {form.type === "online" && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl
                                    bg-sky-50 border border-sky-100 text-sky-700 text-xs">
                      <span className="mt-0.5 shrink-0">ℹ</span>
                      <span>
                        A Google Meet link will be automatically generated and shared with
                        both the doctor and patient when this appointment is saved.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason & Notes */}
              <div className="card p-4 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Details
                </p>
                <div>
                  <label className="label">Reason for Visit</label>
                  <input value={form.reason} onChange={(e) => set("reason", e.target.value)}
                    className="input" placeholder="e.g. Follow-up, Chest pain, Routine check..." />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                    className="input resize-none h-20"
                    placeholder="Any additional notes for this appointment..." />
                </div>
              </div>

              {/* Cancellation policy notice */}
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl
                              bg-amber-50 border border-amber-100 text-amber-700 text-xs">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>
                  Appointments can be cancelled up until <strong>1 hour before</strong> the
                  scheduled time. After that, cancellation is locked.
                </span>
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
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Saving...
                </span>
              : "Book Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
