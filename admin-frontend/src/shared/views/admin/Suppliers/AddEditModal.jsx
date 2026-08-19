import React, { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, Building2, Phone, Mail, MapPin, CreditCard, Tag, Star, FileText, Send, Sparkles } from "lucide-react";
import { PRODUCT_CATEGORY_OPTIONS } from "../../../constants/productCategories";

const PAYMENT_TERMS_OPTIONS = [
  "Cash on Delivery",
  "Net 15",
  "Net 30",
  "Net 60",
  "Advance",
  "Other",
];

const AddEditModal = ({ isOpen, onClose, onSave, supplier = null, isSaving = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    altPhone: "",
    email: "",
    telegram: "",
    address: {
      street: "",
      city: "Phnom Penh",
      province: "",
      country: "Cambodia",
    },
    categories: [],
    paymentTerms: "Cash on Delivery",
    bankInfo: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      bakongId: "",
    },
    status: "active",
    rating: 5,
    notes: "",
  });

  const [activeTab, setActiveTab] = useState("general"); // "general", "banking", "additional"
  const [error, setError] = useState("");

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        code: supplier.code || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        altPhone: supplier.altPhone || "",
        email: supplier.email || "",
        telegram: supplier.telegram || "",
        address: {
          street: supplier.address?.street || "",
          city: supplier.address?.city || "Phnom Penh",
          province: supplier.address?.province || "",
          country: supplier.address?.country || "Cambodia",
        },
        categories: Array.isArray(supplier.categories) ? supplier.categories : [],
        paymentTerms: supplier.paymentTerms || "Cash on Delivery",
        bankInfo: {
          bankName: supplier.bankInfo?.bankName || "",
          accountName: supplier.bankInfo?.accountName || "",
          accountNumber: supplier.bankInfo?.accountNumber || "",
          bakongId: supplier.bankInfo?.bakongId || "",
        },
        status: supplier.status || "active",
        rating: supplier.rating || 5,
        notes: supplier.notes || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        contactPerson: "",
        phone: "",
        altPhone: "",
        email: "",
        telegram: "",
        address: {
          street: "",
          city: "Phnom Penh",
          province: "",
          country: "Cambodia",
        },
        categories: [],
        paymentTerms: "Cash on Delivery",
        bankInfo: {
          bankName: "",
          accountName: "",
          accountNumber: "",
          bakongId: "",
        },
        status: "active",
        rating: 5,
        notes: "",
      });
    }
    setError("");
    setActiveTab("general");
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleCategoryToggle = (categoryValue) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(categoryValue);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== categoryValue)
          : [...prev.categories, categoryValue],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Supplier / Company Name is required");
      setActiveTab("general");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Primary phone number is required");
      setActiveTab("general");
      return;
    }

    onSave(formData);
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
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-main)]">
                  {supplier ? "Edit Supplier" : "Add New Supplier"}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {supplier ? `Update details for ${supplier.name}` : "Register a new vendor/supplier partner"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-lg hover:bg-[var(--color-border)]/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-6 pt-3 border-b border-[var(--color-border)] gap-4 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "general"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              General Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("banking")}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "banking"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payment & Bank
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("additional")}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "additional"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <Tag className="w-4 h-4" />
              Categories & Notes
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Company / Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phnom Penh Electronics Co., Ltd."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Supplier Code
                    </label>
                    <input
                      type="text"
                      placeholder="Auto if empty"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sokha Meng"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Primary Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type="text"
                        required
                        placeholder="012 345 678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Secondary Phone
                    </label>
                    <input
                      type="text"
                      placeholder="098 765 432"
                      value={formData.altPhone}
                      onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type="email"
                        placeholder="supplier@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Telegram Username / Number
                    </label>
                    <div className="relative">
                      <Send className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type="text"
                        placeholder="@supplier_user"
                        value={formData.telegram}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                        Street Address / Building
                      </label>
                      <input
                        type="text"
                        placeholder="Street 271, Sangkat Boeng Tumpun"
                        value={formData.address.street}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, street: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                        City / Province
                      </label>
                      <input
                        type="text"
                        placeholder="Phnom Penh"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "banking" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                    Default Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]">
                    <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
                    Banking & Bakong Settlement Details
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ABA Bank, Canadia Bank, ACLEDA"
                        value={formData.bankInfo.bankName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankInfo: { ...formData.bankInfo, bankName: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MENG SOKHA"
                        value={formData.bankInfo.accountName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankInfo: { ...formData.bankInfo, accountName: e.target.value.toUpperCase() },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="000 123 456"
                        value={formData.bankInfo.accountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankInfo: { ...formData.bankInfo, accountNumber: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                        Bakong ID (KHQR)
                      </label>
                      <input
                        type="text"
                        placeholder="username@ababank"
                        value={formData.bankInfo.bakongId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankInfo: { ...formData.bankInfo, bakongId: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "additional" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-2">
                    Supplied Product Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_CATEGORY_OPTIONS.map((cat) => {
                      const selected = formData.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                            selected
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                              : "bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                    >
                      <option value="active">Active (Available for Orders)</option>
                      <option value="inactive">Inactive / Paused</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                      Reliability Rating (1 - 5 Stars)
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className={`p-1 rounded-lg transition ${
                            star <= formData.rating ? "text-amber-400" : "text-gray-300"
                          }`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5">
                    Internal Notes & Terms
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Delivery schedules, warehouse contact notes, MOQ special deals..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:opacity-95 shadow-md transition text-sm flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {supplier ? "Update Supplier" : "Create Supplier"}
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

export default AddEditModal;
