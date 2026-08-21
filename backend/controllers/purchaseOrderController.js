import mongoose from "mongoose";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import { sendSupplierPurchaseOrderTelegramAlert } from "../utils/sendTelegramMessage.js";

const normalizeSku = (value = "") =>
  String(value || "").trim().toUpperCase();

const getProductSku = (product = {}) =>
  normalizeSku(product.sku) ||
  normalizeSku(product.supplierSku) ||
  (product._id ? `PRD-${product._id.toString().slice(-8).toUpperCase()}` : "");

const describeSupplierTelegramResult = (result = {}) => {
  if (result.sent) return "Telegram sent to supplier";

  switch (result.reason) {
    case "missing-supplier-chat-id":
      return "Telegram not sent: supplier has not connected the bot";
    case "missing-config":
      return "Telegram not sent: supplier bot token is not configured";
    case "already-sent":
      return "Telegram was already sent to supplier";
    default:
      return result.error
        ? `Telegram not sent: ${result.error}`
        : "Telegram not sent";
  }
};

const sendPurchaseOrderToSupplierTelegram = async (poId) => {
  const po = await PurchaseOrder.findById(poId).populate("supplier");
  if (!po) {
    return { sent: false, reason: "purchase-order-not-found" };
  }

  if (po.supplierTelegramOrder?.sentAt) {
    return { sent: true, reason: "already-sent" };
  }

  const lastAttemptAt = new Date();

  try {
    const result = await sendSupplierPurchaseOrderTelegramAlert({
      purchaseOrder: po,
      supplier: po.supplier,
    });

    if (!result.sent) {
      await PurchaseOrder.updateOne(
        { _id: po._id },
        {
          $set: {
            "supplierTelegramOrder.lastAttemptAt": lastAttemptAt,
            "supplierTelegramOrder.error": describeSupplierTelegramResult(result),
          },
        }
      );
      return result;
    }

    await PurchaseOrder.updateOne(
      { _id: po._id },
      {
        $set: {
          "supplierTelegramOrder.sentAt": new Date(),
          "supplierTelegramOrder.lastAttemptAt": lastAttemptAt,
          "supplierTelegramOrder.error": "",
        },
      }
    );

    return result;
  } catch (error) {
    const result = {
      sent: false,
      reason: "telegram-send-failed",
      error: error.message,
    };

    await PurchaseOrder.updateOne(
      { _id: po._id },
      {
        $set: {
          "supplierTelegramOrder.lastAttemptAt": lastAttemptAt,
          "supplierTelegramOrder.error": describeSupplierTelegramResult(result),
        },
      }
    );

    return result;
  }
};

// @desc    Get all purchase orders with filters
// @route   GET /api/admin/purchase-orders
// @access  Private/Admin
export const getPurchaseOrders = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      paymentStatus = "",
      supplier = "",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const matchingSuppliers = await Supplier.find({
        $or: [
          { name: regex },
          { code: regex },
          { contactPerson: regex },
          { phone: regex },
          { email: regex },
        ],
      }).select("_id").lean();
      const supplierIds = matchingSuppliers.map((item) => item._id);

      query.$or = [
        { poNumber: regex },
        { "items.sku": regex },
        { "items.title": regex },
        { notes: regex },
      ];

      if (supplierIds.length > 0) {
        query.$or.push({ supplier: { $in: supplierIds } });
      }
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (supplier && mongoose.Types.ObjectId.isValid(supplier)) {
      query.supplier = supplier;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate("supplier", "name code phone email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PurchaseOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: purchaseOrders,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ message: "Failed to fetch purchase orders", error: error.message });
  }
};

// @desc    Get purchase order by ID
// @route   GET /api/admin/purchase-orders/:id
// @access  Private/Admin
export const getPOById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }

    const po = await PurchaseOrder.findById(id)
      .populate("supplier")
      .populate("createdBy", "name email")
      .populate("receivingLogs.receivedBy", "name")
      .populate("paymentLogs.recordedBy", "name")
      .lean();

    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json({
      success: true,
      data: po,
    });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ message: "Failed to fetch purchase order", error: error.message });
  }
};

