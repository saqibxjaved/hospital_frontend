import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import api from "../../api/axiosClient";
import DoctorForm    from "./DoctorForm";
import ConfirmDialog from "../../Components/ui/ConfirmDialog";
import Toast         from "../../Components/ui/Toast";

const statusStyle = {
  active:     "badge-success",
  inactive:   "badge-neutral",
  "on-leave": "badge-warning",
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-medium text-slate-700">
      {value || <span className="text-slate-300 font-normal">Not provided</span>}
    </p>
  </div>
);

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function DoctorPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const canWrite  = user?.role === "admin";
  const canDelete = user?.role === "admin";

  const [doctor,      setDoctor]      = useState(null);
  const [appointments,setAppointments]= useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [toast,       setToast]       = useState(null);

  const fetchDoctor = useCallback(async () => {
    try {
      const [docRes, apptRes] = await Promise.allSettled([
        api.get(`/doctors/${id}`),
        api.get(`/appointments/doctor/${id}`),
      ]);
      if (docRes.status === "fulfilled")  setDoctor(docRes.value.data);
      if (apptRes.status === "fulfilled") setAppointments(apptRes.value.data);
    } catch {
      navigate("/doctors");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchDoctor(); }, [fetchDoctor]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/doctors/${id}`, formData);
      setDoctor(data);
      setShowForm(false);
      setToast({ message: "Doctor updated successfully", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/doctors/${id}`);
      navigate("/doctors");
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Delete failed", type: "error" });
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-200 border-t-navy-600
                          rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  const upcomingAppts = appointments
    .filter((a) => new Date(a.appointmentDate) >= new Date() && a.status === "scheduled")
    .slice(0, 5);

  const apptStatusStyle = {
    scheduled:  "badge-info",
    completed:  "badge-success",
    cancelled:  "badge-danger",
    "no-show":  "badge-warning",
  };

  return (
    <div className="space-y-6">

      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/doctors")}
          className="btn-ghost gap-2 text-sm pl-2">
          ← Back to Doctors
        </button>
        <div className="flex gap-2">
          {canDelete && (
            <button onClick={() => setShowConfirm(true)} className="btn-danger">
              Delete Doctor
            </button>
          )}
          {canWrite && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Edit Doctor
            </button>
          )}
        </div>
      </div>

      {/* Hero card */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-navy-500 flex items-center justify-center
                        text-white text-2xl font-bold shadow-navy shrink-0">
          {doctor.firstName?.[0]}{doctor.lastName?.[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">
                Dr. {doctor.firstName} {doctor.lastName}
              </h1>
              <p className="text-navy-600 font-semibold text-sm mt-0.5">
                {doctor.specialization}
              </p>
              <p className="text-slate-400 text-sm">{doctor.department}</p>
            </div>
            <span className={statusStyle[doctor.status] ?? "badge-neutral"}>
              {doctor.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="badge badge-neutral font-mono text-xs">
              🪪 {doctor.licenseNumber}
            </span>
            {doctor.yearsOfExperience != null && (
              <span className="badge badge-navy">
                {doctor.yearsOfExperience} yrs experience
              </span>
            )}
            <span className="badge badge-neutral">
              📞 {doctor.phone}
            </span>
            <span className="badge badge-neutral">
              ✉ {doctor.email}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col — details */}
        <div className="lg:col-span-1 space-y-4">

          {/* Availability */}
          <div className="card">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Available Days
            </p>
            {doctor.availableDays?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const available = doctor.availableDays.includes(day);
                  return (
                    <span key={day}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        available
                          ? "bg-navy-50 text-navy-700 border-navy-200"
                          : "bg-slate-50 text-slate-300 border-slate-100"
                      }`}>
                      {day.slice(0, 3)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-300">No availability set</p>
            )}
          </div>

          {/* Stats */}
          <div className="card space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Appointment Stats
            </p>
            {[
              { label: "Total",     value: appointments.length,                                          color: "text-slate-700" },
              { label: "Upcoming",  value: upcomingAppts.length,                                         color: "text-navy-600"  },
              { label: "Completed", value: appointments.filter((a) => a.status === "completed").length,  color: "text-emerald-600"},
              { label: "Cancelled", value: appointments.filter((a) => a.status === "cancelled").length,  color: "text-rose-600"  },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="card space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contact & Info
            </p>
            <Field label="Email"         value={doctor.email} />
            <Field label="Phone"         value={doctor.phone} />
            <Field label="License No."   value={doctor.licenseNumber} />
            <Field label="Joined"        value={doctor.createdAt
              ? new Date(doctor.createdAt).toLocaleDateString("en-US",
                  { year: "numeric", month: "long", day: "numeric" })
              : null} />
          </div>
        </div>

        {/* Right col — upcoming appointments */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-800">
                  Upcoming Appointments
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {upcomingAppts.length} scheduled appointment{upcomingAppts.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {upcomingAppts.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center
                                justify-center text-xl mx-auto mb-3">◻</div>
                <p className="text-slate-500 font-medium text-sm">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.map((appt) => (
                  <div key={appt._id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-sand-50
                               border border-sand-200 hover:border-navy-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-700
                                    flex items-center justify-center text-xs font-bold shrink-0">
                      {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">{appt.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-semibold text-navy-600">
                        {appt.timeSlot}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(appt.appointmentDate).toLocaleDateString("en-US",
                          { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className={`${apptStatusStyle[appt.status] ?? "badge-neutral"} shrink-0`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <DoctorForm
          doctor={doctor}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          loading={saving}
        />
      )}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Doctor"
          message={`Are you sure you want to permanently remove Dr. ${doctor.firstName} ${doctor.lastName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
