import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Send,
  ExternalLink,
  Edit,
  Trash2,
  Filter,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { SupplierController } from "../../../controllers/supplierController";
import AddEditModal from "./AddEditModal";
import { PRODUCT_CATEGORY_OPTIONS } from "../../../constants/productCategories";

const SuppliersList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalPOs: 0,
    activePOs: 0,
    totalSpend: 0,
    totalOutstanding: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [suppliersRes, metricsRes] = await Promise.all([
        SupplierController.getSuppliers({
          search,
          status: statusFilter,
          category: categoryFilter,
        }),
        SupplierController.getMetrics(),
      ]);

      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
      }
      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }
    } catch (error) {
      console.error("Failed to load supplier data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier, e) => {
    e.stopPropagation();
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (formData) => {
    setIsSaving(true);
    try {
      if (editingSupplier) {
        const res = await SupplierController.updateSupplier(editingSupplier._id, formData);
        if (res.success) {
          showToast("Supplier updated successfully!");
          setIsModalOpen(false);
          loadData();
        } else {
          alert(res.error || "Failed to update supplier");
        }
      } else {
        const res = await SupplierController.createSupplier(formData);
        if (res.success) {
          showToast("New supplier registered successfully!");
          setIsModalOpen(false);
          loadData();
        } else {
          alert(res.error || "Failed to create supplier");
        }
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSupplier = async (supplier, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      return;
    }

    const res = await SupplierController.deleteSupplier(supplier._id);
    if (res.success) {
      showToast("Supplier deleted successfully");
      loadData();
    } else {
      alert(res.error || "Cannot delete supplier");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text-main)] flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[var(--color-primary)]" />
            Supplier Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage vendor relationships, procurement partners, and purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/purchase-orders"
            className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-surface-soft)] transition text-sm flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-[var(--color-primary)]" />
            Purchase Orders
          </Link>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-95 shadow-md transition text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Suppliers
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[var(--color-text-main)]">
              {metrics.totalSuppliers}
            </span>
            <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {metrics.activeSuppliers} Active
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Active Orders (POs)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[var(--color-text-main)]">
              {metrics.activePOs}
            </span>
            <span className="ml-2 text-xs font-medium text-[var(--color-text-muted)]">
              of {metrics.totalPOs} total
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Total Procured Spend
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[var(--color-text-main)]">
              ${(metrics.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Outstanding Payables
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600">
              ${(metrics.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by company name, code, contact person, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          >
            <option value="">All Categories</option>
            {PRODUCT_CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] hover:bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-[var(--color-primary)]" />
            <p className="text-sm font-medium">Loading suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-[var(--color-text-muted)]/50 mb-3" />
            <h3 className="text-base font-bold text-[var(--color-text-main)]">No Suppliers Found</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
              {search || categoryFilter || statusFilter
                ? "No suppliers match your active search filters."
                : "Register your first vendor to begin tracking supply chain and purchase orders."}
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
            >
              Add First Supplier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-4">Supplier / Company</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Categories</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4">Orders & Spend</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {suppliers.map((s) => (
                  <tr
                    key={s._id}
                    onClick={() => navigate(`/admin/suppliers/${s._id}`)}
                    className="hover:bg-[var(--color-surface-soft)]/60 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center text-sm shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition">
                            {s.name}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5">
                            <span className="font-mono bg-[var(--color-surface-soft)] px-1.5 py-0.5 rounded text-[10px] font-semibold border border-[var(--color-border)]">
                              {s.code || "SUP"}
                            </span>
                            {s.address?.city && <span>• {s.address.city}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {s.contactPerson && (
                          <div className="font-semibold text-[var(--color-text-main)]">
                            {s.contactPerson}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{s.phone}</span>
                        </div>
                        {s.telegram && (
                          <a
                            href={`https://t.me/${s.telegram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-blue-500 hover:underline text-[11px]"
                          >
                            <Send className="w-3 h-3" />
                            {s.telegram}
                          </a>
                        )}
                        {s.telegramChatId && (
                          <div className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Bot connected
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {s.categories && s.categories.length > 0 ? (
                          s.categories.slice(0, 2).map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] text-[10px] font-medium border border-[var(--color-border)]"
                            >
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">-</span>
                        )}
                        {s.categories?.length > 2 && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            +{s.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-main)]">
                        <ShoppingBag className="w-4 h-4 text-[var(--color-primary)]" />
                        {s.productCount || 0}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-[var(--color-text-main)]">
                          ${(s.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {s.totalOrders || 0} Orders
                          {s.activeOrders > 0 && (
                            <span className="ml-1.5 text-amber-600 font-semibold">
                              ({s.activeOrders} pending)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {s.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleOpenEdit(s, e)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border)]/50 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSupplier(s, e)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Add / Edit Modal */}
      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        supplier={editingSupplier}
        isSaving={isSaving}
      />
    </div>
  );
};

export default SuppliersList;
