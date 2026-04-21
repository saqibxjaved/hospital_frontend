import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";

const statCards = [
  { key: "totalPatients",  label: "Total Patients",       icon: "♡", bg: "bg-navy-50",    icon_color: "text-navy-600",    value_color: "text-navy-700"    },
  { key: "totalDoctors",   label: "Active Doctors",        icon: "✚", bg: "bg-sky-50",     icon_color: "text-sky-600",     value_color: "text-sky-700"     },
  { key: "todayAppts",     label: "Today's Appointments",  icon: "◻", bg: "bg-violet-50",  icon_color: "text-violet-600",  value_color: "text-violet-700"  },
  { key: "availableBeds",  label: "Available Beds",        icon: "⊞", bg: "bg-emerald-50", icon_color: "text-emerald-600", value_color: "text-emerald-700" },
  { key: "occupiedBeds",   label: "Occupied Beds",         icon: "▪", bg: "bg-amber-50",   icon_color: "text-amber-600",   value_color: "text-amber-700"   },
  { key: "pendingBills",   label: "Pending Bills",         icon: "◈", bg: "bg-rose-50",    icon_color: "text-rose-600",    value_color: "text-rose-700"    },
];

const apptStatusStyle = {
  scheduled: "badge-info",
  completed: "badge-success",
  cancelled: "badge-danger",
  "no-show": "badge-warning",
};

const apptTypeStyle = {
  consultation:      "text-navy-600 bg-navy-50",
  "follow-up":       "text-sky-600 bg-sky-50",
  emergency:         "text-rose-600 bg-rose-50",
  "routine-checkup": "text-emerald-600 bg-emerald-50",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [stats,        setStats]        = useState({});
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [apptLoading,  setApptLoading]  = useState(true);
  const [error,        setError]        = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [patients, doctors, allAppts, wards, billing] = await Promise.allSettled([
          api.get("/patients"),
          api.get("/doctors"),
          api.get("/appointments"),
          api.get("/wards"),
          api.get("/billing"),
        ]);

        const today = new Date().toDateString();

        const allApptData   = allAppts.value?.data ?? [];
        const todayAppts    = allApptData.filter(
          (a) => new Date(a.appointmentDate).toDateString() === today
        );
        const wardData      = wards.value?.data ?? [];
        const billingData   = billing.value?.data ?? [];

        setStats({
          totalPatients: patients.value?.data?.length ?? 0,
          totalDoctors:  doctors.value?.data?.length  ?? 0,
          todayAppts:    todayAppts.length,
          availableBeds: wardData.reduce((s, w) => s + (w.availableBeds ?? 0), 0),
          occupiedBeds:  wardData.reduce((s, w) => s + (w.occupiedBeds  ?? 0), 0),
          pendingBills:  billingData.filter(
            (b) => b.paymentStatus === "unpaid" || b.paymentStatus === "partial"
          ).length,
        });

        setAppointments(
          todayAppts
            .filter((a) => a.status !== "cancelled")
            .sort((a, b) => a.timeSlot?.localeCompare(b.timeSlot))
        );
      } catch {
        setError("Some data failed to load. Please refresh.");
      } finally {
        setLoading(false);
        setApptLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            {getGreeting()}, {user?.firstName} 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Here's what's happening at the hospital today.
          </p>
        </div>
        <button onClick={() => navigate("/appointments")} className="btn-primary">
          + New Appointment
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200
                        text-amber-700 text-sm flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ key, label, icon, bg, icon_color, value_color }) => (
          <div key={key} className="stat-card">
            <div className={`stat-icon ${bg}`}>
              <span className={`text-xl ${icon_color}`}>{icon}</span>
            </div>
            <div>
              {loading ? (
                <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse mb-1" />
              ) : (
                <p className={`text-2xl font-display font-semibold ${value_color}`}>
                  {stats[key] ?? 0}
                </p>
              )}
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Today's Appointments</h3>
            <p className="section-sub">
              {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} scheduled today
            </p>
          </div>
          <button onClick={() => navigate("/appointments")} className="btn-outline text-xs">
            View all
          </button>
        </div>

        <div className="table-wrapper">
          {apptLoading ? (
            <div className="p-10 text-center">
              <div className="w-6 h-6 border-2 border-navy-300 border-t-navy-600
                              rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm mt-3">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100
                              flex items-center justify-center text-2xl mx-auto mb-3">◻</div>
              <p className="text-slate-600 font-medium">No appointments today</p>
              <p className="text-slate-400 text-sm mt-1">
                Schedule one to get started
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-navy-100 text-navy-700
                                        flex items-center justify-center text-xs font-bold shrink-0">
                          {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{appt.patient?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-slate-700">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{appt.doctor?.specialization}</p>
                    </td>
                    <td>
                      <span className="font-mono text-sm font-semibold text-navy-600">
                        {appt.timeSlot}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                                        ${apptTypeStyle[appt.type] ?? "bg-slate-100 text-slate-600"}`}>
                        {appt.type}
                      </span>
                    </td>
                    <td>
                      <span className={apptStatusStyle[appt.status] ?? "badge-neutral"}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
