import { useState, useEffect } from "react";
import api from "../../api/axiosClient";

const statusBadge = {
  scheduled:  "badge-navy",
  completed:  "badge-success",
  cancelled:  "badge-danger",
  "no-show":  "badge-warning",
};

// ── Helper: parse timeSlot string into a full Date ────────
function getAppointmentDateTime(appointment) {
  if (!appointment?.appointmentDate || !appointment?.timeSlot) return null;

  const dt = new Date(appointment.appointmentDate);
  const [time, meridiem] = appointment.timeSlot.split(" ");
  let [hours, minutes]   = time.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours  = 0;
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

// ── Helper: ms until appointment ─────────────────────────
function msUntil(dt) {
  return dt ? dt - new Date() : null;
}

// ── Countdown label ───────────────────────────────────────
function CancelBlockedBanner({ appointmentDT }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const ms = msUntil(appointmentDT);
      if (ms === null || ms <= 0) { setTimeLeft("now"); return; }
      const totalMins = Math.floor(ms / 60000);
      const mins      = totalMins % 60;
      setTimeLeft(`${mins}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [appointmentDT]);

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                    bg-amber-50 border border-amber-200 text-amber-700 text-sm">
      <span className="text-base">🔒</span>
      <span>
        Cancellation is locked — appointment is in{" "}
        <span className="font-semibold">{timeLeft}</span>.
        Appointments cannot be cancelled within 1 hour of the scheduled time.
      </span>
    </div>
  );
}

export default function AppointmentDetail({ appointmentId, onClose, onCancelled }) {
  const [appointment, setAppointment] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [cancelling,  setCancelling]  = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!appointmentId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/appointments/${appointmentId}`);
        setAppointment(data);
      } catch {
        setError("Failed to load appointment.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [appointmentId]);

  const handleCancel = async () => {
    setCancelling(true);
    setError("");
    try {
      await api.patch(`/appointments/${appointment._id}/cancel`);
      setAppointment((a) => ({ ...a, status: "cancelled" }));
      onCancelled?.();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cancel appointment.";
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  // Compute cancel eligibility
  const appointmentDT     = appointment ? getAppointmentDateTime(appointment) : null;
  const msLeft            = msUntil(appointmentDT);
  const withinOneHour     = msLeft !== null && msLeft <= 60 * 60 * 1000;
  const isPast            = msLeft !== null && msLeft <= 0;
  const canShowCancelBtn  =
    appointment?.status === "scheduled" && !isPast;

  if (!appointmentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {appointment && (
                <span className={statusBadge[appointment.status] ?? "badge-neutral"}>
                  {appointment.status}
                </span>
              )}
              {appointment?.type === "online" && (
                <span className="badge bg-sky-50 text-sky-700 border border-sky-100">
                  Online
                </span>
              )}
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Appointment Details
            </h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-sand-50">
          {loading ? (
            <div className="py-14 text-center">
              <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                              rounded-full animate-spin mx-auto" />
            </div>
          ) : !appointment ? (
            <p className="text-rose-500 text-sm">{error || "Appointment not found."}</p>
          ) : (
            <>
              {/* Patient */}
              <div className="card space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Patient
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-500 text-white flex items-center
                                  justify-center text-sm font-bold shrink-0">
                    {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{appointment.patient?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Doctor */}
              <div className="card space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Doctor
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center
                                  justify-center text-sm font-bold shrink-0">
                    {appointment.doctor?.firstName?.[0]}{appointment.doctor?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{appointment.doctor?.specialization}</p>
                  </div>
                </div>
              </div>

              {/* Date / Time / Type */}
              <div className="card grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Date
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Time
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{appointment.timeSlot}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Type
                  </p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {appointment.type}
                  </p>
                </div>
              </div>

              {/* ── Google Meet link ── */}
              {appointment.type === "online" && appointment.meetLink && (
                <div className="card border-sky-200 bg-sky-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-sky-200
                                    flex items-center justify-center text-base shrink-0">
                      🎥
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sky-800">Google Meet</p>
                      <p className="text-xs text-sky-600">
                        Online consultation link
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                                  bg-white border border-sky-200">
                    <span className="text-xs font-mono text-slate-500 truncate flex-1">
                      {appointment.meetLink}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(appointment.meetLink)}
                      className="text-xs text-sky-600 hover:text-sky-800 font-semibold
                                 shrink-0 transition-colors">
                      Copy
                    </button>
                  </div>

                  {appointment.status === "scheduled" && (
                    <a
                      href={appointment.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn w-full justify-center bg-sky-500 text-white
                                 hover:bg-sky-600 transition-colors">
                      🎥 Join Meeting
                    </a>
                  )}
                </div>
              )}

              {/* Reason */}
              {appointment.reason && (
                <div className="card">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Reason
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{appointment.reason}</p>
                </div>
              )}

              {/* Notes */}
              {appointment.notes && (
                <div className="card">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Notes
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{appointment.notes}</p>
                </div>
              )}

              {/* 1-hour lock banner */}
              {canShowCancelBtn && withinOneHour && (
                <CancelBlockedBanner appointmentDT={appointmentDT} />
              )}

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200
                                text-rose-700 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Close</button>

          {canShowCancelBtn && !withinOneHour && (
            <button onClick={handleCancel} disabled={cancelling}
              className="btn-danger flex-1 justify-center">
              {cancelling
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                    Cancelling...
                  </span>
                : "Cancel Appointment"}
            </button>
          )}

          {canShowCancelBtn && withinOneHour && (
            <button disabled
              className="btn flex-1 justify-center bg-slate-100 text-slate-400 cursor-not-allowed">
              🔒 Cancel Locked
            </button>
          )}

          {appointment?.status === "cancelled" && (
            <div className="flex-1 flex items-center justify-center text-rose-500
                            font-semibold text-sm gap-1.5">
              <span>✕</span> Cancelled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
