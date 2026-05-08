const splitTextLines = (context, text, maxWidth) => {
    const words = String(text || "N/A").split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
            currentLine = nextLine;
            return;
        }

        lines.push(currentLine);
        currentLine = word;
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length ? lines : ["N/A"];
};

const fillRoundRect = (context, x, y, width, height, radius) => {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
};

export const createReceiptImageBlob = ({
    displayOrderId,
    customerName,
    customerPhone,
    paymentMethod,
    fullAddress,
    subtotal,
    deliveryFee,
    taxPrice,
    displayedTotal,
    formatCurrency,
}) => {
    const logicalWidth = 1000;
    const padding = 48;
    const rightEdge = logicalWidth - padding;
    const valueMaxWidth = 560;
    const details = [
        ["Order ID", `#${displayOrderId}`],
        ["Customer Name", customerName],
        ["Phone Number", customerPhone],
        ["Payment Method", paymentMethod || "N/A"],
        ["Address", fullAddress],
    ];

    const measuringCanvas = document.createElement("canvas");
    const measuringContext = measuringCanvas.getContext("2d");
    measuringContext.font = "700 20px Inter, Arial, sans-serif";

    const detailRows = details.map(([label, value]) => {
        const lines = splitTextLines(measuringContext, value, valueMaxWidth);
        return {
            label,
            lines,
            height: Math.max(44, lines.length * 30),
        };
    });

    const logicalHeight =
        120 +
        detailRows.reduce((total, row) => total + row.height, 0) +
        38 +
        44 * 3 +
        104 +
        42;
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;
    const context = canvas.getContext("2d");
    context.scale(scale, scale);

    context.fillStyle = "#f7f2ec";
    context.fillRect(0, 0, logicalWidth, logicalHeight);

    context.fillStyle = "#ffffff";
    fillRoundRect(context, 24, 24, logicalWidth - 48, logicalHeight - 48, 18);

    context.fillStyle = "#78937d";
    context.font = "400 34px Georgia, serif";
    context.fillText("$", padding, 84);
    context.fillStyle = "#2f332f";
    context.font = "800 28px Georgia, serif";
    context.fillText("Order Summary", padding + 42, 82);

    let y = 142;
    detailRows.forEach((row) => {
        context.fillStyle = "#737a72";
        context.font = "400 21px Inter, Arial, sans-serif";
        context.textAlign = "left";
        context.fillText(row.label, padding, y);

        context.fillStyle = "#2f332f";
        context.font = "700 20px Inter, Arial, sans-serif";
        context.textAlign = "right";
        row.lines.forEach((line, index) => {
            context.fillText(line, rightEdge, y + index * 30);
        });

        y += row.height;
    });

    context.strokeStyle = "#ddd5cc";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(padding, y + 8);
    context.lineTo(rightEdge, y + 8);
    context.stroke();
    y += 52;

    const totalRows = [
        ["Subtotal:", formatCurrency(subtotal)],
        ["Delivery Fee:", formatCurrency(deliveryFee)],
        ["Tax:", formatCurrency(taxPrice)],
    ];

    totalRows.forEach(([label, value]) => {
        context.textAlign = "left";
        context.fillStyle = "#737a72";
        context.font = "400 21px Inter, Arial, sans-serif";
        context.fillText(label, padding, y);
        context.textAlign = "right";
        context.fillStyle = "#2f332f";
        context.font = "700 21px Inter, Arial, sans-serif";
        context.fillText(value, rightEdge, y);
        y += 44;
    });

    context.fillStyle = "#eee9e3";
    fillRoundRect(context, padding, y + 2, logicalWidth - padding * 2, 76, 14);
    context.textAlign = "left";
    context.fillStyle = "#2f332f";
    context.font = "800 28px Inter, Arial, sans-serif";
    context.fillText("Total:", padding + 24, y + 50);
    context.textAlign = "right";
    context.fillText(formatCurrency(displayedTotal), rightEdge - 24, y + 50);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }

            reject(new Error("Failed to create receipt image"));
        }, "image/png");
    });
};
