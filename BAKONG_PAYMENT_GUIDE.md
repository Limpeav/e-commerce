# BAKONG KHQR Payment Integration - Complete Guide

## 📋 Overview

This document provides a complete guide for the BAKONG KHQR payment integration in your e-commerce system, based on the context diagram implementation.

## 🎯 System Architecture

Based on the Context Diagram, our e-commerce system now includes:

### Core System
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB

### External Integrations
1. ✅ **Google OAuth** - User authentication
2. ✅ **Email Service** - Nodemailer for notifications
3. ✅ **Google Maps API** - Location services
4. ✅ **MongoDB Database** - Data persistence
5. ✅ **Cloudinary** - Image storage
6. ✅ **BAKONG KHQR** - Payment gateway (NEW)

---

## 💳 BAKONG KHQR Payment System

### Backend Components

#### 1. Payment Model (`/models/paymentModel.js`)
- Tracks all payment transactions
- Stores KHQR data (QR code, merchant info, transaction ID)
- Payment status tracking (Pending, Completed, Failed, Expired, Cancelled)
- Integration with Order model

#### 2. Payment Controller (`/controllers/paymentController.js`)
**Key Functions:**
- `generateBakongQR()` - Generate KHQR QR code for payment
- `verifyBakongPayment()` - Webhook for payment verification
- `getPaymentStatus()` - Check payment status
- `getPaymentByOrderId()` - Get payment details for an order
- `cancelPayment()` - Cancel pending payment
- `getAllPayments()` - Admin function to view all payments
- `confirmPayment()` - Admin manual confirmation

#### 3. Payment Routes (`/routes/paymentRoutes.js`)
```
POST   /api/payments/bakong/generate      - Generate QR code
POST   /api/payments/bakong/verify        - Webhook (public)
GET    /api/payments/:paymentId/status    - Check status
GET    /api/payments/order/:orderId       - Get by order
PUT    /api/payments/:paymentId/cancel    - Cancel payment
GET    /api/payments                      - List all (admin)
PUT    /api/payments/:paymentId/confirm   - Confirm (admin)
```

### Frontend Components

#### 1. Payment Service (`/services/paymentService.js`)
API client for payment operations

#### 2. BAKONG Payment Page (`/views/payment/BakongPayment.jsx`)
- QR code display
- Real-time payment status checking
- Countdown timer (5 minutes)
- Payment instructions
- Auto-redirect on success

### Route Configuration
```
/payment/bakong/:orderId - BAKONG payment page
```

---

## 🔧 Configuration

### Environment Variables (Backend `.env`)

Add these to your `/backend/.env`:

```bash
# BAKONG KHQR Payment Configuration
BAKONG_ENABLED=true
BAKONG_ACCOUNT_TYPE=INDIVIDUAL
BAKONG_ACCOUNT_ID=your-account@your-bank
BAKONG_ACCOUNT_USERNAME=Your Account Name
BAKONG_MERCHANT_CITY=Phnom Penh
BAKONG_PHONE_NUMBER=85512345678
BAKONG_TOKEN=your-bakong-api-token
BAKONG_API_URL=https://api-bakong.nbc.gov.kh
USD_TO_KHR_RATE=4100
BAKONG_RECONCILIATION_INTERVAL_MS=15000
BAKONG_RECONCILIATION_BATCH_SIZE=25
```

### Important Notes:

1. **Account type**: Use `INDIVIDUAL` for a normal Bakong account. This is the default.
2. **Account ID**: Use the Bakong account ID that should receive the payment.
3. **API token**: Required for automatic payment confirmation through Bakong's transaction API.
4. **Merchant accounts**: Set `BAKONG_ACCOUNT_TYPE=MERCHANT` and provide the real `BAKONG_MERCHANT_ID` and `BAKONG_ACQUIRING_BANK` issued by the acquiring bank. Placeholder values are rejected.
5. **Exchange rate**: Keep the USD-to-KHR conversion rate current.
6. **Production startup**: The backend refuses to start with Bakong enabled when required production credentials are missing.
7. **Render**: Enter every `sync: false` Bakong value in the Render service environment. Never commit tokens to Git.

---

## 📦 Dependencies

### Backend
```bash
cd backend
npm install qrcode
```

The QRCode package is used to generate QR code images for KHQR payments.

### Frontend
No additional dependencies needed (uses existing axios, react, react-router-dom)

---

## 🚀 Implementation Status

### ✅ Completed Components

#### Backend:
- [x] Payment Model with comprehensive fields
- [x] Payment Controller with all CRUD operations
- [x] Payment Routes with proper authentication
- [x] Order Model updated to include BAKONG_KHQR
- [x] Server.js updated with payment routes
- [x] Environment variables configured

