import mongoose from "mongoose";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

// @desc    Get all suppliers with search, category, status filters & metrics
// @route   GET /api/admin/suppliers
// @access  Private/Admin
export const getSuppliers = async (req, res) => {
  try {
    const { search = "", status = "", category = "", page = 1, limit = 50 } = req.query;

    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { code: regex },
        { contactPerson: regex },
        { phone: regex },
        { email: regex },
        { "address.city": regex },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.categories = { $in: [category] };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const [suppliers, total] = await Promise.all([
      Supplier.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Supplier.countDocuments(query),
    ]);

    // Enhance suppliers with real-time product count and active POs
    const supplierIds = suppliers.map((s) => s._id);

    const [productCounts, poStats] = await Promise.all([
      Product.aggregate([
        { $match: { supplier: { $in: supplierIds } } },
        { $group: { _id: "$supplier", count: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { supplier: { $in: supplierIds } } },
        {
          $group: {
            _id: "$supplier",
            totalOrders: { $sum: 1 },
            activeOrders: {
              $sum: {
                $cond: [{ $in: ["$status", ["ordered", "partial_received"]] }, 1, 0],
              },
            },
            totalSpend: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
              },
            },
            totalPaid: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, "$paidAmount", 0],
              },
            },
            balanceDue: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, "$balanceDue", 0],
              },
            },
          },
        },
      ]),
    ]);

    const productCountMap = Object.fromEntries(
      productCounts.map((item) => [item._id.toString(), item.count])
    );
    const poStatsMap = Object.fromEntries(
      poStats.map((item) => [item._id.toString(), item])
    );

    const enrichedSuppliers = suppliers.map((supplier) => {
      const id = supplier._id.toString();
      const stats = poStatsMap[id] || {};
      return {
        ...supplier,
        productCount: productCountMap[id] || 0,
        totalOrders: stats.totalOrders || supplier.totalOrders || 0,
        activeOrders: stats.activeOrders || 0,
        totalSpend: stats.totalSpend !== undefined ? stats.totalSpend : supplier.totalSpend || 0,
        outstandingBalance: stats.balanceDue !== undefined ? stats.balanceDue : supplier.outstandingBalance || 0,
      };
    });

    res.json({
      success: true,
      data: enrichedSuppliers,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ message: "Failed to fetch suppliers", error: error.message });
  }
};

// @desc    Get summary metrics for suppliers
// @route   GET /api/admin/suppliers/metrics
// @access  Private/Admin
export const getSupplierMetrics = async (req, res) => {
  try {
    const [totalSuppliers, activeSuppliers, poAggregate] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ status: "active" }),
      PurchaseOrder.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            activePOs: {
              $sum: {
                $cond: [{ $in: ["$status", ["ordered", "partial_received"]] }, 1, 0],
              },
            },
            totalSpend: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
              },
            },
            totalPaid: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, "$paidAmount", 0],
              },
            },
            totalOutstanding: {
              $sum: {
                $cond: [{ $ne: ["$status", "cancelled"] }, "$balanceDue", 0],
              },
            },
          },
        },
      ]),
    ]);

    const stats = poAggregate[0] || {
      totalOrders: 0,
      activePOs: 0,
      totalSpend: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    };

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        totalPOs: stats.totalOrders,
        activePOs: stats.activePOs,
        totalSpend: Number((stats.totalSpend || 0).toFixed(2)),
        totalPaid: Number((stats.totalPaid || 0).toFixed(2)),
        totalOutstanding: Number((stats.totalOutstanding || 0).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier metrics:", error);
    res.status(500).json({ message: "Failed to fetch supplier metrics", error: error.message });
  }
};

// @desc    Get supplier by ID
// @route   GET /api/admin/suppliers/:id
// @access  Private/Admin
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid supplier ID" });
    }

    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const [products, purchaseOrders] = await Promise.all([
      Product.find({ supplier: id }).select("sku title price costPrice stock category image").lean(),
      PurchaseOrder.find({ supplier: id })
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email")
        .lean(),
    ]);

    // Calculate dynamic totals
    const totalSpend = purchaseOrders
      .filter((po) => po.status !== "cancelled")
      .reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    const outstandingBalance = purchaseOrders
      .filter((po) => po.status !== "cancelled")
      .reduce((sum, po) => sum + (po.balanceDue || 0), 0);

    res.json({
      success: true,
      data: {
        ...supplier,
        products,
        purchaseOrders,
        totalOrders: purchaseOrders.length,
        totalSpend: Number(totalSpend.toFixed(2)),
        outstandingBalance: Number(outstandingBalance.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ message: "Failed to fetch supplier", error: error.message });
  }
};

