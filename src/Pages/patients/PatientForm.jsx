import { useState, useEffect } from "react";

const EMPTY = {
  firstName: "", lastName: "", dateOfBirth: "", gender: "",
  phone: "", email: "", address: "", bloodGroup: "", medicalHistory: "", status: "active",
};

function FieldError({ name, errors }) {
  return errors[name] ? <p className="text-rose-500 text-xs mt-1">{errors[name]}</p> : null;
}

export default function PatientForm({ patient, onSave, onClose, loading }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (patient) {
      setForm({
        ...EMPTY, ...patient,
        dateOfBirth: patient.dateOfBirth
          ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName   = "First name is required";
    if (!form.lastName.trim())  e.lastName    = "Last name is required";
    if (!form.dateOfBirth)      e.dateOfBirth = "Date of birth is required";
    if (!form.gender)           e.gender      = "Please select a gender";
    if (!form.phone.trim())     e.phone       = "Phone number is required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const isEdit = !!patient?._id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {isEdit ? "Edit Patient" : "New Patient"}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEdit
                ? `Updating ${patient.firstName} ${patient.lastName}`
                : "Fill in the details to register a new patient"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-sand-50">

          {/* Name */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Personal Details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange}
                  className={`input ${errors.firstName ? "input-error" : ""}`}
                  placeholder="John" />
                <FieldError errors={errors} name="firstName" />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange}
                  className={`input ${errors.lastName ? "input-error" : ""}`}
                  placeholder="Doe" />
                <FieldError errors={errors} name="lastName" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth}
                  onChange={handleChange}
                  className={`input ${errors.dateOfBirth ? "input-error" : ""}`} />
                <FieldError errors={errors} name="dateOfBirth" />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className={`input ${errors.gender ? "input-error" : ""}`}>
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <FieldError errors={errors} name="gender" />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contact Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className={`input ${errors.phone ? "input-error" : ""}`}
                  placeholder="+1 234 567 8900" />
                <FieldError errors={errors} name="phone" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} className="input"
                  placeholder="john@email.com" />
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="input" placeholder="123 Main St, City" />
            </div>
          </div>

          {/* Medical */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Medical Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Blood Group</label>
                <select name="bloodGroup" value={form.bloodGroup}
                  onChange={handleChange} className="input">
                  <option value="">Unknown</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={form.status}
                  onChange={handleChange} className="input">
                  <option value="active">Active</option>
                  <option value="admitted">Admitted</option>
                  <option value="discharged">Discharged</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Medical History</label>
              <textarea name="medicalHistory" value={form.medicalHistory}
                onChange={handleChange} className="input resize-none h-24"
                placeholder="Pre-existing conditions, past surgeries, known allergies..." />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex-1 justify-center">
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Saving...
                </span>
              : isEdit ? "Save Changes" : "Register Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
