import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPurchaseOrderVoucherSvg,
  createPurchaseOrderVoucherImage,
} from "../utils/purchaseOrderVoucherImage.js";

const purchaseOrder = {
  _id: "64def45664def45664def456",
  poNumber: "PO-20260821-0005",
  createdAt: "2026-08-21T00:00:00.000Z",
  status: "ordered",
  paymentStatus: "unpaid",
  subtotal: 59.99,
  shippingFee: 0,
  tax: 0,
  discount: 0,
  totalAmount: 59.99,
  paidAmount: 0,
  balanceDue: 59.99,
  notes: "",
  items: [
    {
      sku: "PRD-548E9AB5",
      title: "Wooden Baby Changing Table with Storage Shelves",
      size: "ONE SIZE",
      color: "White",
      orderedQuantity: 1,
      receivedQuantity: 0,
      unitCost: 59.99,
      totalCost: 59.99,
    },
  ],
};

const supplier = {
  name: "Furniture Company",
  code: "SUP-0002",
  contactPerson: "Limpeav",
  phone: "016568335",
  telegram: "@lim_peav",
  paymentTerms: "Cash on Delivery",
  address: {
    city: "Phnom Penh",
    province: "Phnom Penh",
    country: "Cambodia",
  },
};

test("buildPurchaseOrderVoucherSvg renders purchase order voucher content", () => {
  const svg = buildPurchaseOrderVoucherSvg({ purchaseOrder, supplier });

  assert.match(svg, /Purchase Order Voucher/);
  assert.match(svg, /PO-20260821-0005/);
  assert.match(svg, /Furniture Company/);
  assert.match(svg, /Wooden Baby Changing Table/);
  assert.match(svg, /Supplier \/ Receiver/);
});

test("createPurchaseOrderVoucherImage returns a PNG buffer", async () => {
  const buffer = await createPurchaseOrderVoucherImage({ purchaseOrder, supplier });

  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.ok(buffer.length > 1000);
});
