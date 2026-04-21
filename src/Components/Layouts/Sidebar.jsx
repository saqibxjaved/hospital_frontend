import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/", icon: "▲", label: "Dashboard" }],
  },
  {
    label: "Clinical",
    items: [
      { to: "/patients",         icon: "♡", label: "Patients"        },
      { to: "/doctors",          icon: "✚", label: "Doctors"         },
      { to: "/appointments",     icon: "◻", label: "Appointments"    },
      { to: "/medical-records",  icon: "☰", label: "Medical Records" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/wards",   icon: "⊞", label: "Wards & Beds" },
      { to: "/billing", icon: "◈", label: "Billing"      },
    ],
  },
];

const roleAccess = {
  "/":                ["admin","doctor","receptionist","nurse","patient"],
  "/patients":        ["admin","doctor","receptionist","nurse"],
  "/doctors":         ["admin","doctor","receptionist","nurse","patient"],
  "/appointments":    ["admin","doctor","receptionist","nurse","patient"],
  "/medical-records": ["admin","doctor","nurse"],
  "/wards":           ["admin","doctor","receptionist","nurse"],
  "/billing":         ["admin","receptionist","doctor"],
};

const roleColors = {
  admin:        "bg-navy-100 text-navy-700",
  doctor:       "bg-sky-100 text-sky-700",
  receptionist: "bg-emerald-100 text-emerald-700",
  nurse:        "bg-amber-100 text-amber-700",
  patient:      "bg-slate-100 text-slate-600",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };
  const canSee = (path) => roleAccess[path]?.includes(user?.role) ?? false;

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col
                      bg-white border-r border-slate-100 overflow-y-auto shadow-sm">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-500 flex items-center
                          justify-center text-white text-base shadow-navy">
            ✚
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-slate-900 leading-tight">
              MediCore
            </p>
            <p className="text-xs text-slate-400 font-mono">HMS · v1.0</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => {
          const visible = group.items.filter((i) => canSee(i.to));
          if (!visible.length) return null;
          return (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visible.map(({ to, icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  >
                    <span className="w-5 text-center text-base">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sand-100">
          <div className="w-9 h-9 rounded-xl bg-navy-500 flex items-center
                          justify-center text-white text-sm font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md capitalize
                              ${roleColors[user?.role] ?? "bg-slate-100 text-slate-600"}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button onClick={handleLogout}
          className="btn-ghost w-full mt-2 justify-center text-xs text-slate-400 hover:text-rose-500">
          Sign out
        </button>
      </div>
    </aside>
  );
}
