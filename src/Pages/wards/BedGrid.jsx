import { useState } from "react";
import AdmitForm     from "./AdmitForm";
import ConfirmDialog from "../../Components/ui/ConfirmDialog";

const BED_STATUS = {
  available:   { label: "Available",    dot: "bg-emerald-400", card: "bg-emerald-50 border-emerald-200 hover:border-emerald-300", text: "text-emerald-700" },
  occupied:    { label: "Occupied",     dot: "bg-rose-400",    card: "bg-rose-50 border-rose-200 hover:border-rose-300",         text: "text-rose-700"    },
  maintenance: { label: "Maintenance",  dot: "bg-amber-400",   card: "bg-amber-50 border-amber-200 hover:border-amber-300",      text: "text-amber-700"   },
};

export default function BedGrid({ ward, canWrite, onAdmit, onDischarge, onMaintenance, saving }) {
  const [showAdmit,    setShowAdmit]    = useState(false);
  const [showDischarge,setShowDischarge]= useState(false);
  const [showMaint,    setShowMaint]    = useState(false);
  const [activeBed,    setActiveBed]    = useState(null);
  const [actionLoading,setActionLoading]= useState(false);

  const handleAdmit = async (patientId) => {
    setActionLoading(true);
    await onAdmit(ward._id, activeBed.bedNumber, patientId);
    setActionLoading(false);
    setShowAdmit(false);
    setActiveBed(null);
  };

  const handleDischarge = async () => {
    setActionLoading(true);
    await onDischarge(ward._id, activeBed.bedNumber);
    setActionLoading(false);
    setShowDischarge(false);
    setActiveBed(null);
  };

  const handleMaintenance = async () => {
    setActionLoading(true);
    await onMaintenance(ward._id, activeBed.bedNumber);
    setActionLoading(false);
    setShowMaint(false);
    setActiveBed(null);
  };

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-4">
        {ward.beds?.map((bed) => {
          const s = BED_STATUS[bed.status] ?? BED_STATUS.available;
          return (
            <div key={bed.bedNumber}
              className={`relative rounded-xl border p-3 transition-all duration-150
                          ${s.card} ${canWrite ? "cursor-pointer" : ""}`}>

              {/* Status dot */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-600">
                  {bed.bedNumber}
                </span>
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              </div>

              {/* Patient name if occupied */}
              {bed.status === "occupied" && bed.patient && (
                <p className="text-xs text-rose-700 font-semibold leading-tight truncate mb-2">
                  {bed.patient.firstName} {bed.patient.lastName}
                </p>
              )}

              {bed.status === "maintenance" && (
                <p className="text-xs text-amber-600 font-medium mb-2">Maintenance</p>
              )}

              {bed.status === "available" && (
                <p className={`text-xs font-medium mb-2 ${s.text}`}>Available</p>
              )}

              {/* Actions */}
              {canWrite && (
                <div className="flex flex-col gap-1">
                  {bed.status === "available" && (
                    <button
                      onClick={() => { setActiveBed(bed); setShowAdmit(true); }}
                      className="w-full text-xs py-1 px-2 rounded-lg bg-emerald-100
                                 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors">
                      Admit
                    </button>
                  )}
                  {bed.status === "occupied" && (
                    <button
                      onClick={() => { setActiveBed(bed); setShowDischarge(true); }}
                      className="w-full text-xs py-1 px-2 rounded-lg bg-rose-100
                                 text-rose-700 hover:bg-rose-200 font-medium transition-colors">
                      Discharge
                    </button>
                  )}
                  {bed.status !== "occupied" && (
                    <button
                      onClick={() => { setActiveBed(bed); setShowMaint(true); }}
                      className={`w-full text-xs py-1 px-2 rounded-lg font-medium transition-colors
                                  ${bed.status === "maintenance"
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}>
                      {bed.status === "maintenance" ? "Restore" : "Maint."}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {Object.entries(BED_STATUS).map(([key, { label, dot }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Admit modal */}
      {showAdmit && activeBed && (
        <AdmitForm
          bed={activeBed}
          wardName={ward.name}
          onSave={handleAdmit}
          onClose={() => { setShowAdmit(false); setActiveBed(null); }}
          loading={actionLoading}
        />
      )}

      {/* Discharge confirm */}
      {showDischarge && activeBed && (
        <ConfirmDialog
          title="Discharge Patient"
          message={`Discharge ${activeBed.patient?.firstName} ${activeBed.patient?.lastName} from bed ${activeBed.bedNumber} in ${ward.name}?`}
          onConfirm={handleDischarge}
          onCancel={() => { setShowDischarge(false); setActiveBed(null); }}
          loading={actionLoading}
        />
      )}

      {/* Maintenance confirm */}
      {showMaint && activeBed && (
        <ConfirmDialog
          title={activeBed.status === "maintenance" ? "Restore Bed" : "Mark as Maintenance"}
          message={activeBed.status === "maintenance"
            ? `Mark bed ${activeBed.bedNumber} as available again?`
            : `Mark bed ${activeBed.bedNumber} in ${ward.name} as under maintenance? It won't be available for admission.`}
          onConfirm={handleMaintenance}
          onCancel={() => { setShowMaint(false); setActiveBed(null); }}
          loading={actionLoading}
        />
      )}
    </>
  );
}
