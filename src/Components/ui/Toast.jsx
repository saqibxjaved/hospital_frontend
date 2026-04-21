import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "bg-white border-emerald-200 text-emerald-700 shadow-card-md",
    error:   "bg-white border-rose-200    text-rose-700    shadow-card-md",
    info:    "bg-white border-sky-200     text-sky-700     shadow-card-md",
  };
  const icons = {
    success: "✓",
    error:   "✕",
    info:    "ℹ",
  };
  const dotColors = {
    success: "bg-emerald-500",
    error:   "bg-rose-500",
    info:    "bg-sky-500",
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3
                     px-4 py-3 rounded-xl border text-sm font-medium
                     animate-fade-up ${styles[type]}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center
                        text-white text-xs shrink-0 ${dotColors[type]}`}>
        {icons[type]}
      </span>
      {message}
    </div>
  );
}
