import React, { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, PackageCheck, AlertCircle, Sparkles, Boxes } from "lucide-react";
import { getPurchaseOrderItemSku } from "../../../utils/productSku";

const ReceiveStockModal = ({ isOpen, onClose, onReceive, po, isSubmitting = false }) => {
  const [receivedMap, setReceivedMap] = useState({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (po && Array.isArray(po.items)) {
      const initialMap = {};
      po.items.forEach((item) => {
        const remaining = Math.max(0, item.orderedQuantity - (item.receivedQuantity || 0));
        initialMap[item._id] = remaining; // Default to remaining quantity
      });
      setReceivedMap(initialMap);
      setNotes("");
      setError("");
    }
  }, [po, isOpen]);

  if (!isOpen || !po) return null;

  const handleQtyChange = (itemId, val, maxAllowed) => {
    const parsed = parseInt(val, 10);
    const safeQty = isNaN(parsed) ? "" : Math.min(Math.max(0, parsed), maxAllowed);
    setReceivedMap((prev) => ({
      ...prev,
      [itemId]: safeQty,
    }));
  };

  const handleReceiveAll = () => {
    const fullMap = {};
    po.items.forEach((item) => {
      const remaining = Math.max(0, item.orderedQuantity - (item.receivedQuantity || 0));
      fullMap[item._id] = remaining;
    });
    setReceivedMap(fullMap);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const receivedItems = [];
    for (const item of po.items) {
      const qty = parseInt(receivedMap[item._id], 10) || 0;
      if (qty > 0) {
        receivedItems.push({
          itemId: item._id,
          product: item.product?._id || item.product,
          size: item.size || "",
          color: item.color || "",
          quantity: qty,
        });
      }
    }

    if (receivedItems.length === 0) {
      setError("Please specify at least one quantity to receive into stock.");
      return;
    }

    onReceive({ receivedItems, notes });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <Motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[var(--color-bg-card)] rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface-soft)]">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-main)]">
                  Receive Inbound Stock
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  PO: <span className="font-mono font-bold text-[var(--color-primary)]">{po.poNumber}</span> • Automatically updates inventory
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

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Items to Receive
              </span>
              <button
                type="button"
                onClick={handleReceiveAll}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline"
              >
                Fill All Remaining
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {po.items.map((item) => {
                const remaining = Math.max(0, item.orderedQuantity - (item.receivedQuantity || 0));
                const isFullyReceived = remaining === 0;

                return (
                  <div
                    key={item._id}
                    className={`p-4 rounded-xl border transition ${
                      isFullyReceived
                        ? "bg-emerald-50/50 border-emerald-200 opacity-70"
                        : "bg-[var(--color-surface-soft)] border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
                            <Boxes className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-[var(--color-text-main)]">
                            {item.title}
                          </div>
                          <div className="mt-0.5 font-mono text-xs font-black uppercase text-[var(--color-primary)]">
                            SKU: {getPurchaseOrderItemSku(item)}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5">
                            {item.size && (
                              <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>• Ordered: {item.orderedQuantity}</span>
                            <span>• Prev Received: {item.receivedQuantity || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                            Qty to Receive
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            disabled={isFullyReceived || isSubmitting}
                            value={receivedMap[item._id] ?? ""}
                            onChange={(e) => handleQtyChange(item._id, e.target.value, remaining)}
                            className="w-24 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] font-bold text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Receiving Notes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                Receiving Notes / Shipment Reference (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Inspected condition, delivery driver name, batch notes..."
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
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-md transition text-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Stock...
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    Confirm & Update Stock
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

export default ReceiveStockModal;
