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

Update `ecommerce-backend/.env`:

```env
TELEGRAM_BOT_TOKEN=your_real_bot_token
TELEGRAM_CHAT_ID=your_chat_id
LOW_STOCK_THRESHOLD=2
```

## 5. Restart the backend

After changing `.env`, restart the backend server.

## How alerts work

- An alert is sent when stock crosses from above the threshold to at-or-below the threshold.
- Example with threshold `2`: stock `3 -> 2` sends an alert.
- Example with threshold `2`: stock `2 -> 1` does not send another alert.
- If you restock above the threshold, alerts are reset for that product.

## Example message

```text
Low stock alert
Product: Baby Lotion
Stock left: 3
Category: skincare
```
