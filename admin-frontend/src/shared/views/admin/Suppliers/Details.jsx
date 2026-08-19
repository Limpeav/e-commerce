import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  Building2,
  Phone,
  Mail,
  Send,
  MapPin,
  CreditCard,
  Tag,
  Star,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  FileText,
  Calendar,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { SupplierController } from "../../../controllers/supplierController";
import AddEditModal from "./AddEditModal";

const SupplierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders"); // "orders", "products", "financials"
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadSupplier = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await SupplierController.getSupplierById(id);
      if (res.success) {
        setSupplier(res.data);
      } else {
        alert(res.error || "Supplier not found");
        navigate("/admin/suppliers");
      }
    } catch (error) {
      console.error("Failed to load supplier:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

  const handleUpdateSupplier = async (formData) => {
    setIsSaving(true);
    try {
      const res = await SupplierController.updateSupplier(id, formData);
      if (res.success) {
        showToast("Supplier updated successfully!");
        setIsEditModalOpen(false);
        loadSupplier();
      } else {
        alert(res.error || "Failed to update supplier");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!window.confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      return;
    }
    const res = await SupplierController.deleteSupplier(id);
    if (res.success) {
      navigate("/admin/suppliers");
    } else {
      alert(res.error || "Failed to delete supplier");
    }
  };

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

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[var(--color-text-muted)]">
        <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading supplier profile...</p>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate("/admin/suppliers")}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Suppliers
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-surface-soft)] transition text-sm flex items-center gap-2"
          >
            <Edit className="w-4 h-4 text-[var(--color-primary)]" />
            Edit Profile
          </button>
          <Link
            to={`/admin/purchase-orders/new?supplierId=${supplier._id}`}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-95 shadow-md transition text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </Link>
          <button
            onClick={handleDeleteSupplier}
            className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
            title="Delete Supplier"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Supplier Profile Card */}
      <div className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-black text-2xl flex items-center justify-center shrink-0">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text-main)]">
                  {supplier.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {supplier.code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    supplier.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {supplier.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-muted)]">
                {supplier.contactPerson && (
                  <span>Contact: <strong className="text-[var(--color-text-main)]">{supplier.contactPerson}</strong></span>
                )}
                {supplier.address?.city && (
                  <span>• {supplier.address.street ? `${supplier.address.street}, ` : ""}{supplier.address.city}</span>
                )}
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold">{supplier.rating || 5}.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${supplier.phone}`}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-surface-soft)] hover:bg-[var(--color-border)] text-[var(--color-text-main)] text-xs font-semibold flex items-center gap-1.5 transition border border-[var(--color-border)]"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              {supplier.phone}
            </a>
            {supplier.telegram && (
              <a
                href={`https://t.me/${supplier.telegram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition border border-blue-200"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
            )}
            {supplier.email && (
              <a
                href={`mailto:${supplier.email}`}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-surface-soft)] hover:bg-[var(--color-border)] text-[var(--color-text-main)] text-xs font-semibold flex items-center gap-1.5 transition border border-[var(--color-border)]"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-sm">
          {/* Payment Terms & Info */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
              Payment Terms & Banking
            </div>
            <div className="font-semibold text-[var(--color-text-main)]">
              Terms: {supplier.paymentTerms || "Cash on Delivery"}
            </div>
            {supplier.bankInfo?.bankName && (
              <div className="text-xs text-[var(--color-text-muted)] space-y-0.5">
                <div>Bank: <span className="font-medium text-[var(--color-text-main)]">{supplier.bankInfo.bankName}</span></div>
                <div>Account: <span className="font-mono text-[var(--color-text-main)]">{supplier.bankInfo.accountNumber}</span> ({supplier.bankInfo.accountName})</div>
                {supplier.bankInfo.bakongId && (
                  <div>Bakong ID: <span className="font-mono text-[var(--color-text-main)]">{supplier.bankInfo.bakongId}</span></div>
                )}
              </div>
            )}
          </div>

          {/* Categories & Catalog */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[var(--color-primary)]" />
              Supplied Categories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {supplier.categories && supplier.categories.length > 0 ? (
                supplier.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-main)]"
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">No category tags specified</span>
              )}
            </div>
          </div>

          {/* Spend Summary */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Procurement Summary
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)]">Total Spend:</span>
              <span className="font-bold text-[var(--color-text-main)]">
                ${(supplier.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)]">Outstanding Balance:</span>
              <span className={`font-bold ${supplier.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                ${(supplier.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)]">Linked Products:</span>
              <span className="font-bold text-[var(--color-text-main)]">{supplier.products?.length || 0}</span>
            </div>
          </div>
        </div>

        {supplier.notes && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-2">
            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Internal Notes: </span>
              {supplier.notes}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          }`}
        >
          <Package className="w-4 h-4" />
          Purchase Orders ({supplier.purchaseOrders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === "products"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Supplied Products ({supplier.products?.length || 0})
        </button>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === "orders" && (
        <div className="rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm overflow-hidden">
          {supplier.purchaseOrders?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 mx-auto text-[var(--color-text-muted)]/50 mb-2" />
              <h3 className="text-sm font-bold text-[var(--color-text-main)]">No Purchase Orders Placed Yet</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Create a purchase order to request products and restock inventory from this supplier.
              </p>
              <Link
                to={`/admin/purchase-orders/new?supplierId=${supplier._id}`}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
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
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Balance Due</th>
                    <th className="px-6 py-4">Order Status</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {supplier.purchaseOrders?.map((po) => (
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
                      <td className="px-6 py-4 text-xs text-[var(--color-text-muted)]">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--color-text-main)]">
                        {po.items?.length || 0} product(s)
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--color-text-main)]">
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
                        <ChevronRight className="w-4 h-4 inline text-[var(--color-text-muted)]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Supplied Products */}
      {activeTab === "products" && (
        <div className="rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm overflow-hidden">
          {supplier.products?.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-10 h-10 mx-auto text-[var(--color-text-muted)]/50 mb-2" />
              <h3 className="text-sm font-bold text-[var(--color-text-main)]">No Products Linked Yet</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Assign this supplier when creating or editing products in your catalog.
              </p>
              <Link
                to="/admin/products/add"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock Level</th>
                    <th className="px-6 py-4">Cost Price</th>
                    <th className="px-6 py-4">Selling Price</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {supplier.products?.map((prod) => (
                    <tr
                      key={prod._id}
                      onClick={() => navigate(`/admin/products/${prod._id}`)}
                      className="hover:bg-[var(--color-surface-soft)]/60 cursor-pointer transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                          />
                          <div className="font-bold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition">
                            {prod.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--color-text-muted)]">
                        {prod.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-xs ${
                            prod.stock <= 5 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full" : "text-[var(--color-text-main)]"
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[var(--color-text-muted)]">
                        ${(prod.costPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--color-text-main)]">
                        ${prod.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/purchase-orders/new?supplierId=${supplier._id}&productId=${prod._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-bold transition"
                        >
                          Reorder
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <AddEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateSupplier}
        supplier={supplier}
        isSaving={isSaving}
      />
    </div>
  );
};

export default SupplierDetails;
