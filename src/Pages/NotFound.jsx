import { useNavigate, useLocation } from "react-router-dom";

export default function NotFound() {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center p-6">
      <div className="text-center max-w-md">

        {/* Big 404 */}
        <div className="relative mb-8 select-none">
          <p className="font-display text-[10rem] font-bold leading-none text-slate-100 tracking-tight">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-navy-500 flex items-center
                            justify-center text-white text-4xl shadow-navy">
              ✚
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-2">
          Page not found
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          The page at{" "}
          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600">
            {location.pathname}
          </span>{" "}
          doesn't exist.
        </p>
        <p className="text-slate-400 text-sm mb-8">
          It may have been moved, deleted, or you may have mistyped the URL.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-outline">
            ← Go Back
          </button>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>

        <p className="text-xs text-slate-300 font-mono mt-10">
          MediCore HMS · Error 404
        </p>
      </div>
    </div>
  );
}