// @desc    Create new supplier
// @route   POST /api/admin/suppliers
// @access  Private/Admin
export const createSupplier = async (req, res) => {
  try {
    const {
      name,
      code,
      contactPerson,
      email,
      phone,
      altPhone,
      telegram,
      address,
      categories,
      paymentTerms,
      bankInfo,
      status,
      rating,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: "Supplier phone is required" });
    }

    // Check code collision if custom code provided
    if (code && code.trim()) {
      const existingCode = await Supplier.findOne({
        code: code.trim().toUpperCase(),
      });
      if (existingCode) {
        return res.status(400).json({ message: `Supplier code ${code.toUpperCase()} is already taken` });
      }
    }

    const supplier = new Supplier({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : undefined,
      contactPerson: contactPerson?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      phone: phone.trim(),
      altPhone: altPhone?.trim() || "",
      telegram: telegram?.trim() || "",
      address: address || {},
      categories: Array.isArray(categories) ? categories : [],
      paymentTerms: paymentTerms || "Cash on Delivery",
      bankInfo: bankInfo || {},
      status: status || "active",
      rating: Number(rating) || 5,
      notes: notes || "",
      createdBy: req.user?._id || null,
    });

    const savedSupplier = await supplier.save();

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: savedSupplier,
    });
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ message: "Failed to create supplier", error: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/admin/suppliers/:id
// @access  Private/Admin
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid supplier ID" });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const {
      name,
      code,
      contactPerson,
      email,
      phone,
      altPhone,
      telegram,
      address,
      categories,
      paymentTerms,
      bankInfo,
      status,
      rating,
      notes,
    } = req.body;

    if (name !== undefined) supplier.name = name.trim();
    if (code !== undefined && code.trim()) {
      const duplicateCode = await Supplier.findOne({
        _id: { $ne: id },
        code: code.trim().toUpperCase(),
      });
      if (duplicateCode) {
        return res.status(400).json({ message: `Supplier code ${code.toUpperCase()} is already taken` });
      }
      supplier.code = code.trim().toUpperCase();
    }
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson.trim();
    if (email !== undefined) supplier.email = email.trim().toLowerCase();
    if (phone !== undefined) supplier.phone = phone.trim();
    if (altPhone !== undefined) supplier.altPhone = altPhone.trim();
    if (telegram !== undefined) supplier.telegram = telegram.trim();
    if (address !== undefined) supplier.address = address;
    if (categories !== undefined) supplier.categories = categories;
    if (paymentTerms !== undefined) supplier.paymentTerms = paymentTerms;
    if (bankInfo !== undefined) supplier.bankInfo = bankInfo;
    if (status !== undefined) supplier.status = status;
    if (rating !== undefined) supplier.rating = Number(rating);
    if (notes !== undefined) supplier.notes = notes;

    const updatedSupplier = await supplier.save();

    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: updatedSupplier,
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ message: "Failed to update supplier", error: error.message });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/admin/suppliers/:id
// @access  Private/Admin
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid supplier ID" });
    }

    // Check if supplier has associated purchase orders
    const poCount = await PurchaseOrder.countDocuments({ supplier: id });
    if (poCount > 0) {
      return res.status(400).json({
        message: `Cannot delete supplier with ${poCount} associated purchase order(s). You can deactivate the supplier instead.`,
      });
    }

    // Unlink any products currently pointing to this supplier
    await Product.updateMany({ supplier: id }, { $set: { supplier: null } });

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ message: "Failed to delete supplier", error: error.message });
  }
};

// @desc    Get products supplied by this supplier
// @route   GET /api/admin/suppliers/:id/products
// @access  Private/Admin
export const getSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ supplier: id })
      .select("sku title price costPrice stock category image sizeStocks supplierSku minOrderQuantity leadTimeDays")
      .lean();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    res.status(500).json({ message: "Failed to fetch supplier products", error: error.message });
  }
};
