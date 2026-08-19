import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  FileText,
  Boxes,
  Truck,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { SupplierController } from "../../../controllers/supplierController";
import { PurchaseOrderController } from "../../../controllers/purchaseOrderController";
import { ProductController } from "../../../controllers/productController";
import { getProductSku, normalizeSku } from "../../../utils/productSku";

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSupplierId = searchParams.get("supplierId") || "";
  const initialProductId = searchParams.get("productId") || "";

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId);
  const [allProducts, setAllProducts] = useState([]);
  const [supplierProducts, setSupplierProducts] = useState([]);

  const [items, setItems] = useState([]);
  const [shippingFee, setShippingFee] = useState("");
  const [tax, setTax] = useState("");
  const [discount, setDiscount] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productSource, setProductSource] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load suppliers and catalog products
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const [supRes, prodRes] = await Promise.all([
          SupplierController.getSuppliers({ status: "active", limit: 100 }),
          ProductController.getProducts({ limit: 300 }),
        ]);

        if (supRes.success) setSuppliers(supRes.data);
        const productList = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data?.products || [];
        setAllProducts(productList);

        // If initialProductId was passed, auto-add that product to line items
        if (initialProductId) {
          const matched = productList.find((p) => p._id === initialProductId);
          if (matched) {
            setItems([
              {
                product: matched._id,
                sku: getProductSku(matched),
                title: matched.title,
                image: matched.image,
                size: matched.sizes?.[0] || "",
                color: matched.colors?.[0] || "",
                orderedQuantity: matched.minOrderQuantity || 10,
                unitCost: matched.costPrice || Number((matched.price * 0.6).toFixed(2)),
                availableSizes: matched.sizes || [],
                availableColors: matched.colors || [],
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [initialProductId]);

  // Load products linked to the selected supplier
  useEffect(() => {
    if (selectedSupplierId) {
      const loadSupplierCatalog = async () => {
        const res = await SupplierController.getSupplierProducts(selectedSupplierId);
        if (res.success) {
          setSupplierProducts(res.data);
        }
      };
      loadSupplierCatalog();
    } else {
      setSupplierProducts([]);
    }
  }, [selectedSupplierId]);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s._id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const supplierProductIds = useMemo(
    () => new Set(supplierProducts.map((product) => product._id)),
    [supplierProducts]
  );

  const productPickerBase = useMemo(() => {
    if (productSource === "supplier" && supplierProducts.length > 0) {
      return supplierProducts;
    }

    return [...allProducts].sort((a, b) => {
      const aSupplierMatch = supplierProductIds.has(a._id) ? 1 : 0;
      const bSupplierMatch = supplierProductIds.has(b._id) ? 1 : 0;
      return bSupplierMatch - aSupplierMatch;
    });
  }, [allProducts, productSource, supplierProductIds, supplierProducts]);

  const filteredProductOptions = useMemo(() => {
    const searchTerm = productSearch.trim().toLowerCase();

    if (!searchTerm) {
      return productPickerBase.slice(0, 30);
    }

    return productPickerBase
      .filter((product) =>
        [
          product.title,
          getProductSku(product),
          product.category,
          product.supplierSku,
          product._id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm)
      )
      .slice(0, 30);
  }, [productPickerBase, productSearch]);

  const handleAddItem = (product) => {
    if (!product) return;

    // Check if already in items
    const existingIndex = items.findIndex((i) => i.product === product._id && !i.size);
    if (existingIndex !== -1) {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, orderedQuantity: it.orderedQuantity + 1 }
            : it
        )
      );
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        product: product._id,
        sku: getProductSku(product),
        title: product.title,
        image: product.image,
        size: product.sizes?.[0] || "",
        color: product.colors?.[0] || "",
        orderedQuantity: product.minOrderQuantity || 1,
        unitCost: product.costPrice || Number((product.price * 0.6).toFixed(2)),
        availableSizes: product.sizes || [],
        availableColors: product.colors || [],
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        return {
          ...it,
          [field]: field === "orderedQuantity" || field === "unitCost"
            ? Math.max(0, parseFloat(value) || 0)
            : value,
        };
      })
    );
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.orderedQuantity) || 0;
      const cost = parseFloat(item.unitCost) || 0;
      return sum + qty * cost;
    }, 0);
  }, [items]);

  const cleanShipping = parseFloat(shippingFee) || 0;
  const cleanTax = parseFloat(tax) || 0;
  const cleanDiscount = parseFloat(discount) || 0;
  const totalAmount = Math.max(0, subtotal + cleanShipping + cleanTax - cleanDiscount);

  const handleSubmit = async (targetStatus) => {
    setError("");

    if (!selectedSupplierId) {
      setError("Please select a supplier for this purchase order.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one product item to the purchase order.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.orderedQuantity || it.orderedQuantity <= 0) {
        setError(`Please enter a valid order quantity for item #${i + 1} (${it.title})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplierId: selectedSupplierId,
        items,
        shippingFee: cleanShipping,
        tax: cleanTax,
        discount: cleanDiscount,
        expectedDeliveryDate: expectedDeliveryDate || null,
        notes,
        status: targetStatus, // "draft" or "ordered"
      };

      const res = await PurchaseOrderController.createPO(payload);
      if (res.success) {
        navigate(`/admin/purchase-orders/${res.data._id}`);
      } else {
        setError(res.error || "Failed to create purchase order");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[var(--color-text-muted)]">
        <div className="w-8 h-8 mx-auto border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading purchase order builder...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-surface-soft)] transition text-sm flex items-center gap-2"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("ordered")}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-95 shadow-md transition text-sm flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Place & Send Order
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text-main)] flex items-center gap-3">
          <Package className="w-8 h-8 text-[var(--color-primary)]" />
          Create Purchase Order
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Issue a procurement order to restock warehouse inventory from your suppliers.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Picker Card */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                Select Supplier Partner *
              </span>
              <Link
                to="/admin/suppliers"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                + Register New Supplier
              </Link>
            </div>

            <select
              value={selectedSupplierId}
              onChange={(e) => {
                setSelectedSupplierId(e.target.value);
                setProductSource("all");
                setProductSearch("");
              }}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code}) — {s.phone}
                </option>
              ))}
            </select>

            {selectedSupplier && (
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] text-xs grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[var(--color-text-muted)] block">Contact Person:</span>
                  <span className="font-semibold text-[var(--color-text-main)]">
                    {selectedSupplier.contactPerson || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Phone / Telegram:</span>
                  <span className="font-semibold text-[var(--color-text-main)]">
                    {selectedSupplier.phone} {selectedSupplier.telegram ? `(${selectedSupplier.telegram})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Payment Terms:</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {selectedSupplier.paymentTerms}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Line Items Card */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[var(--color-primary)]" />
                Purchase Line Items ({items.length})
              </span>
            </div>

            {/* Searchable Product Picker */}
            <div className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search product SKU, name, category, or supplier SKU..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] py-2.5 pl-10 pr-4 text-sm font-medium text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] p-1">
                  <button
                    type="button"
                    onClick={() => setProductSource("all")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      productSource === "all"
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                    }`}
                  >
                    All Products
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSupplierId || supplierProducts.length === 0}
                    onClick={() => setProductSource("supplier")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      productSource === "supplier"
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                    }`}
                  >
                    This Supplier ({supplierProducts.length})
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)]">
                {filteredProductOptions.length > 0 ? (
                  <div className="divide-y divide-[var(--color-border)]">
                    {filteredProductOptions.map((product) => {
                      const isLinkedToSupplier = supplierProductIds.has(product._id);
                      const alreadyAdded = items.some((item) => item.product === product._id);

                      return (
                        <div
                          key={product._id}
                          className="flex flex-col gap-3 p-3 transition hover:bg-[var(--color-surface-soft)] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="h-12 w-12 shrink-0 rounded-lg border border-[var(--color-border)] object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)]">
                                <Boxes className="h-5 w-5 text-[var(--color-text-muted)]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-[var(--color-text-main)]">
                                {product.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--color-text-muted)]">
                                <span className="font-mono text-[var(--color-primary)]">
                                  SKU: {getProductSku(product)}
                                </span>
                                <span>{product.category || "Uncategorized"}</span>
                                <span>Stock: {product.stock || 0}</span>
                                {product.supplierSku && (
                                  <span>Supplier SKU: {normalizeSku(product.supplierSku)}</span>
                                )}
                                {isLinkedToSupplier && (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                    Supplier item
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <div className="text-right">
                              <div className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                                Cost
                              </div>
                              <div className="font-mono text-sm font-black text-[var(--color-text-main)]">
                                ${Number(product.costPrice || product.price || 0).toFixed(2)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddItem(product)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {alreadyAdded ? "Add More" : "Add"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Search className="mx-auto mb-2 h-7 w-7 text-[var(--color-text-muted)]/50" />
                    <p className="text-xs font-bold text-[var(--color-text-main)]">
                      {allProducts.length === 0
                        ? "No catalog products found"
                        : "No products match your search"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {allProducts.length === 0
                        ? "Create products first, then add them to a purchase order."
                        : "Try product SKU, name, category, or supplier SKU."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-xl">
                <Boxes className="w-8 h-8 mx-auto text-[var(--color-text-muted)]/50 mb-2" />
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  No items added yet. Select products above to add them to this purchase order.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[var(--color-surface-soft)] border border-[var(--color-border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover border border-[var(--color-border)] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[var(--color-border)] flex items-center justify-center shrink-0">
                          <Boxes className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-[var(--color-text-main)]">
                          {item.title}
                        </div>
                        {item.sku && (
                          <div className="mt-0.5 font-mono text-xs font-black uppercase text-[var(--color-primary)]">
                            SKU: {item.sku}
                          </div>
                        )}
                        {/* Variant pickers if product has sizes/colors */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {item.availableSizes?.length > 0 && (
                            <select
                              value={item.size}
                              onChange={(e) => handleItemChange(index, "size", e.target.value)}
                              className="px-2 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)]"
                            >
                              <option value="">No Size</option>
                              {item.availableSizes.map((s) => (
                                <option key={s} value={s}>
                                  Size: {s}
                                </option>
                              ))}
                            </select>
                          )}
                          {item.availableColors?.length > 0 && (
                            <select
                              value={item.color}
                              onChange={(e) => handleItemChange(index, "color", e.target.value)}
                              className="px-2 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)]"
                            >
                              <option value="">No Color</option>
                              {item.availableColors.map((c) => (
                                <option key={c} value={c}>
                                  Color: {c}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Unit Cost */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.orderedQuantity}
                          onChange={(e) =>
                            handleItemChange(index, "orderedQuantity", e.target.value)
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-sm font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                          Cost ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(index, "unitCost", e.target.value)}
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-sm font-bold text-center"
                        />
                      </div>

                      <div className="w-24 text-right">
                        <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase">
                          Line Total
                        </label>
                        <div className="font-bold text-sm text-[var(--color-text-main)] mt-1">
                          ${((item.orderedQuantity || 0) * (item.unitCost || 0)).toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg transition mt-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cost Summary & Schedule */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Order Total Breakdown
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[var(--color-text-main)]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Shipping / Freight:</span>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-right text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Import Tax / Fees:</span>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-full px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-right text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[var(--color-text-muted)]">
                <span>Discount:</span>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-right text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                <span className="font-bold text-base text-[var(--color-text-main)]">Total PO Amount:</span>
                <span className="font-black text-xl text-[var(--color-primary)]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Date & Notes */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                PO Notes / Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Special delivery instructions, packaging requirements, invoice reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrder;
