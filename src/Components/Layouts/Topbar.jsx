import { useLocation } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const pageMeta = {
  "/":                { title: "Dashboard",      sub: "Your hospital at a glance"           },
  "/patients":        { title: "Patients",       sub: "Manage patient records"              },
  "/doctors":         { title: "Doctors",        sub: "Medical staff directory"             },
  "/appointments":    { title: "Appointments",   sub: "Schedule and manage appointments"    },
  "/medical-records": { title: "Medical Records",sub: "Patient clinical history"            },
  "/wards":           { title: "Wards & Beds",   sub: "Room and bed management"             },
  "/billing":         { title: "Billing",        sub: "Invoices and payment tracking"       },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user }     = useAuth();

  const meta = pageMeta[pathname] ?? { title: "MediCore", sub: "" };
  const now  = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="h-16 px-6 flex items-center justify-between
                       bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
      {/* Left */}
      <div>
        <h1 className="font-display text-xl font-semibold text-slate-900 leading-tight">
          {meta.title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{now}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Date chip */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl
                        bg-sand-100 border border-sand-200">
          <span className="text-xs text-slate-500">{meta.sub}</span>
        </div>

        {/* Notification */}
        <button className="w-9 h-9 rounded-xl bg-sand-100 border border-sand-200
                           flex items-center justify-center text-slate-500
                           hover:bg-navy-50 hover:border-navy-200 hover:text-navy-600
                           transition-all duration-150 text-sm">
          ◎
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-navy-500 flex items-center
                        justify-center text-white text-sm font-bold shadow-navy cursor-pointer">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
}
