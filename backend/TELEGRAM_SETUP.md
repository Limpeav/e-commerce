# Telegram Alerts Setup

This project can send Telegram messages when:

- A product drops to your low-stock threshold.
- A tracked product is near expiry. The default expiry alert window is 60 days, about 2 months.

## 1. Create the bot

Open Telegram and search for `@BotFather`.

Run:

```text
/newbot
```

BotFather will give you a bot token.

You can use one bot for all alerts with `TELEGRAM_BOT_TOKEN`, or use a separate bot/channel for expiry alerts with `TELEGRAM_BOT_TOKEN_5`.

## 2. Start a chat with your bot

Search for your bot in Telegram.

Press `Start` or send any message.

This step is required or Telegram cannot message you.

## 3. Get your chat ID

Open this URL in your browser after replacing `YOUR_BOT_TOKEN`:

```text
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

Look for:

```json
"chat":{"id":123456789}
```

Use that number as `TELEGRAM_CHAT_ID`.

If you do not see anything, send a message to the bot first, then refresh the URL.

## 4. Add env values

Update `backend/.env`:

```env
TELEGRAM_BOT_TOKEN=your_real_bot_token
TELEGRAM_CHAT_ID=your_chat_id
PRODUCT_LOW_STOCK_THRESHOLD=5
VARIANT_LOW_STOCK_THRESHOLD=2

# Product expiry alerts
# Optional: if these are empty, expiry alerts use TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
TELEGRAM_BOT_TOKEN_5=your_expiry_alert_bot_token
TELEGRAM_CHAT_ID_5=your_expiry_alert_chat_id
TELEGRAM_THREAD_ID_5=
PRODUCT_EXPIRY_ALERT_DAYS=60
PRODUCT_EXPIRY_ALERTS_ENABLED=true
PRODUCT_EXPIRY_ALERT_INTERVAL_MS=86400000
PRODUCT_EXPIRY_ALERT_BATCH_SIZE=100
```

## 5. Restart the backend

After changing `.env`, restart the backend server.

## 6. Test expiry alerts manually

Run this from the backend folder:

```bash
npm run alerts:expiry
```

The job sends alerts for `Milk` and `Bath & Skin` products that:

- Have `expiryDate` set.
- Have stock available.
- Expire within `PRODUCT_EXPIRY_ALERT_DAYS`.
- Have not already received an expiry alert for the current expiry date.

## How alerts work

- Cash on Delivery orders reserve stock first; low-stock alerts are sent when the seller confirms the order as Processing.
- Bakong KHQR orders reserve stock first; low-stock alerts are sent when payment is completed.
- Product-level alerts are sent when total product stock is at-or-below `5` and that product has not already been alerted.
- Variant-level alerts are sent when a size/color row is at-or-below `2` and that variant has not already been alerted.
- If you restock above the matching threshold, alerts are reset for that product or variant.
- Expiry alerts run once when the backend starts and then every `PRODUCT_EXPIRY_ALERT_INTERVAL_MS`.
- If an admin changes a product expiry date, the expiry alert flag resets so the new date can alert again.

## Example message

```text
LOW STOCK ALERT

Product ID: 64def456
Type: Product stock
Product: Baby Lotion
Category: Skincare
Stock Left: 5
```

```text
LOW STOCK ALERT

Product ID: 64abc123
Type: Variant stock
Product: Baby Shirt
Category: Clothing
Variant: M / Black
Stock Left: 2
```

```text
PRODUCT EXPIRY ALERT

Product ID: 64milk123
Product: Baby Formula
Category: Milk
Stock Available: 18
Expiry Date: Sep 29, 2026
Time Left: 60 days left
Price: $24.00

Move this item to promotion or discount it before expiry.
```
