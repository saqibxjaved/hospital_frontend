import { useState, useEffect } from "react";

const EMPTY = {
  name: "", type: "general", totalBeds: 10, floor: "", description: "",
};

const WARD_TYPES = [
  { value: "general",           label: "General" },
  { value: "icu",               label: "ICU" },
  { value: "private",           label: "Private" },
  { value: "emergency",         label: "Emergency" },
  { value: "operating-theatre", label: "Operating Theatre" },
];

export default function WardForm({ ward, onSave, onClose, loading }) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const isEdit = !!ward?._id;

  useEffect(() => {
    setForm(ward ? { ...EMPTY, ...ward } : EMPTY);
    setErrors({});
  }, [ward]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Ward name is required";
    if (!form.type)        e.type = "Select a ward type";
    if (!form.totalBeds || form.totalBeds < 1) e.totalBeds = "At least 1 bed required";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, totalBeds: Number(form.totalBeds) });
  };

  const FieldError = ({ name }) =>
    errors[name] ? <p className="text-rose-500 text-xs mt-1">{errors[name]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {isEdit ? "Edit Ward" : "New Ward"}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEdit ? `Editing ${ward.name}` : "Set up a new hospital ward"}
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
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ward Details
            </p>
            <div>
              <label className="label">Ward Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className={`input ${errors.name ? "input-error" : ""}`}
                placeholder="e.g. Ward A, North Wing ICU..." />
              <FieldError name="name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ward Type *</label>
                <select value={form.type} onChange={(e) => set("type", e.target.value)}
                  className={`input ${errors.type ? "input-error" : ""}`}>
                  {WARD_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <FieldError name="type" />
              </div>
              <div>
                <label className="label">Floor / Location</label>
                <input value={form.floor} onChange={(e) => set("floor", e.target.value)}
                  className="input" placeholder="e.g. 2nd Floor" />
              </div>
            </div>
            <div>
              <label className="label">Total Beds *</label>
              <input type="number" min="1" max="100" value={form.totalBeds}
                onChange={(e) => set("totalBeds", e.target.value)}
                className={`input ${errors.totalBeds ? "input-error" : ""}`} />
              <FieldError name="totalBeds" />
              {isEdit && (
                <p className="text-xs text-amber-600 mt-1.5">
                  ⚠ Changing bed count on an existing ward may affect occupied beds.
                </p>
              )}
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                className="input resize-none h-20"
                placeholder="Optional notes about this ward..." />
            </div>
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
              : isEdit ? "Save Changes" : "Create Ward"}
          </button>
        </div>
      </div>
    </div>
  );
}
