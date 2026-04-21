import { useState, useEffect } from "react";

export default function RecordInfoForm({ record, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    bloodGroup: "", allergies: [], chronicConditions: [],
  });
  const [allergyInput,    setAllergyInput]    = useState("");
  const [conditionInput,  setConditionInput]  = useState("");

  useEffect(() => {
    if (record) {
      setForm({
        bloodGroup:        record.bloodGroup        || "",
        allergies:         record.allergies         || [],
        chronicConditions: record.chronicConditions || [],
      });
    }
  }, [record]);

  const addTag = (field, input, setInput) => {
    const val = input.trim();
    if (!val || form[field].includes(val)) return;
    setForm((f) => ({ ...f, [field]: [...f[field], val] }));
    setInput("");
  };

  const removeTag = (field, idx) =>
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));

  const TagInput = ({ field, placeholder, inputVal, setInputVal }) => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(field, inputVal, setInputVal); } }}
          className="input flex-1" placeholder={placeholder} />
        <button type="button"
          onClick={() => addTag(field, inputVal, setInputVal)}
          className="btn-outline px-3">
          + Add
        </button>
      </div>
      {form[field].length > 0 && (
        <div className="flex flex-wrap gap-2">
          {form[field].map((item, i) => (
            <span key={i}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-50
                         text-navy-700 border border-navy-100 text-xs font-medium">
              {item}
              <button type="button" onClick={() => removeTag(field, i)}
                className="text-navy-400 hover:text-rose-500 transition-colors leading-none">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Edit Medical Info</h2>
            <p className="text-sm text-slate-400 mt-0.5">Update core medical details</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-sand-50">

          <div className="card p-4">
            <label className="label">Blood Group</label>
            <select value={form.bloodGroup}
              onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
              className="input">
              <option value="">Unknown</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allergies</p>
            <TagInput
              field="allergies"
              placeholder="e.g. Penicillin, Peanuts..."
              inputVal={allergyInput}
              setInputVal={setAllergyInput}
            />
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chronic Conditions
            </p>
            <TagInput
              field="chronicConditions"
              placeholder="e.g. Diabetes, Hypertension..."
              inputVal={conditionInput}
              setInputVal={setConditionInput}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading}
            className="btn-primary flex-1 justify-center">
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
