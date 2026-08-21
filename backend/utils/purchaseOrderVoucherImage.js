import sharp from "sharp";

const WIDTH = 1120;
const MIN_HEIGHT = 1260;
const PAGE_X = 54;
const PAGE_W = 1012;
const INK = "#111827";
const MUTED = "#4b5563";
const BORDER = "#d1d5db";
const LIGHT_BORDER = "#e5e7eb";

const escapeXml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US");
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

const getItemSku = (item = {}) =>
  String(
    item.sku ||
      item.supplierSku ||
      (item.product?._id ? `PRD-${String(item.product._id).slice(-8).toUpperCase()}` : "") ||
      (item.product ? `PRD-${String(item.product).slice(-8).toUpperCase()}` : "")
  ).toUpperCase();

const wrapText = (value, maxChars) => {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let current = "";

  words.forEach((word) => {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maxChars) {
        lines.push(word.slice(index, index + maxChars));
      }
      return;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      return;
    }

    current = next;
  });

  if (current) lines.push(current);
  return lines;
};

const text = ({
  x,
  y,
  value,
  size = 16,
  weight = 400,
  fill = INK,
  anchor = "start",
  family = "Arial, Helvetica, sans-serif",
}) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(value)}</text>`;

const textLines = ({
  x,
  y,
  lines,
  size = 16,
  weight = 400,
  fill = INK,
  lineHeight = size + 6,
  anchor = "start",
}) =>
  lines
    .map((line, index) =>
      text({
        x,
        y: y + index * lineHeight,
        value: line,
        size,
        weight,
        fill,
        anchor,
      })
    )
    .join("");

const rect = ({ x, y, width, height, radius = 7 }) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#ffffff" stroke="${BORDER}" stroke-width="1.5"/>`;

const line = ({ x1, y1, x2, y2, stroke = INK, width = 2 }) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;

const row = ({ label, value, x, y, w, bold = true }) =>
  [
    text({ x, y, value: label, size: 17, fill: label === "Total" ? INK : MUTED }),
    text({
      x: x + w,
      y,
      value,
      size: label === "Total" ? 20 : 17,
      weight: bold ? 800 : 400,
      anchor: "end",
    }),
  ].join("");

