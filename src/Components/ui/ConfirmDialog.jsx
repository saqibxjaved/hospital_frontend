export default function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-card-lg
                      border border-slate-100 p-6 animate-scale-in">
        <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100
                        flex items-center justify-center text-rose-500 text-lg mb-4">
          ⚠
        </div>
        <h3 className="font-display text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1 justify-center">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
            {loading ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
