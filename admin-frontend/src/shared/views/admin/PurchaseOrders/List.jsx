import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Filter,
} from "lucide-react";
import { PurchaseOrderController } from "../../../controllers/purchaseOrderController";
import { getPurchaseOrderItemSku } from "../../../utils/productSku";

const PurchaseOrdersList = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  const loadPOs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await PurchaseOrderController.getPurchaseOrders({
        search,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
      });
      if (res.success) {
        setPurchaseOrders(res.data);
      }
    } catch (error) {
      console.error("Failed to load purchase orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPOs();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadPOs]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "received":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Received</span>;
      case "partial_received":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Partial</span>;
      case "ordered":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Ordered</span>;
      case "draft":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Draft</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>;
      case "partial":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Partial</span>;
      case "unpaid":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Unpaid</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getItemSkuSummary = (po) => {
    const skus = [
      ...new Set(
        (po.items || [])
          .map((item) => getPurchaseOrderItemSku(item))
          .filter(Boolean)
      ),
    ];

    if (skus.length === 0) {
      return `${po.items?.length || 0} product(s)`;
    }

    const visibleSkus = skus.slice(0, 3).join(", ");
    return skus.length > 3 ? `${visibleSkus} +${skus.length - 3}` : visibleSkus;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text-main)] flex items-center gap-3">
            <Package className="w-8 h-8 text-[var(--color-primary)]" />
            Purchase Orders
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Track inventory restocks, supplier purchase vouchers, and accounts payable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/suppliers"
            className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-surface-soft)] transition text-sm flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
            Suppliers Directory
          </Link>
          <Link
            to="/admin/purchase-orders/new"
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-95 shadow-md transition text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by PO number, supplier, product SKU, or product title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          >
            <option value="">All PO Statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered (In Transit)</option>
            <option value="partial_received">Partially Received</option>
            <option value="received">Fully Received</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          >
            <option value="">All Payment Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Fully Paid</option>
          </select>

          <button
            onClick={loadPOs}
            title="Refresh"
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] hover:bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* POs Table */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
            <p className="text-sm font-semibold">Loading purchase orders...</p>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-[var(--color-text-muted)]/50 mb-3" />
            <h3 className="text-base font-bold text-[var(--color-text-main)]">No Purchase Orders Found</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
              {search || statusFilter || paymentStatusFilter
                ? "No purchase orders match your active search filters."
                : "Create a purchase order to request products and restock inventory from your suppliers."}
            </p>
            <Link
              to="/admin/purchase-orders/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
            >
              <Plus className="w-4 h-4" />
              Create First PO
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Supplier Partner</th>
                  <th className="px-6 py-4">Date Placed</th>
                  <th className="px-6 py-4">Item SKUs</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Balance Due</th>
                  <th className="px-6 py-4">Fulfillment</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {purchaseOrders.map((po) => (
                  <tr
                    key={po._id}
                    onClick={() => navigate(`/admin/purchase-orders/${po._id}`)}
                    className="hover:bg-[var(--color-surface-soft)]/60 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-[var(--color-primary)]">
                        {po.poNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text-main)]">
                        {po.supplier?.name || "Unknown Supplier"}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono">
                        {po.supplier?.code}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-[var(--color-text-muted)]">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-black uppercase text-[var(--color-text-main)]">
                        {getItemSkuSummary(po)}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                        {po.items?.length || 0} product(s)
                      </div>
                    </td>

                    <td className="px-6 py-4 font-black text-[var(--color-text-main)]">
                      ${(po.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-xs font-bold">
                      {po.balanceDue > 0 ? (
                        <span className="text-rose-600">${po.balanceDue.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-600">$0.00</span>
                      )}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(po.status)}</td>

                    <td className="px-6 py-4">{getPaymentStatusBadge(po.paymentStatus)}</td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs font-bold text-[var(--color-primary)] hover:underline">
                          View
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersList;
