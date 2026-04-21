import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../Context/AuthContext";
import api from "../api/axiosClient";
import AppointmentForm   from "./appointments/AppointmentForm";
import AppointmentDetail from "./appointments/AppointmentDetail";
import ConfirmDialog     from "../Components/ui/ConfirmDialog";
import Toast             from "../Components/ui/Toast";

// ── Helpers ────────────────────────────────────────────────────────────────

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const statusStyle = {
  scheduled:  "bg-navy-500",
  completed:  "bg-emerald-500",
  cancelled:  "bg-rose-400",
  "no-show":  "bg-amber-400",
};

const statusBadge = {
  scheduled:  "badge-info",
  completed:  "badge-success",
  cancelled:  "badge-danger",
  "no-show":  "badge-warning",
};

const typeColor = {
  consultation:      "border-l-navy-400",
  "follow-up":       "border-l-sky-400",
  emergency:         "border-l-rose-400",
  "routine-checkup": "border-l-emerald-400",
};

// Build a 6-week grid for the given month
function buildCalendarGrid(year, month) {
  const first   = new Date(year, month, 1);
  const last    = new Date(year, month + 1, 0);
  const startDay = first.getDay(); // 0 = Sun
  const days = [];

  // Prev month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, currentMonth: false });
  }
  // Current month
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true });
  }
  // Next month padding
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - last.getDate() - startDay + 1);
    days.push({ date: d, currentMonth: false });
  }
  return days;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Appointments() {
  const { user } = useAuth();

  const canWrite  = ["admin", "doctor", "receptionist"].includes(user?.role);
  const canDelete = ["admin", "receptionist"].includes(user?.role);

  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [error,        setError]        = useState("");

  const [showForm,    setShowForm]    = useState(false);
  const [showDetail,  setShowDetail]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [defaultDate, setDefaultDate] = useState("");

  // Calendar state
  const today = new Date();
  const [viewDate,      setViewDate]      = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate,  setSelectedDate]  = useState(today);

  // Date range filter (separate from calendar navigation)
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo,   setRangeTo]   = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/appointments");
      setAppointments(data);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Build calendar grid
  const calendarDays = useMemo(() =>
    buildCalendarGrid(viewDate.getFullYear(), viewDate.getMonth()),
  [viewDate]);

  // Map appointments to dates for the calendar dots
  const apptsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      const key = new Date(a.appointmentDate).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  // Appointments for the selected day (or date range)
  const filteredAppts = useMemo(() => {
    if (rangeFrom || rangeTo) {
      const from = rangeFrom ? new Date(rangeFrom) : null;
      const to   = rangeTo   ? new Date(rangeTo)   : null;
      return appointments.filter((a) => {
        const d = new Date(a.appointmentDate);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
      }).sort((a, b) =>
        new Date(a.appointmentDate) - new Date(b.appointmentDate) ||
        a.timeSlot?.localeCompare(b.timeSlot)
      );
    }
    // Default: selected day
    return appointments
      .filter((a) => isSameDay(new Date(a.appointmentDate), selectedDate))
      .sort((a, b) => a.timeSlot?.localeCompare(b.timeSlot));
  }, [appointments, selectedDate, rangeFrom, rangeTo]);

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday   = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setRangeFrom("");
    setRangeTo("");
    // Navigate to that month if needed
    if (date.getMonth() !== viewDate.getMonth()) {
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handleNewClick = (date) => {
    setSelected(null);
    setDefaultDate(date ? date.toISOString().split("T")[0] : "");
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selected?._id) {
        await api.put(`/appointments/${selected._id}`, formData);
        setToast({ message: "Appointment updated", type: "success" });
      } else {
        await api.post("/appointments", formData);
        setToast({ message: "Appointment booked successfully", type: "success" });
      }
      setShowForm(false);
      setSelected(null);
      fetchAppointments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/appointments/${selected._id}`);
      setToast({ message: "Appointment cancelled", type: "success" });
      setShowConfirm(false);
      setShowDetail(false);
      setSelected(null);
      fetchAppointments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to cancel", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const clearRange = () => { setRangeFrom(""); setRangeTo(""); };

  // Stats for selected day / range
  const stats = useMemo(() => ({
    scheduled: filteredAppts.filter((a) => a.status === "scheduled").length,
    completed: filteredAppts.filter((a) => a.status === "completed").length,
    cancelled: filteredAppts.filter((a) => a.status === "cancelled").length,
  }), [filteredAppts]);

  const isRangeMode = rangeFrom || rangeTo;
  const panelTitle  = isRangeMode
    ? `${rangeFrom || "…"} → ${rangeTo || "…"}`
    : selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slate-900">Appointments</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canWrite && (
          <button onClick={() => handleNewClick(selectedDate)} className="btn-primary">
            + Book Appointment
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Date range filter bar */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Date Range Filter
        </span>
        <div className="flex items-center gap-2">
          <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)}
            className="input w-40 text-xs py-2" />
          <span className="text-slate-300 text-sm">→</span>
          <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)}
            min={rangeFrom || undefined}
            className="input w-40 text-xs py-2" />
        </div>
        {isRangeMode && (
          <button onClick={clearRange}
            className="text-xs text-slate-400 hover:text-rose-500 transition-colors font-medium">
            ✕ Clear
          </button>
        )}
        {isRangeMode && (
          <span className="text-xs text-navy-600 font-semibold ml-auto">
            {filteredAppts.length} appointment{filteredAppts.length !== 1 ? "s" : ""} in range
          </span>
        )}
      </div>

      {/* Main layout: Calendar + Day panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Calendar ─────────────────────────────── */}
        <div className="xl:col-span-2 card">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200
                           flex items-center justify-center text-slate-600 transition-colors text-sm">
                ‹
              </button>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              <button onClick={nextMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200
                           flex items-center justify-center text-slate-600 transition-colors text-sm">
                ›
              </button>
            </div>
            <button onClick={goToday} className="btn-outline text-xs py-1.5 px-3">
              Today
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-600
                              rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, currentMonth }, i) => {
                const key        = date.toDateString();
                const dayAppts   = apptsByDate[key] || [];
                const isToday    = isSameDay(date, today);
                const isSelected = isSameDay(date, selectedDate) && !isRangeMode;
                const isWeekend  = date.getDay() === 0 || date.getDay() === 6;

                // Date range highlight
                const from   = rangeFrom ? new Date(rangeFrom) : null;
                const to     = rangeTo   ? new Date(rangeTo)   : null;
                const inRange = from && to && date >= from && date <= to;
                const isRangeStart = from && isSameDay(date, from);
                const isRangeEnd   = to   && isSameDay(date, to);

                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(date)}
                    className={`
                      relative flex flex-col items-center p-1.5 rounded-xl min-h-[56px]
                      transition-all duration-100 text-left
                      ${!currentMonth ? "opacity-30" : ""}
                      ${isSelected
                        ? "bg-navy-500 text-white shadow-navy"
                        : isRangeStart || isRangeEnd
                          ? "bg-navy-400 text-white"
                          : inRange
                            ? "bg-navy-50 text-navy-800"
                            : isToday
                              ? "bg-sand-200 text-slate-900 font-semibold"
                              : isWeekend
                                ? "text-slate-400 hover:bg-sand-100"
                                : "text-slate-700 hover:bg-sand-100"}
                    `}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center
                                      justify-center rounded-full mb-0.5
                                      ${isToday && !isSelected ? "ring-2 ring-navy-400" : ""}`}>
                      {date.getDate()}
                    </span>

                    {/* Appointment dots */}
                    {dayAppts.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center max-w-full">
                        {dayAppts.slice(0, 3).map((a, idx) => (
                          <span key={idx}
                            className={`w-1.5 h-1.5 rounded-full shrink-0
                                        ${isSelected ? "bg-white/70" : statusStyle[a.status] ?? "bg-slate-400"}`} />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className={`text-[9px] font-bold leading-none mt-0.5
                                           ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                            +{dayAppts.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {[
              { label: "Scheduled", color: "bg-navy-500" },
              { label: "Completed", color: "bg-emerald-500" },
              { label: "Cancelled", color: "bg-rose-400" },
              { label: "No Show",   color: "bg-amber-400" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Day / Range panel ─────────────────────── */}
        <div className="xl:col-span-1 flex flex-col gap-4">

          {/* Panel header */}
          <div className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {isRangeMode ? "Date Range" : "Selected Day"}
                </p>
                <h4 className="font-display text-base font-semibold text-slate-800 leading-snug">
                  {panelTitle}
                </h4>
              </div>
              {canWrite && !isRangeMode && (
                <button
                  onClick={() => handleNewClick(selectedDate)}
                  className="w-8 h-8 rounded-xl bg-navy-50 text-navy-600 hover:bg-navy-100
                             flex items-center justify-center text-sm font-bold transition-colors">
                  +
                </button>
              )}
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Scheduled", value: stats.scheduled, color: "text-navy-600" },
                { label: "Completed", value: stats.completed, color: "text-emerald-600" },
                { label: "Cancelled", value: stats.cancelled, color: "text-rose-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-2 rounded-xl bg-sand-50">
                  <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Appointments list */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-0.5">
            {filteredAppts.length === 0 ? (
              <div className="card py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100
                                flex items-center justify-center text-xl mx-auto mb-3">◻</div>
                <p className="text-slate-500 font-medium text-sm">
                  {isRangeMode ? "No appointments in this range" : "No appointments this day"}
                </p>
                {canWrite && !isRangeMode && (
                  <button onClick={() => handleNewClick(selectedDate)}
                    className="btn-primary mt-3 mx-auto text-xs py-1.5 px-3">
                    + Book one
                  </button>
                )}
              </div>
            ) : (
              filteredAppts.map((a) => (
                <button
                  key={a._id}
                  onClick={() => { setSelected(a); setShowDetail(true); }}
                  className={`w-full text-left card p-4 border-l-4 hover:shadow-card-md
                              transition-all duration-150 group ${typeColor[a.type] ?? "border-l-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-navy-600">
                          {a.timeSlot}
                        </span>
                        <span className={statusBadge[a.status] ?? "badge-neutral"}>
                          {a.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {a.patient?.firstName} {a.patient?.lastName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dr. {a.doctor?.firstName} {a.doctor?.lastName}
                      </p>
                      {a.reason && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{a.reason}</p>
                      )}
                    </div>
                    <span className="text-slate-200 group-hover:text-navy-300 transition-colors text-sm shrink-0">
                      ›
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Panels & Dialogs */}
      {showForm && (
        <AppointmentForm
          appointment={selected}
          defaultDate={defaultDate}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelected(null); }}
          loading={saving}
        />
      )}
      {showDetail && selected && (
        <AppointmentDetail
          appointment={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          onEdit={(a) => { setShowDetail(false); setSelected(a); setShowForm(true); }}
          onDelete={(a) => { setSelected(a); setShowConfirm(true); }}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}
      {showConfirm && selected && (
        <ConfirmDialog
          title="Cancel Appointment"
          message={`Cancel the appointment for ${selected.patient?.firstName} ${selected.patient?.lastName} on ${new Date(selected.appointmentDate).toLocaleDateString()}?`}
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