// @desc    Create new purchase order
// @route   POST /api/admin/purchase-orders
// @access  Private/Admin
export const createPO = async (req, res) => {
  try {
    const {
      supplierId,
      items,
      shippingFee = 0,
      tax = 0,
      discount = 0,
      expectedDeliveryDate,
      notes = "",
      status = "draft",
    } = req.body;

    if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ message: "Valid supplier is required" });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required in the purchase order" });
    }

    // Validate and build item objects
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: "Invalid product selected in purchase order" });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      const qty = Math.max(1, parseInt(item.orderedQuantity, 10) || 1);
      const unitCost = Math.max(0, parseFloat(item.unitCost) || 0);
      const totalCost = Number((qty * unitCost).toFixed(2));
      subtotal += totalCost;

      validatedItems.push({
        product: product._id,
        sku: getProductSku(product),
        title: item.title || product.title,
        image: item.image || product.image || "",
        size: item.size || "",
        color: item.color || "",
        orderedQuantity: qty,
        receivedQuantity: 0,
        unitCost,
        totalCost,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const cleanShipping = Math.max(0, parseFloat(shippingFee) || 0);
    const cleanTax = Math.max(0, parseFloat(tax) || 0);
    const cleanDiscount = Math.max(0, parseFloat(discount) || 0);
    const totalAmount = Number(
      Math.max(0, subtotal + cleanShipping + cleanTax - cleanDiscount).toFixed(2)
    );

    const po = new PurchaseOrder({
      supplier: supplier._id,
      status: status === "ordered" ? "ordered" : "draft",
      items: validatedItems,
      subtotal,
      shippingFee: cleanShipping,
      tax: cleanTax,
      discount: cleanDiscount,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      orderedAt: status === "ordered" ? new Date() : null,
      notes: notes.trim(),
      createdBy: req.user._id,
    });

    const savedPO = await po.save();
    const telegram = savedPO.status === "ordered"
      ? await sendPurchaseOrderToSupplierTelegram(savedPO._id)
      : null;

    res.status(201).json({
      success: true,
      message: telegram
        ? `Purchase order created successfully. ${describeSupplierTelegramResult(telegram)}.`
        : "Purchase order created successfully",
      data: savedPO,
      telegram,
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ message: "Failed to create purchase order", error: error.message });
  }
};

