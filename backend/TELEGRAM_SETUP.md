# Telegram Low Stock Alerts Setup

This project can send Telegram messages when a product drops to your low-stock threshold.

## 1. Create the bot

Open Telegram and search for `@BotFather`.

Run:

```text
/newbot
```

BotFather will give you a bot token. Put that token into `TELEGRAM_BOT_TOKEN` in `.env`.

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
```

## 5. Restart the backend

After changing `.env`, restart the backend server.

## How alerts work

- Product-level alerts are sent when total product stock crosses from above `5` to at-or-below `5`.
- Variant-level alerts are sent when a size/color row crosses from above `2` to at-or-below `2`.
- Example for a variant row: stock `3 -> 2` sends an alert.
- Example for a variant row: stock `2 -> 1` does not send another low-stock alert.
- If you restock above the matching threshold, alerts are reset for that product or variant.

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
