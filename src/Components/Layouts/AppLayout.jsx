import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-sand-100">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-navy-500 flex items-center justify-center
                          text-white text-2xl mx-auto mb-4 shadow-navy animate-pulse">✚</div>
          <p className="font-display text-xl font-semibold text-slate-700">MediCore</p>
          <p className="text-sm text-slate-400 mt-1">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-sand-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="fade-up max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
