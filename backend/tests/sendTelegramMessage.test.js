import test from "node:test";
import assert from "node:assert/strict";
import {
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

test("buildOrderReceiptCaption includes ordered items and escapes user content", () => {
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

    assert.match(message, /ORDER RECEIPT/);
    assert.match(message, /Hour &lt;Test&gt;/);
    assert.match(message, /Travel Bag &amp; Cover/);
    assert.match(message, /Size M, Color Black/);
    assert.match(message, /Qty 1 x \$7\.99/);
    assert.match(message, /Total<\/b>: \$10\.13/);
});
