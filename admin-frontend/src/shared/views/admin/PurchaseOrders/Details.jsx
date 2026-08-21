import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  PackageCheck,
  CreditCard,
  Printer,
  Trash2,
  Boxes,
  Truck,
  Phone,
  Send,
  AlertCircle,
  FileText,
} from "lucide-react";
import { PurchaseOrderController } from "../../../controllers/purchaseOrderController";
import ReceiveStockModal from "./ReceiveStockModal";
import RecordPaymentModal from "./RecordPaymentModal";
import { getPurchaseOrderItemSku } from "../../../utils/productSku";

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadPO = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await PurchaseOrderController.getPOById(id);
      if (res.success) {
        setPo(res.data);
      } else {
        alert(res.error || "Purchase order not found");
        navigate("/admin/purchase-orders");
      }
    } catch (error) {
      console.error("Failed to load PO:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadPO();
  }, [loadPO]);

  const handleReceiveStock = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await PurchaseOrderController.receiveStock(id, data);
      if (res.success) {
        showToast(res.message || "Stock received and inventory updated!");
        setIsReceiveModalOpen(false);
        loadPO();
      } else {
        alert(res.error || "Failed to receive stock");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await PurchaseOrderController.recordPayment(id, data);
      if (res.success) {
        showToast(res.message || "Payment recorded successfully!");
        setIsPaymentModalOpen(false);
        loadPO();
      } else {
        alert(res.error || "Failed to record payment");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsOrdered = async () => {
    if (!window.confirm("Mark this purchase order as ordered and sent to supplier?")) return;
    const res = await PurchaseOrderController.updatePO(id, { status: "ordered" });
    if (res.success) {
      showToast(res.message || "PO status updated to Ordered");
      loadPO();
    } else {
      alert(res.error || "Failed to update status");
    }
  };

  const handleCancelPO = async () => {
    if (!window.confirm("Are you sure you want to cancel this purchase order?")) return;
    const res = await PurchaseOrderController.updatePO(id, { status: "cancelled" });
    if (res.success) {
      showToast("PO cancelled");
      loadPO();
    } else {
      alert(res.error || "Failed to cancel PO");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "received":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Received (Completed)</span>;
      case "partial_received":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">Partially Received</span>;
      case "ordered":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">Ordered (In Transit)</span>;
      case "draft":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 border border-gray-200">Draft</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Fully Paid</span>;
      case "partial":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">Partially Paid</span>;
      case "unpaid":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">Unpaid</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getStatusLabel = (status = "") => {
    const labels = {
      draft: "Draft",
      ordered: "Ordered",
      partial_received: "Partially Received",
      received: "Received",
      cancelled: "Cancelled",
    };

    return labels[status] || status || "Not set";
  };

  const getPaymentStatusLabel = (status = "") => {
    const labels = {
      unpaid: "Unpaid",
      partial: "Partially Paid",
      paid: "Paid",
    };

    return labels[status] || status || "Not set";
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "Not set";

  const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[var(--color-text-muted)]">
        <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading purchase order details...</p>
      </div>
    );
  }

  if (!po) return null;

  const supplierAddress = [
    po.supplier?.address?.street,
    po.supplier?.address?.city,
    po.supplier?.address?.province,
    po.supplier?.address?.country,
  ].filter(Boolean).join(", ");

  return (
    <>
    <style>
      {`
        @media screen {
          .po-print-voucher {
            display: none;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .po-screen-content {
            display: none !important;
          }

          .po-print-voucher,
          .po-print-voucher * {
            visibility: visible !important;
          }

          .po-print-voucher {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            color: #111827;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.35;
          }

          .po-print-header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid #111827;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }

          .po-print-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.08em;
            margin: 0 0 6px;
          }

          .po-print-number {
            font-size: 16px;
            font-weight: 800;
            margin: 0;
          }

          .po-print-muted {
            color: #4b5563;
          }

          .po-print-meta {
            text-align: right;
            min-width: 180px;
          }

          .po-print-grid {
            display: grid;
            grid-template-columns: 1.25fr 0.75fr;
            gap: 14px;
            margin-bottom: 14px;
          }

          .po-print-box {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 10px;
            break-inside: avoid;
          }

          .po-print-section-title {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #374151;
            margin: 0 0 8px;
          }

          .po-print-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 2px 0;
          }

          .po-print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 10.5px;
          }

          .po-print-table th {
            border-bottom: 1px solid #111827;
            padding: 7px 6px;
            text-align: left;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
          }

          .po-print-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 7px 6px;
            vertical-align: top;
          }

          .po-print-table tr {
            break-inside: avoid;
          }

          .po-print-right {
            text-align: right !important;
          }

          .po-print-center {
            text-align: center !important;
          }

          .po-print-total {
            border-top: 2px solid #111827;
            margin-top: 6px;
            padding-top: 6px;
            font-size: 13px;
            font-weight: 800;
          }

          .po-print-notes {
            margin-top: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 10px;
            min-height: 42px;
            break-inside: avoid;
          }

          .po-print-signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 34px;
            break-inside: avoid;
          }

          .po-print-signature-line {
            border-top: 1px solid #111827;
            padding-top: 6px;
            text-align: center;
            font-weight: 700;
          }
        }
      `}
    </style>

    <div className="po-screen-content p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Back and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate("/admin/purchase-orders")}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Purchase Orders
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] text-xs font-semibold hover:bg-[var(--color-surface-soft)] transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Voucher
          </button>

          {po.status === "draft" && (
            <button
              onClick={handleMarkAsOrdered}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              Mark as Ordered
            </button>
          )}

          {po.status !== "received" && po.status !== "cancelled" && (
            <button
              onClick={() => setIsReceiveModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              Receive Stock
            </button>
          )}

          {po.balanceDue > 0 && po.status !== "cancelled" && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-95 shadow-sm transition flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              Record Payment
            </button>
          )}

          {po.status !== "received" && po.status !== "cancelled" && (
            <button
              onClick={handleCancelPO}
              className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
            >
              Cancel PO
            </button>
          )}
        </div>
      </div>

      {/* Main PO Document Container */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-main)] font-mono">
                {po.poNumber}
              </h1>
              {getStatusBadge(po.status)}
              {getPaymentStatusBadge(po.paymentStatus)}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-3">
              <span>Created on {new Date(po.createdAt).toLocaleDateString()}</span>
              {po.expectedDeliveryDate && (
                <span>• Expected Delivery: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
              )}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Total Order Value
            </span>
            <span className="text-3xl font-black text-[var(--color-primary)] block mt-0.5">
              ${po.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Supplier & Logistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[var(--color-border)]">
          {/* Supplier Info */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                Supplier Information
              </span>
              {po.supplier && (
                <Link
                  to={`/admin/suppliers/${po.supplier._id}`}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                >
                  View Profile →
                </Link>
              )}
            </div>
            <div className="font-bold text-base text-[var(--color-text-main)]">
              {po.supplier?.name} <span className="text-xs font-mono font-normal text-[var(--color-text-muted)]">({po.supplier?.code})</span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] space-y-1">
              {po.supplier?.contactPerson && (
                <div>Contact: <span className="font-semibold text-[var(--color-text-main)]">{po.supplier.contactPerson}</span></div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span>{po.supplier?.phone}</span>
                {po.supplier?.telegram && (
                  <span className="text-blue-600 font-semibold">• {po.supplier.telegram}</span>
                )}
                {po.supplier?.telegramChatId && (
                  <span className="text-emerald-600 font-semibold">• Bot connected</span>
                )}
              </div>
              {po.supplierTelegramOrder?.error && !po.supplierTelegramOrder?.sentAt && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {po.supplierTelegramOrder.error}
                </div>
              )}
              {po.supplier?.address?.city && (
                <div>Address: {po.supplier.address.street ? `${po.supplier.address.street}, ` : ""}{po.supplier.address.city}</div>
              )}
            </div>
          </div>

          {/* Payment & Terms Overview */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
              Settlement & Terms
            </span>
            <div className="font-bold text-sm text-[var(--color-text-main)]">
              Terms: {po.supplier?.paymentTerms || "Cash on Delivery"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[var(--color-text-muted)] block">Amount Paid:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  ${(po.paidAmount || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block">Balance Due:</span>
                <span className={`font-bold text-sm ${po.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  ${po.balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-[var(--color-primary)]" />
            Ordered Items & Receiving Progress
          </h3>

          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-soft)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">
                  <th className="px-4 py-3">SKU / Product</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3 text-center">Ordered</th>
                  <th className="px-4 py-3 text-center">Received</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {po.items.map((item, idx) => {
                  const percent = Math.min(
                    100,
                    Math.round(((item.receivedQuantity || 0) / item.orderedQuantity) * 100)
                  );

                  return (
                    <tr key={idx} className="hover:bg-[var(--color-surface-soft)]/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-soft)] flex items-center justify-center">
                              <Boxes className="w-5 h-5 text-[var(--color-text-muted)]" />
                            </div>
                          )}
                          <div>
                            <div className="font-mono text-xs font-black uppercase text-[var(--color-primary)]">
                              {getPurchaseOrderItemSku(item)}
                            </div>
                            <div className="mt-0.5 font-semibold text-[var(--color-text-main)]">
                              {item.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                        {item.size && (
                          <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-soft)] border border-[var(--color-border)] mr-1">
                            {item.size}
                          </span>
                        )}
                        {item.color && <span>{item.color}</span>}
                        {!item.size && !item.color && <span>Standard</span>}
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-[var(--color-text-main)]">
                        {item.orderedQuantity}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-bold text-xs ${
                              item.receivedQuantity >= item.orderedQuantity
                                ? "text-emerald-600"
                                : item.receivedQuantity > 0
                                ? "text-blue-600"
                                : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {item.receivedQuantity || 0} / {item.orderedQuantity}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full ${
                                percent === 100 ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-muted)]">
                        ${item.unitCost.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-[var(--color-text-main)]">
                        ${item.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Summary & Notes Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs space-y-1">
            <span className="font-bold text-[var(--color-text-main)] block mb-1">Order Notes:</span>
            <p className="text-[var(--color-text-muted)] italic">
              {po.notes || "No additional notes provided for this purchase order."}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center text-[var(--color-text-muted)]">
              <span>Subtotal:</span>
              <span className="font-semibold text-[var(--color-text-main)]">
                ${po.subtotal.toFixed(2)}
              </span>
            </div>
            {po.shippingFee > 0 && (
              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Shipping / Freight:</span>
                <span className="font-semibold text-[var(--color-text-main)]">
                  ${po.shippingFee.toFixed(2)}
                </span>
              </div>
            )}
            {po.tax > 0 && (
              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Tax:</span>
                <span className="font-semibold text-[var(--color-text-main)]">
                  ${po.tax.toFixed(2)}
                </span>
              </div>
            )}
            {po.discount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 font-semibold">
                <span>Discount:</span>
                <span>-${po.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center text-base font-black text-[var(--color-text-main)]">
              <span>Total Amount:</span>
              <span className="text-[var(--color-primary)] font-black text-lg">
                ${po.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Receiving Logs History */}
        {po.receivingLogs?.length > 0 && (
          <div className="pt-6 border-t border-[var(--color-border)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Stock Receiving Audit Trail ({po.receivingLogs.length} receipts)
            </h3>

            <div className="space-y-2">
              {po.receivingLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-[var(--color-text-main)]">
                      Received by: {log.receiverName || "Admin"} • {new Date(log.receivedAt).toLocaleString()}
                    </div>
                    <div className="text-[var(--color-text-muted)] mt-0.5">
                      {log.itemsReceived?.map((it, i) => (
                        <span key={i} className="mr-2">
                          + {it.quantity}x {getPurchaseOrderItemSku(it)} {it.size ? `(${it.size})` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  {log.notes && (
                    <div className="text-[var(--color-text-muted)] italic max-w-xs text-right">
                      "{log.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Logs History */}
        {po.paymentLogs?.length > 0 && (
          <div className="pt-6 border-t border-[var(--color-border)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[var(--color-primary)]" />
              Payment Records ({po.paymentLogs.length} transactions)
            </h3>

            <div className="space-y-2">
              {po.paymentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-emerald-600">
                      ${log.amount.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-semibold text-[var(--color-text-main)]">
                      {log.method}
                    </span>
                    {log.reference && (
                      <span className="text-[var(--color-text-muted)] font-mono">
                        Ref: {log.reference}
                      </span>
                    )}
                  </div>
                  <div className="text-[var(--color-text-muted)]">
                    {new Date(log.paidAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReceiveStockModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        onReceive={handleReceiveStock}
        po={po}
        isSubmitting={isSubmitting}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onRecord={handleRecordPayment}
        po={po}
        isSubmitting={isSubmitting}
      />
    </div>
    <section className="po-print-voucher">
      <header className="po-print-header">
        <div>
          <h1 className="po-print-title">Purchase Order Voucher</h1>
          <p className="po-print-number">{po.poNumber}</p>
          <p className="po-print-muted">
            Created: {formatDate(po.createdAt)}
            {po.expectedDeliveryDate ? ` | Expected: ${formatDate(po.expectedDeliveryDate)}` : ""}
          </p>
        </div>
        <div className="po-print-meta">
          <div className="po-print-row">
            <span className="po-print-muted">Order Status</span>
            <strong>{getStatusLabel(po.status)}</strong>
          </div>
          <div className="po-print-row">
            <span className="po-print-muted">Payment</span>
            <strong>{getPaymentStatusLabel(po.paymentStatus)}</strong>
          </div>
          <div className="po-print-row po-print-total">
            <span>Total</span>
            <span>{formatMoney(po.totalAmount)}</span>
          </div>
        </div>
      </header>

      <div className="po-print-grid">
        <div className="po-print-box">
          <h2 className="po-print-section-title">Supplier</h2>
          <strong>{po.supplier?.name || "Unknown Supplier"}</strong>
          {po.supplier?.code ? <span> ({po.supplier.code})</span> : null}
          <div className="po-print-muted">
            {po.supplier?.contactPerson ? `Contact: ${po.supplier.contactPerson}` : ""}
          </div>
          <div>
            {po.supplier?.phone || ""}
            {po.supplier?.telegram ? ` | Telegram: ${po.supplier.telegram}` : ""}
          </div>
          {supplierAddress ? <div>{supplierAddress}</div> : null}
        </div>

        <div className="po-print-box">
          <h2 className="po-print-section-title">Payment Summary</h2>
          <div className="po-print-row">
            <span>Terms</span>
            <strong>{po.supplier?.paymentTerms || "Cash on Delivery"}</strong>
          </div>
          <div className="po-print-row">
            <span>Paid</span>
            <strong>{formatMoney(po.paidAmount)}</strong>
          </div>
          <div className="po-print-row">
            <span>Balance Due</span>
            <strong>{formatMoney(po.balanceDue)}</strong>
          </div>
        </div>
      </div>

      <div className="po-print-box">
        <h2 className="po-print-section-title">Items</h2>
        <table className="po-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>SKU</th>
              <th>Product</th>
              <th>Variant</th>
              <th className="po-print-center">Ordered</th>
              <th className="po-print-center">Received</th>
              <th className="po-print-right">Unit Cost</th>
              <th className="po-print-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, index) => (
              <tr key={item._id || index}>
                <td>{index + 1}</td>
                <td>
                  <strong>{getPurchaseOrderItemSku(item)}</strong>
                </td>
                <td>
                  <strong>{item.title}</strong>
                </td>
                <td>{[item.size, item.color].filter(Boolean).join(" / ") || "Standard"}</td>
                <td className="po-print-center">{item.orderedQuantity}</td>
                <td className="po-print-center">{item.receivedQuantity || 0}</td>
                <td className="po-print-right">{formatMoney(item.unitCost)}</td>
                <td className="po-print-right">{formatMoney(item.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="po-print-grid" style={{ marginTop: 14 }}>
        <div className="po-print-notes">
          <h2 className="po-print-section-title">Notes</h2>
          <div>{po.notes || "No notes"}</div>
        </div>

        <div className="po-print-box">
          <h2 className="po-print-section-title">Totals</h2>
          <div className="po-print-row">
            <span>Subtotal</span>
            <strong>{formatMoney(po.subtotal)}</strong>
          </div>
          <div className="po-print-row">
            <span>Shipping</span>
            <strong>{formatMoney(po.shippingFee)}</strong>
          </div>
          <div className="po-print-row">
            <span>Tax / Fees</span>
            <strong>{formatMoney(po.tax)}</strong>
          </div>
          <div className="po-print-row">
            <span>Discount</span>
            <strong>-{formatMoney(po.discount)}</strong>
          </div>
          <div className="po-print-row po-print-total">
            <span>Total</span>
            <span>{formatMoney(po.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="po-print-signatures">
        <div className="po-print-signature-line">Prepared By</div>
        <div className="po-print-signature-line">Approved By</div>
        <div className="po-print-signature-line">Supplier / Receiver</div>
      </div>
    </section>
    </>
  );
};

export default PurchaseOrderDetails;
