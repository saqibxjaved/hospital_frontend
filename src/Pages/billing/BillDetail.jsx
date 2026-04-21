import { useState } from "react";

const paymentStatusStyle = {
  unpaid:  "badge-danger",
  partial: "badge-warning",
  paid:    "badge-success",
};

const PAYMENT_METHODS = ["cash", "card", "insurance", "mixed"];

function LineItem({ label, amount, sub, color = "text-slate-700" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={`text-sm font-medium ${color}`}>{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm font-mono font-semibold shrink-0 ${color}`}>
        ${(amount || 0).toFixed(2)}
      </p>
    </div>
  );
}

export default function BillDetail({ bill, onClose, onPayment, paymentLoading }) {
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm,     setPayForm]     = useState({ amount: "", method: "cash", notes: "" });
  const [payError,    setPayError]    = useState("");

  if (!bill) return null;

  const handlePaySubmit = () => {
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      setPayError("Enter a valid payment amount.");
      return;
    }
    if (parseFloat(payForm.amount) > bill.balanceDue) {
      setPayError(`Amount cannot exceed balance due ($${bill.balanceDue?.toFixed(2)}).`);
      return;
    }
    onPayment(bill._id, {
      amount: parseFloat(payForm.amount),
      method: payForm.method,
      notes:  payForm.notes,
    });
    setShowPayForm(false);
  };

  const dateStr = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString("en-US",
        { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg h-full bg-white flex flex-col
                      shadow-card-lg border-l border-slate-100 overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={paymentStatusStyle[bill.paymentStatus] ?? "badge-neutral"}>
                {bill.paymentStatus}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                #{bill._id?.slice(-8).toUpperCase()}
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Bill Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200
                       flex items-center justify-center text-slate-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-sand-50">

          {/* Patient & Appointment */}
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-500 text-white flex items-center
                              justify-center text-sm font-bold shrink-0 shadow-navy">
                {bill.appointment?.patient?.firstName?.[0]}
                {bill.appointment?.patient?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  {bill.appointment?.patient?.firstName} {bill.appointment?.patient?.lastName}
                </p>
                <p className="text-xs text-slate-400">
                  {bill.appointment?.appointmentDate
                    ? new Date(bill.appointment.appointmentDate).toLocaleDateString("en-US",
                        { month: "short", day: "numeric", year: "numeric" })
                    : "—"}{" "}
                  · Dr. {bill.appointment?.doctor?.firstName} {bill.appointment?.doctor?.lastName}
                  · <span className="capitalize">{bill.appointment?.type}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Charges breakdown */}
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Charges
            </p>

            <LineItem label="Consultation Fee" amount={bill.consultationFee} />

            {bill.roomCharges > 0 && (
              <LineItem label="Room / Ward Charges" amount={bill.roomCharges} />
            )}

            {bill.medicationCharges?.map((m, i) => (
              <LineItem key={i} label={m.name || `Medication ${i + 1}`} amount={m.amount}
                color="text-slate-600" />
            ))}

            {bill.labTestCharges?.map((l, i) => (
              <LineItem key={i} label={l.testName || `Lab Test ${i + 1}`} amount={l.amount}
                color="text-slate-600" />
            ))}

            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">${(bill.subtotal || 0).toFixed(2)}</span>
              </div>

              {bill.insurance?.coveredAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>
                    Insurance ({bill.insurance.provider || "Coverage"})
                    {bill.insurance.policyNumber && (
                      <span className="text-xs text-emerald-500 ml-1">
                        · {bill.insurance.policyNumber}
                      </span>
                    )}
                  </span>
                  <span className="font-mono">− ${(bill.insurance.coveredAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                <span>Total Amount</span>
                <span className="font-mono">${(bill.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Payment Summary
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total Amount</span>
                <span className="font-mono">${(bill.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Amount Paid</span>
                <span className="font-mono">${(bill.amountPaid || 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-base font-bold pt-2 border-t border-slate-100
                              ${bill.balanceDue > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                <span>Balance Due</span>
                <span className="font-mono">${(bill.balanceDue || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Occupancy bar */}
            {bill.totalAmount > 0 && (
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((bill.amountPaid || 0) / bill.totalAmount) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          {bill.notes && (
            <div className="card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-slate-600 leading-relaxed">{bill.notes}</p>
            </div>
          )}

          {/* Payment form */}
          {showPayForm && (
            <div className="card border-navy-200 bg-navy-50 space-y-3">
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wider">
                Record Payment
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min="0.01" step="0.01"
                      max={bill.balanceDue}
                      value={payForm.amount}
                      onChange={(e) => { setPayForm((f) => ({ ...f, amount: e.target.value })); setPayError(""); }}
                      className="input pl-7 bg-white" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="label">Method</label>
                  <select value={payForm.method}
                    onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
                    className="input bg-white capitalize">
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m} className="capitalize">{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <input value={payForm.notes}
                  onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input bg-white" placeholder="e.g. Paid by card at reception..." />
              </div>
              {payError && <p className="text-rose-500 text-xs">{payError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowPayForm(false)} className="btn-outline flex-1 justify-center text-sm">
                  Cancel
                </button>
                <button onClick={handlePaySubmit} disabled={paymentLoading}
                  className="btn-success flex-1 justify-center text-sm">
                  {paymentLoading
                    ? <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    : "Confirm Payment"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Close</button>
          {bill.paymentStatus !== "paid" && !showPayForm && (
            <button onClick={() => setShowPayForm(true)} className="btn-success flex-1 justify-center">
              Record Payment
            </button>
          )}
          {bill.paymentStatus === "paid" && (
            <div className="flex-1 flex items-center justify-center gap-2
                            text-emerald-600 font-semibold text-sm">
              <span>✓</span> Fully Paid
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