// @desc    Update purchase order (only draft or ordered)
// @route   PUT /api/admin/purchase-orders/:id
// @access  Private/Admin
export const updatePO = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (po.status === "received") {
      return res.status(400).json({ message: "Cannot edit an already fully received purchase order" });
    }

    const {
      supplierId,
      items,
      shippingFee,
      tax,
      discount,
      expectedDeliveryDate,
      notes,
      status,
    } = req.body;

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      po.supplier = supplierId;
    }

    if (Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      const updatedItems = [];

      for (const item of items) {
        if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
          return res.status(400).json({ message: "Invalid product selected in purchase order" });
        }

        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product} not found` });
        }

        const qty = Math.max(1, parseInt(item.orderedQuantity, 10) || 1);
        const unitCost = Math.max(0, parseFloat(item.unitCost) || 0);
        const totalCost = Number((qty * unitCost).toFixed(2));
        subtotal += totalCost;

        updatedItems.push({
          product: product._id,
          sku: normalizeSku(item.sku) || getProductSku(product),
          title: item.title || product.title,
          image: item.image || product.image || "",
          size: item.size || "",
          color: item.color || "",
          orderedQuantity: qty,
          receivedQuantity: item.receivedQuantity || 0,
          unitCost,
          totalCost,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        });
      }

      po.items = updatedItems;
      po.subtotal = Number(subtotal.toFixed(2));
    }

    if (shippingFee !== undefined) po.shippingFee = Math.max(0, parseFloat(shippingFee) || 0);
    if (tax !== undefined) po.tax = Math.max(0, parseFloat(tax) || 0);
    if (discount !== undefined) po.discount = Math.max(0, parseFloat(discount) || 0);
    if (notes !== undefined) po.notes = notes.trim();
    if (expectedDeliveryDate !== undefined) {
      po.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    }

    const shouldSendSupplierTelegram =
      status === "ordered" &&
      po.status === "draft" &&
      !po.supplierTelegramOrder?.sentAt;

    if (status !== undefined) {
      if (status === "ordered" && po.status === "draft") {
        po.orderedAt = new Date();
      }
      po.status = status;
    }

    po.totalAmount = Number(
      Math.max(0, po.subtotal + po.shippingFee + po.tax - po.discount).toFixed(2)
    );

    const savedPO = await po.save();
    const telegram = shouldSendSupplierTelegram
      ? await sendPurchaseOrderToSupplierTelegram(savedPO._id)
      : null;

    res.json({
      success: true,
      message: telegram
        ? `Purchase order updated successfully. ${describeSupplierTelegramResult(telegram)}.`
        : "Purchase order updated successfully",
      data: savedPO,
      telegram,
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    res.status(500).json({ message: "Failed to update purchase order", error: error.message });
  }
};

// @desc    Receive stock against purchase order and increment inventory
// @route   POST /api/admin/purchase-orders/:id/receive
// @access  Private/Admin
export const receivePOStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, notes = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (po.status === "received") {
      return res.status(400).json({ message: "This purchase order is already fully received" });
    }

    if (po.status === "cancelled") {
      return res.status(400).json({ message: "Cannot receive items on a cancelled purchase order" });
    }

    if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
      return res.status(400).json({ message: "Please specify at least one item quantity to receive" });
    }

    const logItemsReceived = [];

    // Process each item receiving
    for (const recItem of receivedItems) {
      const qtyToReceive = parseInt(recItem.quantity, 10);
      if (!qtyToReceive || qtyToReceive <= 0) continue;

      // Find item in PO
      const poItem = po.items.find(
        (it) => it._id.toString() === recItem.itemId || (it.product.toString() === recItem.product && (it.size || "") === (recItem.size || "") && (it.color || "") === (recItem.color || ""))
      );

      if (!poItem) continue;

      const remainingAllowed = poItem.orderedQuantity - (poItem.receivedQuantity || 0);
      const actualQty = Math.min(qtyToReceive, remainingAllowed);
      if (actualQty <= 0) continue;

      poItem.receivedQuantity = (poItem.receivedQuantity || 0) + actualQty;

      // Update product inventory in DB
      const product = await Product.findById(poItem.product).select("+costPrice");
      if (product) {
        product.stock = (product.stock || 0) + actualQty;

        // If product has sizeStocks and item has size/color
        if (poItem.size && Array.isArray(product.sizeStocks) && product.sizeStocks.length > 0) {
          const sizeIndex = product.sizeStocks.findIndex(
            (ss) =>
              ss.size?.toUpperCase() === poItem.size?.toUpperCase() &&
              (!poItem.color || ss.color === poItem.color)
          );

          if (sizeIndex !== -1) {
            product.sizeStocks[sizeIndex].stock =
              (product.sizeStocks[sizeIndex].stock || 0) + actualQty;
          }
        }

        // Update product cost price if provided
        if (poItem.unitCost && poItem.unitCost > 0) {
          product.costPrice = poItem.unitCost;
        }

        // Update expiry date if supplied
        if (poItem.expiryDate) {
          product.expiryDate = poItem.expiryDate;
        }

        await product.save();
      }

      logItemsReceived.push({
        product: poItem.product,
        itemId: poItem._id,
        sku: poItem.sku,
        title: poItem.title,
        size: poItem.size,
        color: poItem.color,
        quantity: actualQty,
        unitCost: poItem.unitCost,
        expiryDate: poItem.expiryDate,
      });
    }

    if (logItemsReceived.length === 0) {
      return res.status(400).json({ message: "No valid quantities were received" });
    }

    // Add to receiving logs
    po.receivingLogs.push({
      receivedAt: new Date(),
      receivedBy: req.user._id,
      receiverName: req.user.name || "Admin",
      notes: notes.trim(),
      itemsReceived: logItemsReceived,
    });

    // Check if fully received
    const allReceived = po.items.every(
      (item) => (item.receivedQuantity || 0) >= item.orderedQuantity
    );

    po.status = allReceived ? "received" : "partial_received";
    if (allReceived) {
      po.actualDeliveryDate = new Date();
    }

    await po.save();

    res.json({
      success: true,
      message: allReceived
        ? "All stock received successfully and inventory updated!"
        : "Stock partially received and inventory updated!",
      data: po,
    });
  } catch (error) {
    console.error("Error receiving stock:", error);
    res.status(500).json({ message: "Failed to process stock receipt", error: error.message });
  }
};

// @desc    Record payment made to supplier against purchase order
// @route   POST /api/admin/purchase-orders/:id/payment
// @access  Private/Admin
export const recordPOPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method = "Cash", reference = "", notes = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ message: "Please enter a valid payment amount" });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (po.paymentStatus === "paid" || po.balanceDue <= 0) {
      return res.status(400).json({ message: "This purchase order is already fully paid" });
    }

    const actualAmount = Math.min(payAmount, po.balanceDue);

    po.paidAmount = Number(((po.paidAmount || 0) + actualAmount).toFixed(2));
    po.balanceDue = Number(Math.max(0, po.totalAmount - po.paidAmount).toFixed(2));

    if (po.balanceDue === 0) {
      po.paymentStatus = "paid";
    } else {
      po.paymentStatus = "partial";
    }

    po.paymentLogs.push({
      paidAt: new Date(),
      amount: actualAmount,
      method,
      reference: reference.trim(),
      notes: notes.trim(),
      recordedBy: req.user._id,
    });

    await po.save();

    res.json({
      success: true,
      message: `Payment of $${actualAmount.toFixed(2)} recorded successfully!`,
      data: po,
    });
  } catch (error) {
    console.error("Error recording PO payment:", error);
    res.status(500).json({ message: "Failed to record payment", error: error.message });
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/admin/purchase-orders/:id
// @access  Private/Admin
export const deletePO = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (po.status === "received" || po.status === "partial_received") {
      return res.status(400).json({
        message: "Cannot delete a purchase order that has already received stock. Cancel it or adjust inventory instead.",
      });
    }

    await PurchaseOrder.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Purchase order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    res.status(500).json({ message: "Failed to delete purchase order", error: error.message });
  }
};