export const buildPurchaseOrderVoucherSvg = ({ purchaseOrder, supplier } = {}) => {
  const po = purchaseOrder || {};
  const resolvedSupplier = supplier || po.supplier || {};
  const supplierAddress = [
    resolvedSupplier.address?.street,
    resolvedSupplier.address?.city,
    resolvedSupplier.address?.province,
    resolvedSupplier.address?.country,
  ]
    .filter(Boolean)
    .join(", ");
  const items = Array.isArray(po.items) ? po.items : [];
  const poNumber = po.poNumber || po._id || "N/A";

  let svg = "";

  svg += text({
    x: PAGE_X,
    y: 68,
    value: "Purchase Order Voucher",
    size: 30,
    weight: 800,
    family: "Georgia, 'Times New Roman', serif",
  });
  svg += text({ x: PAGE_X, y: 110, value: poNumber, size: 24, weight: 800 });
  svg += text({ x: PAGE_X, y: 136, value: `Created: ${formatDate(po.createdAt)}`, size: 16, fill: MUTED });

  svg += row({ label: "Order Status", value: getStatusLabel(po.status), x: 805, y: 58, w: 260 });
  svg += row({ label: "Payment", value: getPaymentStatusLabel(po.paymentStatus), x: 805, y: 86, w: 260 });
  svg += line({ x1: 805, y1: 104, x2: 1065, y2: 104, width: 3 });
  svg += row({ label: "Total", value: formatMoney(po.totalAmount), x: 805, y: 132, w: 260 });
  svg += line({ x1: PAGE_X, y1: 160, x2: PAGE_X + PAGE_W, y2: 160, width: 3 });

  svg += rect({ x: PAGE_X, y: 182, width: 620, height: 146 });
  svg += text({ x: 68, y: 211, value: "SUPPLIER", size: 14, weight: 800, fill: "#374151", family: "Georgia, 'Times New Roman', serif" });
  svg += text({ x: 68, y: 244, value: `${resolvedSupplier.name || "Unknown Supplier"}${resolvedSupplier.code ? ` (${resolvedSupplier.code})` : ""}`, size: 17, weight: 800 });
  svg += text({ x: 68, y: 266, value: resolvedSupplier.contactPerson ? `Contact: ${resolvedSupplier.contactPerson}` : "", size: 16, fill: MUTED });
  svg += text({
    x: 68,
    y: 288,
    value: `${resolvedSupplier.phone || ""}${resolvedSupplier.telegram ? ` | Telegram: ${resolvedSupplier.telegram}` : ""}`,
    size: 16,
  });
  svg += textLines({ x: 68, y: 310, lines: wrapText(supplierAddress, 68).slice(0, 1), size: 16 });

  svg += rect({ x: 696, y: 182, width: 370, height: 146 });
  svg += text({ x: 710, y: 211, value: "PAYMENT SUMMARY", size: 14, weight: 800, fill: "#374151", family: "Georgia, 'Times New Roman', serif" });
  svg += row({ label: "Terms", value: resolvedSupplier.paymentTerms || "Cash on Delivery", x: 710, y: 247, w: 340 });
  svg += row({ label: "Paid", value: formatMoney(po.paidAmount), x: 710, y: 275, w: 340 });
  svg += row({ label: "Balance Due", value: formatMoney(po.balanceDue), x: 710, y: 303, w: 340 });

  const tableRows = items.map((item) => {
    const productLines = wrapText(item.title || "Item", 34).slice(0, 3);
    const skuLines = wrapText(getItemSku(item), 10).slice(0, 2);
    const variantLines = wrapText([item.size, item.color].filter(Boolean).join(" / ") || "Standard", 16).slice(0, 3);
    const lineCount = Math.max(productLines.length, skuLines.length, variantLines.length, 1);

    return {
      item,
      productLines,
      skuLines,
      variantLines,
      height: Math.max(62, 22 + lineCount * 23),
    };
  });
  const itemsHeight = Math.max(180, 82 + tableRows.reduce((sum, item) => sum + item.height, 0));
  const itemsY = 350;

  svg += rect({ x: PAGE_X, y: itemsY, width: PAGE_W, height: itemsHeight });
  svg += text({ x: 68, y: itemsY + 31, value: "ITEMS", size: 14, weight: 800, fill: "#374151", family: "Georgia, 'Times New Roman', serif" });
  const headerY = itemsY + 78;
  svg += text({ x: 78, y: headerY, value: "#", size: 13, weight: 800 });
  svg += text({ x: 102, y: headerY, value: "SKU", size: 13, weight: 800 });
  svg += text({ x: 226, y: headerY, value: "PRODUCT", size: 13, weight: 800 });
  svg += text({ x: 582, y: headerY, value: "VARIANT", size: 13, weight: 800 });
  svg += text({ x: 748, y: headerY, value: "ORDERED", size: 13, weight: 800, anchor: "middle" });
  svg += text({ x: 836, y: headerY, value: "RECEIVED", size: 13, weight: 800, anchor: "middle" });
  svg += text({ x: 946, y: headerY - 10, value: "UNIT", size: 13, weight: 800, anchor: "middle" });
  svg += text({ x: 946, y: headerY + 8, value: "COST", size: 13, weight: 800, anchor: "middle" });
  svg += text({ x: 1048, y: headerY, value: "AMOUNT", size: 13, weight: 800, anchor: "end" });
  svg += line({ x1: 68, y1: headerY + 22, x2: 1048, y2: headerY + 22, width: 2 });

  let rowY = headerY + 46;
  tableRows.forEach((entry, index) => {
    const { item } = entry;
    svg += text({ x: 78, y: rowY, value: String(index + 1), size: 15 });
    svg += textLines({ x: 102, y: rowY, lines: entry.skuLines, size: 15, weight: 800, lineHeight: 21 });
    svg += textLines({ x: 226, y: rowY, lines: entry.productLines, size: 16, weight: 800, lineHeight: 22 });
    svg += textLines({ x: 582, y: rowY, lines: entry.variantLines, size: 16, lineHeight: 22 });
    svg += text({ x: 748, y: rowY, value: Number(item.orderedQuantity || 0), size: 16, anchor: "middle" });
    svg += text({ x: 836, y: rowY, value: Number(item.receivedQuantity || 0), size: 16, anchor: "middle" });
    svg += text({ x: 962, y: rowY, value: formatMoney(item.unitCost), size: 16, anchor: "end" });
    svg += text({ x: 1048, y: rowY, value: formatMoney(item.totalCost), size: 16, anchor: "end" });
    svg += line({ x1: 68, y1: rowY + entry.height - 24, x2: 1048, y2: rowY + entry.height - 24, stroke: LIGHT_BORDER, width: 1.5 });
    rowY += entry.height;
  });

  const lowerY = itemsY + itemsHeight + 38;
  svg += rect({ x: PAGE_X, y: lowerY, width: 620, height: 202 });
  svg += text({ x: 68, y: lowerY + 31, value: "NOTES", size: 14, weight: 800, fill: "#374151", family: "Georgia, 'Times New Roman', serif" });
  svg += textLines({
    x: 68,
    y: lowerY + 62,
    lines: wrapText(po.notes || "No notes", 68).slice(0, 5),
    size: 16,
    lineHeight: 24,
  });

  svg += rect({ x: 696, y: lowerY, width: 370, height: 202 });
  svg += text({ x: 710, y: lowerY + 31, value: "TOTALS", size: 14, weight: 800, fill: "#374151", family: "Georgia, 'Times New Roman', serif" });
  svg += row({ label: "Subtotal", value: formatMoney(po.subtotal), x: 710, y: lowerY + 65, w: 340 });
  svg += row({ label: "Shipping", value: formatMoney(po.shippingFee), x: 710, y: lowerY + 93, w: 340 });
  svg += row({ label: "Tax / Fees", value: formatMoney(po.tax), x: 710, y: lowerY + 121, w: 340 });
  svg += row({ label: "Discount", value: `-${formatMoney(po.discount)}`, x: 710, y: lowerY + 149, w: 340 });
  svg += line({ x1: 710, y1: lowerY + 164, x2: 1048, y2: lowerY + 164, width: 3 });
  svg += row({ label: "Total", value: formatMoney(po.totalAmount), x: 710, y: lowerY + 193, w: 340 });

  const signatureY = lowerY + 252;
  [
    { x1: PAGE_X, x2: 372, labelX: 213, label: "Prepared By" },
    { x1: 400, x2: 718, labelX: 559, label: "Approved By" },
    { x1: 746, x2: 1066, labelX: 906, label: "Supplier / Receiver" },
  ].forEach((signature) => {
    svg += line({ x1: signature.x1, y1: signatureY, x2: signature.x2, y2: signatureY, width: 2 });
    svg += text({ x: signature.labelX, y: signatureY + 25, value: signature.label, size: 16, weight: 800, anchor: "middle" });
  });

  const height = Math.max(MIN_HEIGHT, signatureY + 120);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${svg}
  </svg>`;
};

export const createPurchaseOrderVoucherImage = async ({ purchaseOrder, supplier } = {}) => {
  const svg = buildPurchaseOrderVoucherSvg({ purchaseOrder, supplier });
  return sharp(Buffer.from(svg)).png().toBuffer();
};
