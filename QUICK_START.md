# Quick Start Guide - BAKONG KHQR Payment

## 🚀 Getting Started

### 1. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd user-frontend
npm run dev
```

---

## 💳 Test Payment Flow

### Step-by-Step:

1. **Login** → Go to `http://localhost:5173/login`
2. **Add Products** → Browse and add items to cart
3. **Checkout** → Click cart icon → "Proceed to Checkout"
4. **Fill Details** → Enter shipping information
5. **Pin Location** → Click on map to set delivery location
6. **Select Payment** → Choose "BAKONG_KHQR"
7. **Place Order** → Click "Place Order" button
8. **View QR Code** → System redirects to payment page with QR
9. **Simulate Payment** → Use webhook to test (see below)
10. **Confirmation** → Auto-redirects to order details

---

## 🧪 Simulate Payment (Development)

### Option 1: Using curl (Terminal)
```bash
curl -X POST http://localhost:4000/api/payments/bakong/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "COPY_FROM_PAYMENT_PAGE",
    "ackId": "ACK789",
    "status": "SUCCESS",
    "responseCode": "00",
    "payerName": "Test User",
    "payerAccount": "012345678"
  }'
```

### Option 2: Using Postman
- Method: POST
- URL: `http://localhost:4000/api/payments/bakong/verify`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "transactionId": "COPY_FROM_PAYMENT_PAGE",
  "ackId": "ACK789",
  "status": "SUCCESS",
  "responseCode": "00",
  "payerName": "Test User",
  "payerAccount": "012345678"
}
```

**Note**: Copy the Transaction ID from the payment page before sending webhook.

---

## 📋 Key Routes

### User Routes:
- `/` - Home page
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/payment/bakong/:orderId` - BAKONG payment page
- `/orders` - Order history
- `/orders/:id` - Order details

### Admin Routes:
- `/admin` - Admin dashboard
- `/admin/orders` - Manage orders
- `/admin/payments` - View all payments (NEW)

---

## 🔑 API Endpoints

### Payment Management:
```
POST   /api/payments/bakong/generate      - Generate QR
GET    /api/payments/:id/status           - Check status
GET    /api/payments/order/:orderId       - Get payment
PUT    /api/payments/:id/cancel           - Cancel
```

### Order Management:
```
POST   /api/orders                        - Create order
GET    /api/orders/myorders               - User orders
GET    /api/orders/:id                    - Order details
```

---

## ⚙️ Configuration

### BAKONG Settings (`.env`):
```bash
BAKONG_MERCHANT_ID=MERCHANT001        # Change to your ID
BAKONG_MERCHANT_NAME=E-Commerce Store # Your store name
BAKONG_ACQUIRING_BANK=bakong          # Your bank
USD_TO_KHR_RATE=4100                  # Current rate
```

---

## 🐛 Troubleshooting

### Issue: QR Code Not Showing
**Solution**: 
- Check if `qrcode` package is installed
- Verify BAKONG env variables are set
- Check browser console for errors

### Issue: Payment Status Not Updating
**Solution**:
- Verify Transaction ID matches
- Check webhook endpoint is accessible
- Look at backend console logs

### Issue: Order Not Found
**Solution**:
- Ensure you're logged in
- Verify order was created successfully
- Check MongoDB connection

---

## 📊 Payment Status

| Status | Meaning | Action |
|--------|---------|--------|
| Pending | Waiting for payment | Scan QR code |
| Completed | Payment successful | Auto-redirected |
| Failed | Payment failed | Try again |
| Expired | QR code expired (30 min) | Generate new QR |
| Cancelled | User cancelled | Return to order |

---

## 🎯 Quick Checklist

Before testing:
- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] User account created
- [ ] Products available
- [ ] Cart has items

---

## 📞 Support

### Check Logs:
**Backend**: Terminal running backend server
**Frontend**: Browser developer console (F12)
**Database**: MongoDB Compass or terminal

### Common Commands:
```bash
# Check backend logs
cd backend && npm run dev

# Check frontend logs  
cd user-frontend && npm run dev

# View MongoDB
mongosh
use ecommerce
db.payments.find()
```

---

## 🎉 Success Indicators

✅ QR code displays correctly  
✅ Countdown timer shows time remaining  
✅ Payment status checks every 5 seconds  
✅ Webhook successfully updates status  
✅ Auto-redirect to order details  
✅ Order marked as "Paid"  

---

**Ready to test!** 🚀

Start with the User Flow above and use the webhook simulation to complete a test payment.
