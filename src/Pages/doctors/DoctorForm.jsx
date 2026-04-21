import { useState, useEffect } from "react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const EMPTY = {
  firstName: "", lastName: "", specialization: "", department: "",
  phone: "", email: "", licenseNumber: "", yearsOfExperience: "",
  availableDays: [], status: "active",
};

function FieldError({ name, errors }) {
  return errors[name] ? <p className="text-rose-500 text-xs mt-1">{errors[name]}</p> : null;
}

export default function DoctorForm({ doctor, onSave, onClose, loading }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(doctor ? { ...EMPTY, ...doctor, yearsOfExperience: doctor.yearsOfExperience ?? "" }
                   : EMPTY);
    setErrors({});
  }, [doctor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())     e.firstName     = "Required";
    if (!form.lastName.trim())      e.lastName      = "Required";
    if (!form.specialization.trim())e.specialization= "Required";
    if (!form.department.trim())    e.department    = "Required";
    if (!form.phone.trim())         e.phone         = "Required";
    if (!form.email.trim())         e.email         = "Required";
    if (!form.licenseNumber.trim()) e.licenseNumber = "Required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined });
  };

  const isEdit = !!doctor?._id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {isEdit ? "Edit Doctor" : "New Doctor"}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEdit ? `Updating Dr. ${doctor.firstName} ${doctor.lastName}` : "Register a new doctor"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-sand-50">

          {/* Personal */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Personal Details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange}
                  className={`input ${errors.firstName ? "input-error" : ""}`} placeholder="Sarah" />
                <FieldError errors={errors} name="firstName" />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange}
                  className={`input ${errors.lastName ? "input-error" : ""}`} placeholder="Johnson" />
                <FieldError errors={errors} name="lastName" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className={`input ${errors.phone ? "input-error" : ""}`} placeholder="+1 234 567 8900" />
                <FieldError errors={errors} name="phone" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className={`input ${errors.email ? "input-error" : ""}`} placeholder="doctor@hospital.com" />
                <FieldError errors={errors} name="email" />
              </div>
            </div>
          </div>

          {/* Professional */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Professional Details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Specialization *</label>
                <input name="specialization" value={form.specialization} onChange={handleChange}
                  className={`input ${errors.specialization ? "input-error" : ""}`}
                  placeholder="Cardiology" />
                <FieldError errors={errors} name="specialization" />
              </div>
              <div>
                <label className="label">Department *</label>
                <input name="department" value={form.department} onChange={handleChange}
                  className={`input ${errors.department ? "input-error" : ""}`}
                  placeholder="Cardiac Unit" />
                <FieldError errors={errors} name="department" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">License Number *</label>
                <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                  className={`input ${errors.licenseNumber ? "input-error" : ""}`}
                  placeholder="MD-123456" />
                <FieldError errors={errors} name="licenseNumber" />
              </div>
              <div>
                <label className="label">Years of Experience</label>
                <input type="number" name="yearsOfExperience" value={form.yearsOfExperience}
                  onChange={handleChange} className="input" placeholder="5" min="0" />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Available days */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Available Days
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = form.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                      selected
                        ? "bg-navy-500 text-white border-navy-500 shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:border-navy-300 hover:text-navy-600"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {form.availableDays.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">No days selected</p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              : isEdit ? "Save Changes" : "Register Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}
