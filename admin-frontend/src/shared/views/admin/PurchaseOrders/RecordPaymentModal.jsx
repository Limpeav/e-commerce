import React, { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, CreditCard, AlertCircle, Sparkles } from "lucide-react";

const PAYMENT_METHODS = ["Cash", "Bakong / QR", "Bank Transfer", "Cheque", "Other"];

const RecordPaymentModal = ({ isOpen, onClose, onRecord, po, isSubmitting = false }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (po && isOpen) {
      setAmount(po.balanceDue > 0 ? String(po.balanceDue) : "");
      setMethod("Cash");
      setReference("");
      setNotes("");
      setError("");
    }
  }, [po, isOpen]);

  if (!isOpen || !po) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setError("Please enter a valid payment amount greater than 0");
      return;
    }

    if (payAmount > po.balanceDue) {
      setError(`Payment cannot exceed the outstanding balance of $${po.balanceDue.toFixed(2)}`);
      return;
    }

    onRecord({
      amount: payAmount,
      method,
      reference,
      notes,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[var(--color-bg-card)] rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-main)]">
                  Record Supplier Payment
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  PO: <span className="font-mono font-bold text-[var(--color-primary)]">{po.poNumber}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-lg hover:bg-[var(--color-border)]/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Balance Overview Card */}
          <div className="mx-6 mt-5 p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-[var(--color-text-muted)] block">Total Order</span>
              <span className="font-bold text-sm text-[var(--color-text-main)] mt-0.5 block">
                ${po.totalAmount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Paid So Far</span>
              <span className="font-bold text-sm text-emerald-600 mt-0.5 block">
                ${(po.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)] block">Balance Due</span>
              <span className="font-bold text-sm text-rose-600 mt-0.5 block">
                ${po.balanceDue.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                Payment Amount ($ USD) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={po.balanceDue}
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] font-bold text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                Reference / Receipt / Transaction ID
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-892147 or Receipt #042"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                Payment Notes
              </label>
              <textarea
                rows={2}
                placeholder="Notes for accounting & reconciliation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:opacity-95 shadow-md transition text-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </Motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RecordPaymentModal;
