import test from "node:test";
import assert from "node:assert/strict";
import {
    buildProductExpiryMessage,
    buildLowStockMessage,
    buildOrderReceiptCaption,
    buildPaymentTelegramMessage,
} from "../utils/sendTelegramMessage.js";

test("buildPaymentTelegramMessage formats and escapes a confirmed KHQR payment", () => {
    const message = buildPaymentTelegramMessage({
        orderId: "ABC12345",
        customerName: "Sam <Store>",
        amount: 12.5,
        currency: "USD",
        transactionId: "TXN&123",
        paymentTime: "2026-06-25T03:00:00.000Z",
    });

    assert.match(message, /KHQR PAYMENT SUCCESSFUL/);
    assert.match(message, /Sam &lt;Store&gt;/);
    assert.match(message, /\$12\.50 USD/);
    assert.match(message, /TXN&amp;123/);
    assert.match(message, /Paid/);
    assert.doesNotMatch(message, /Payer/);
});

test("buildPaymentTelegramMessage formats KHR without decimals", () => {
    const message = buildPaymentTelegramMessage({
        orderId: "ABC12345",
        amount: 51250,
        currency: "KHR",
    });

    assert.match(message, /51,250 KHR/);
});

test("buildLowStockMessage formats variant stock alerts", () => {
    const message = buildLowStockMessage({
        productId: "64abc123",
        stockType: "Variant stock",
        title: "Baby Shirt",
        category: "Clothing",
        variant: "M / Black",
        stock: 2,
    });

    assert.equal(
        message,
        [
            "<b>LOW STOCK ALERT</b>",
            "",
            "<b>Product ID</b>: <code>64abc123</code>",
            "<b>Type</b>: Variant stock",
            "<b>Product</b>: Baby Shirt",
            "<b>Category</b>: Clothing",
            "<b>Variant</b>: M / Black",
            "<b>Stock Left</b>: 2",
            "",
            "<i>Restock this item soon.</i>",
        ].join("\n")
    );
});

test("buildLowStockMessage formats product stock alerts without variant", () => {
    const message = buildLowStockMessage({
        productId: "64def456",
        stockType: "Product stock",
        title: "Baby Lotion",
        category: "Skincare",
        stock: 5,
    });

    assert.equal(
        message,
        [
            "<b>LOW STOCK ALERT</b>",
            "",
            "<b>Product ID</b>: <code>64def456</code>",
            "<b>Type</b>: Product stock",
            "<b>Product</b>: Baby Lotion",
            "<b>Category</b>: Skincare",
            "<b>Stock Left</b>: 5",
            "",
            "<i>Restock this item soon.</i>",
        ].join("\n")
    );
});

test("buildProductExpiryMessage formats near-expiry promotion alerts", () => {
    const message = buildProductExpiryMessage({
        productId: "64milk123",
        title: "Baby Formula <Stage 1>",
        category: "Milk",
        expiryDate: "2026-09-29T00:00:00.000Z",
        daysUntilExpiry: 60,
        stock: 18,
        price: 24,
        discountPrice: 19.99,
    });

    assert.equal(
        message,
        [
            "<b>PRODUCT EXPIRY ALERT</b>",
            "",
            "<b>Product ID</b>: <code>64milk123</code>",
            "<b>Product</b>: Baby Formula &lt;Stage 1&gt;",
            "<b>Category</b>: Milk",
            "<b>Stock Available</b>: 18",
            "<b>Expiry Date</b>: Sep 29, 2026",
            "<b>Time Left</b>: 60 days left",
            "<b>Price</b>: $24.00",
            "<b>Current Promotion Price</b>: $19.99",
            "",
            "<i>Move this item to promotion or discount it before expiry.</i>",
        ].join("\n")
    );
});

test("buildOrderReceiptCaption formats receipt summary without item titles", () => {
    const message = buildOrderReceiptCaption({
        orderId: "A98869EC",
        customerName: "Hour <Test>",
        customerPhone: "016568335",
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        totalPrice: 10.13,
        orderItems: [
            {
                name: "Travel Bag & Cover",
                quantity: 1,
                price: 7.99,
                color: "Black",
                size: "M",
            },
        ],
    });

    assert.equal(
        message,
        [
            "<b>ORDER RECEIPT</b>",
            "",
            "<b>Order</b>: <code>A98869EC</code>",
            "<b>Customer</b>: Hour &lt;Test&gt;",
            "<b>Phone</b>: 016568335",
            "<b>Payment</b>: Cash on Delivery",
            "<b>Status</b>: Pending",
            "<b>Total</b>: $10.13",
        ].join("\n")
    );
    assert.doesNotMatch(message, /Travel Bag/);
});
