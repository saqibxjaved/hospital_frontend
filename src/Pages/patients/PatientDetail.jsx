const statusStyle = {
  active:     "badge-success",
  admitted:   "badge-warning",
  discharged: "badge-neutral",
};

const bloodBg = {
  "A+":"bg-red-50 text-red-700",    "A-":"bg-red-50 text-red-600",
  "B+":"bg-orange-50 text-orange-700","B-":"bg-orange-50 text-orange-600",
  "AB+":"bg-violet-50 text-violet-700","AB-":"bg-violet-50 text-violet-600",
  "O+":"bg-sky-50 text-sky-700",    "O-":"bg-sky-50 text-sky-600",
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm text-slate-700 font-medium">
      {value || <span className="text-slate-300 font-normal">Not provided</span>}
    </p>
  </div>
);

export default function PatientDetail({ patient, onClose, onEdit, onDelete, canWrite, canDelete }) {
  if (!patient) return null;

  const age = patient.dateOfBirth
    ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-navy-500 flex items-center
                              justify-center text-white text-lg font-bold shadow-navy">
                {patient.firstName?.[0]}{patient.lastName?.[0]}
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={statusStyle[patient.status] ?? "badge-neutral"}>
                    {patient.status}
                  </span>
                  {patient.bloodGroup && (
                    <span className={`badge ${bloodBg[patient.bloodGroup] ?? "bg-slate-100 text-slate-600"}`}>
                      {patient.bloodGroup}
                    </span>
                  )}
                  {age && (
                    <span className="badge badge-neutral">{age} years old</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                         flex items-center justify-center text-slate-500 transition-colors shrink-0">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-sand-50">

          {/* Personal */}
          <div className="card">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Personal Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of Birth" value={patient.dateOfBirth
                ? new Date(patient.dateOfBirth).toLocaleDateString("en-US",
                    { year: "numeric", month: "long", day: "numeric" })
                : null} />
              <Field label="Gender" value={patient.gender
                ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                : null} />
              <Field label="Phone"  value={patient.phone} />
              <Field label="Email"  value={patient.email} />
            </div>
            {patient.address && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <Field label="Address" value={patient.address} />
              </div>
            )}
          </div>

          {/* Medical */}
          <div className="card">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Medical History
            </p>
            {patient.medicalHistory ? (
              <p className="text-sm text-slate-700 leading-relaxed">
                {patient.medicalHistory}
              </p>
            ) : (
              <div className="py-6 text-center">
                <p className="text-slate-300 text-sm">No medical history recorded</p>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Patient ID"   value={patient._id?.slice(-8).toUpperCase()} />
              <Field label="Status"       value={patient.status?.charAt(0).toUpperCase() + patient.status?.slice(1)} />
              <Field label="Registered"   value={patient.createdAt
                ? new Date(patient.createdAt).toLocaleDateString("en-US",
                    { year: "numeric", month: "short", day: "numeric" })
                : null} />
              <Field label="Last Updated" value={patient.updatedAt
                ? new Date(patient.updatedAt).toLocaleDateString("en-US",
                    { year: "numeric", month: "short", day: "numeric" })
                : null} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          {canDelete && (
            <button onClick={() => onDelete(patient)} className="btn-danger">
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="btn-outline">Close</button>
          {canWrite && (
            <button onClick={() => onEdit(patient)} className="btn-primary">
              Edit Patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