#### Frontend:
- [x] Payment Service API client
- [x] BAKONG Payment page component
- [x] Route configuration
- [x] Real-time status checking
- [x] QR code display
- [x] Payment instructions UI

### 🔄 Integration Points

1. **Checkout Flow**:
   ```
   Cart → Checkout → Create Order → Select Payment Method (BAKONG) → Payment Page → QR Display → Status Checking → Order Confirmation
   ```

2. **Payment Verification**:
   - Frontend polls payment status every 5 seconds
   - Backend independently reconciles pending payments every 15 seconds
   - Optional signed webhook endpoint for callbacks
   - Automatic order update on successful payment
   - Expired unpaid orders are cancelled and reserved stock is restored

---

## 🔐 Security Considerations

### Implemented:
- ✅ JWT authentication for all protected routes
- ✅ User authorization checks
- ✅ Admin-only routes for payment management
- ✅ Payment expiration (5 minutes)
- ✅ Transaction ID tracking
- ✅ Webhook HMAC signature verification
- ✅ Rate limiting
- ✅ Production HTTPS API validation
- ✅ Server-side payment reconciliation
- ✅ Transactional payment/order completion

---

## 📱 User Flow

### Customer Payment Process:

1. **Place Order**: Customer completes checkout
2. **Select Payment**: Choose "BAKONG KHQR" as payment method
3. **Generate QR**: System creates unique QR code
4. **Display QR**: QR code shown with instructions
5. **Scan & Pay**: Customer scans with BAKONG app
6. **Verify Payment**: System checks payment status
7. **Confirmation**: Auto-redirect to order details

### Payment Status Updates:
- **Pending** → Initial state after QR generation
- **Completed** → Payment successful
- **Failed** → Payment failed
- **Expired** → QR code expired (5 min)
- **Cancelled** → User cancelled payment

---

## 🛠️ Testing Guide

### 1. Generate Payment QR Code
```bash
curl -X POST http://localhost:4000/api/payments/bakong/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "YOUR_ORDER_ID"}'
```

### 2. Check Payment Status
```bash
curl -X GET http://localhost:4000/api/payments/PAYMENT_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

The webhook route rejects unsigned requests. Use the server-side Open API
reconciliation flow for normal operation unless your payment provider gives
you a callback contract and shared signing secret.

---

## 🔄 Next Steps

### For Development:
1. Test the complete payment flow
2. Verify QR code generation
3. Test payment status polling
4. Test expiration handling

### For Production:
1. Enter the real account ID and production API token in Render.
2. Deploy and confirm the startup log says Bakong reconciliation is enabled.
3. Make one low-value real payment and verify both Payment and Order become paid.
4. Let one test QR expire and verify the order is cancelled and stock is restored.
5. Use a registered merchant account when the business receives merchant credentials.

---

## 📊 Database Schema

### Payment Collection:
```javascript
{
  _id: ObjectId,
  order: ObjectId (ref: Order),
  user: ObjectId (ref: User),
  paymentMethod: String,
  amount: Number,
  currency: String,
  khqrData: {
    merchantId: String,
    merchantName: String,
    qrCode: String (Base64),
    qrString: String,
    transactionId: String,
    expiresAt: Date
  },
  status: String,
  paymentResult: {
    transactionId: String,
    ackId: String,
    payerName: String,
    payerAccount: String,
    paymentTime: Date,
    responseCode: String,
    responseMessage: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    notes: String
  },
  completedAt: Date,
  failedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### Common Issues:

1. **QR Code Not Generating**:
   - Check BAKONG credentials in .env
   - Verify qrcode package is installed
   - Check console for errors

2. **Payment Status Not Updating**:
   - Verify webhook endpoint is accessible
   - Check payment status polling interval
   - Verify database connection

3. **QR Code Expired**:
   - QR codes expire after 30 minutes
   - User needs to generate new QR code
   - Check system time synchronization

---

## 📝 Additional Resources

### BAKONG Documentation:
- [NBC BAKONG Official](https://bakong.nbc.org.kh/)
- KHQR Technical Specification
- Merchant Integration Guide

### Support Contacts:
- NBC BAKONG Support
- Technical Integration Team

---

## ✅ Checklist for Go-Live

- [ ] BAKONG merchant account activated
- [ ] Production credentials configured
- [ ] Webhook URL registered with BAKONG
- [ ] SSL/HTTPS enabled
- [ ] Error logging configured
- [ ] Payment reconciliation process established
- [ ] Customer support trained
- [ ] Refund process documented
- [ ] Load testing completed
- [ ] Security audit passed

---

**Last Updated**: 2026-01-20
**Version**: 1.0.0
**Status**: Development Ready ✅
