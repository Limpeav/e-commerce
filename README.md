# 🍼 Cherish Baby — AI-Powered E-Commerce Platform for Baby Products

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19.x-blue.svg?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple.svg?style=flat-square&logo=vite)](https://vitejs.dev)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B.svg?style=flat-square&logo=flutter)](https://flutter.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-green.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com)
[![Bakong KHQR](https://img.shields.io/badge/Payment-NBC%20Bakong%20KHQR-red.svg?style=flat-square)](https://bakong.nbc.gov.kh)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-black.svg?style=flat-square&logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-ISC-brightgreen.svg?style=flat-square)](#license)

> **Design and Development of an E-Commerce Platform for Baby Products with AI-Based Customer Sentiment Analysis**  
> *Case Study: PCHUNCHANACSAMAI CO., LTD. (Cherish Baby Store)*  
> Production Domain: [cherishbabykhstore.store](https://cherishbabykhstore.store)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [🤖 AI-Powered Bilingual Sentiment Analysis](#1-ai-powered-bilingual-sentiment-analysis)
  - [🇰🇭 NBC Bakong KHQR Payment & Telegram Alerts](#2-nbc-bakong-khqr-payment--telegram-alerts)
  - [🗺️ Google Maps Location Pinning & Geocoding](#3-google-maps-location-pinning--geocoding)
  - [📱 Cross-Platform Mobile App (Flutter)](#4-cross-platform-mobile-app-flutter)
  - [🛒 Customer Web Storefront](#5-customer-web-storefront)
  - [📊 Comprehensive Admin Management Dashboard](#6-comprehensive-admin-management-dashboard)
  - [📦 Inventory, Batches & Supplier Purchase Orders](#7-inventory-batches--supplier-purchase-orders)
  - [🌐 Bilingual Localization (Khmer & English)](#8-bilingual-localization-khmer--english)
  - [⚡ Real-Time Socket.io Synchronization](#9-real-time-socketio-synchronization)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started & Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. User Web Frontend Setup](#2-user-web-frontend-setup)
  - [3. Admin Web Frontend Setup](#3-admin-web-frontend-setup)
  - [4. Flutter Mobile App Setup](#4-flutter-mobile-app-setup)
- [Environment Variables Guide](#-environment-variables-guide)
- [Testing & Payment Simulation](#-testing--payment-simulation)
- [Deployment Guide](#-deployment-guide)
- [Academic Research & Case Study](#-academic-research--case-study)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

Ensuring infant safety, product authenticity, and customer trust is paramount when shopping for baby essentials (such as infant formula, diapers, skincare, feeding accessories, and educational toys). Traditional e-commerce platforms often fail to capture subtle feedback or alert business owners in time when baby products receive complaints regarding irritations, defective seals, or delivery delays.

**Cherish Baby** is an enterprise-grade omnichannel e-commerce platform developed as an applied research project for **PCHUNCHANACSAMAI CO., LTD.**. It integrates:
1. **AI Natural Language Processing (NLP)** to classify customer reviews into Positive, Neutral, or Negative sentiments in real-time across both Khmer and English.
2. **National Bank of Cambodia (NBC) Bakong KHQR** dynamic payment standards with automated reconciliation, webhooks, and Telegram audit notifications.
3. **Interactive Google Maps Pinning** enabling customers to drop exact delivery pins across Cambodia.
4. **End-to-End Supply Chain Management** including batch tracking, supplier purchase orders (PO), and automated 60-day product expiry warning alerts.
5. **Omnichannel Access**: Customer Web (`React 19`), Admin Web (`React 19`), and Cross-Platform Native Mobile App (`Flutter 3.x` with BLoC).

---

## 🏛 System Architecture

The project adheres to a clean **MVC (Model-View-Controller)** pattern across both the backend and frontend client architectures.

```mermaid
flowchart TD
    subgraph Clients["Omnichannel Clients"]
        UW["User Web (React 19 + Vite)\nPort: 5173"]
        AW["Admin Web (React 19 + Vite)\nPort: 5174"]
        MA["Mobile App (Flutter / Dart)\niOS & Android"]
    end

    subgraph Gateway["API & Security Layer"]
        CORS["CORS & Origin Validation"]
        SEC["Helmet + Mongo Sanitize + Rate Limiter"]
        AUTH["JWT & Google OAuth 2.0"]
    end

    subgraph Backend["Express 5 MVC Backend (Port: 4000)"]
        Routes["Express Routes (/api/...)"]
        Controllers["Controllers Layer"]
        Services["Services Layer (Business Logic)"]
        Models["Mongoose Models"]
        
        subgraph CoreEngines["Core Automated Engines"]
            AI["AI Sentiment Analysis Engine\n(Khmer & English NLP)"]
            BakongSvc["Bakong KHQR Engine &\nReconciliation Service"]
            ExpirySvc["60-Day Expiry Alert Service"]
            SupportSvc["Support Ticket Workflow Engine"]
        end
    end

    subgraph Realtime["Real-time Streaming"]
        SIO["Socket.io Server\n(Order status, alerts, notifications)"]
    end

    subgraph External["External Integrations"]
        DB[(MongoDB Database)]
        NBC["NBC Bakong Payment Gateway"]
        TG["Telegram Bot Alerts (Topics)"]
        GMaps["Google Maps & Places API"]
        Cloudinary["Cloudinary + Sharp Image CDN"]
        Resend["Resend / Gmail SMTP"]
    end

    UW --> Gateway
    AW --> Gateway
    MA --> Gateway

    Gateway --> CORS --> SEC --> AUTH --> Routes
    Routes --> Controllers --> Services --> Models --> DB
    Services --> CoreEngines

    BakongSvc <--> NBC
    BakongSvc --> TG
    ExpirySvc --> TG
    AI --> Models
    Backend <--> SIO
    SIO -.-> Clients
    Services --> Cloudinary
    Services --> Resend
    Clients <--> GMaps
```

---

## 🚀 Key Features

### 1. 🤖 AI-Powered Bilingual Sentiment Analysis
- **Custom Dual-Language NLP Engine**: Tokenizes and analyzes feedback in both **Khmer (ភាសាខ្មែរ)** and **English**.
- **Lexical & Contextual Analysis**: Detects intensifiers (e.g., *ណាស់, really*), dampeners (*បន្តិច, somewhat*), and negators (*មិន, not, never*).
- **Automated Score Blending**: Blends star ratings with textual sentiment polarity to calculate a normalized score `[-3.0 to +3.0]`, categorizing reviews into `Positive`, `Neutral`, or `Negative`.
- **Admin Satisfaction Radar**: Calculates satisfaction rates, category-level sentiment breakdown, recurring negative issues, and an **Action Priority Score** to flag defective product batches immediately.

### 2. 🇰🇭 NBC Bakong KHQR Payment & Telegram Alerts
- **Dynamic KHQR Generation**: Implements official `bakong-khqr` standards for instant payments in USD and KHR (`USD_TO_KHR_RATE=4100`).
- **Real-Time Payment Polling & Webhooks**: Supports background reconciliation (`bakongReconciliationService`), instant client status checks, and signed webhooks.
- **Deep-Linking**: Direct integration to trigger local mobile banking apps (Bakong, ABA, ACLEDA).
- **Telegram Transaction Bot**: Sends instant real-time receipts and audit messages to dedicated Telegram forum topics/groups upon successful checkout.

### 3. 🗺️ Google Maps Location Pinning & Geocoding
- **Interactive Pin-Drop**: Customers can pinpoint their exact delivery location on Google Maps with drag-and-drop marker support.
- **Reverse Geocoding**: Automatically translates geographic coordinates (latitude/longitude) into clean street addresses.
- **Store Locator**: Interactive map view highlighting physical store branches with directions and operating hours.

### 4. 📱 Cross-Platform Mobile App (Flutter)
- **State-of-the-Art Architecture**: Built using `flutter_bloc` and dependency injection (`ServiceLocator`).
- **Native Hardware Features**: GPS geolocating (`geolocator`), camera / gallery access (`gal`), and native QR rendering (`qr_flutter`).
- **Offline Persistence**: Secure cache with `shared_preferences` for tokens, cart contents, and customer preferences.
- **Adaptive Dark / Light Themes**: Premium color palette matching iOS and Material 3 design systems.

### 5. 🛒 Customer Web Storefront
- **React 19 & Vite**: Ultra-fast performance with code-splitting chunks for vendors, motion, icons, and i18n.
- **Framer Motion Micro-Animations**: Smooth page transitions, animated cart badges, and modern glassmorphism modals.
- **Cart & Wishlist**: Real-time optimistic updates synchronized with backend storage.
- **Order Tracking Timeline**: Visual milestone tracker from `Pending` → `Processing` → `Shipped` → `Delivered`.

### 6. 📊 Comprehensive Admin Management Dashboard
- **Executive Analytics**: Real-time sales volume, revenue charts, order counts, and customer growth trends.
- **Order Lifecycle Management**: Update order statuses, approve cancellation requests, and upload proof of delivery.
- **Review Moderation**: View all customer feedback alongside AI sentiment tags and drill into product ratings.
- **Support Ticket Resolution**: Built-in helpdesk ticket manager with status automation.

### 7. 📦 Inventory, Batches & Supplier Purchase Orders
- **Stock Batch Tracking**: Monitor batch numbers, manufacture dates, and expiration dates.
- **Automated Expiry Alerts**: Background cron service checks expiring products (`PRODUCT_EXPIRY_ALERT_DAYS=60`) and dispatches alerts.
- **Purchase Order (PO) Workflow**: Create POs for suppliers, receive partial or full shipments with stock adjustment modals.

### 8. 🌐 Bilingual Localization (Khmer & English)
- **100% Bilingual Support**: Seamlessly toggle between Khmer (ខ្មែរ) and English across both web portals and the mobile app.
- **Automated Product Translation Scripts**: Backend utilities to backfill missing Khmer titles and descriptions.

### 9. ⚡ Real-Time Socket.io Synchronization
- Instant order confirmation popups for admins.
- Customer live delivery notifications without page refreshes.
- Payment status auto-detection without manual reloads.

---

## 💻 Technology Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Backend API** | Node.js (v18+), Express 5, Mongoose 9, Socket.io 4 |
| **Security & Auth** | JWT, Passport.js, Google OAuth 2.0, Helmet, Express-Rate-Limit, Mongo Sanitize |
| **AI / NLP** | Custom Khmer & English Sentiment Lexicon Engine, Weighted Polarity Classifier |
| **Payment Gateway** | National Bank of Cambodia (NBC) Bakong KHQR (`bakong-khqr`), Telegram Bot API |
| **Customer Web** | React 19, Vite 7, TailwindCSS 4, Framer Motion, Lucide React, i18next |
| **Admin Web** | React 19, Vite 7, TailwindCSS 4, Recharts, Lucide React, Axios |
| **Mobile App** | Flutter 3.x, Dart 3.x, BLoC / Cubit, Google Maps Flutter, Geolocator, qr_flutter |
| **Database & Cloud** | MongoDB Atlas / Local, Cloudinary Image CDN, Sharp, Resend, Gmail SMTP |
| **DevOps & Hosting** | Render Blueprint (`render.yaml`), Vercel, Docker-ready |

---

## 📁 Repository Structure

```text
ecommerce-website/
├── backend/                      # Express 5 REST API & Socket.io Server
│   ├── config/                   # DB, Bakong, Cloudinary & Security configuration
│   ├── controllers/              # MVC Controller request/response handlers
│   ├── models/                   # Mongoose Schemas (User, Product, Order, PO, Supplier, etc.)
│   ├── routes/                   # API Route definitions
│   ├── services/                 # Core business logic (Bakong, Expiry, Sentiment, PO)
│   ├── realtime/                 # Socket.io event dispatchers
│   ├── scripts/                  # Seeders, backfill scripts, Khmer translation utilities
│   ├── utils/                    # Sentiment lexicon NLP engine, email & image helpers
│   ├── tests/                    # Backend unit & integration test suites
│   ├── server.js                 # Application server entry point
│   └── package.json
│
├── user-frontend/                # Customer-Facing Web Application
│   ├── src/
│   │   ├── controllers/          # Client-side MVC state controllers
│   │   ├── models/               # Client-side domain models
│   │   ├── services/             # Axios API service wrappers
│   │   ├── views/                # React pages (Home, Shop, ProductDetails, Cart, Checkout)
│   │   ├── components/           # UI components (Navbar, KHQR Modal, Map Picker)
│   │   ├── i18n/                 # Khmer & English translations
│   │   └── App.jsx               # Route definitions
│   ├── vite.config.js
│   └── package.json
│
├── admin-frontend/               # Store Admin & Management Portal
│   ├── src/
│   │   ├── shared/               # Modular admin controllers, models & views
│   │   │   ├── views/admin/      # Dashboard, Products, Orders, Suppliers, POs, Sentiment
│   │   │   └── components/       # Admin sidebar, metric cards, modals
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── mobile_app/                   # Cross-Platform Flutter Mobile Application
│   ├── lib/
│   │   ├── core/                 # AppConfig, API endpoints, theme, network, DI locator
│   │   ├── features/             # BLoC-driven features (auth, cart, catalog, checkout, orders)
│   │   ├── l10n/                 # App localizations (Khmer & English arb files)
│   │   └── main.dart             # Flutter app entry point & MultiBlocProvider
│   ├── assets/                   # App icons, splash screens, category graphics
│   ├── pubspec.yaml              # Flutter dependencies
│   └── README.md                 # Dedicated Flutter mobile guide
│
├── shared-frontend/              # Shared assets & utilities between web clients
├── render.yaml                   # Infrastructure-as-Code for Render Cloud deployment
├── QUICK_START.md                # Fast onboarding & Bakong payment testing guide
├── BAKONG_PAYMENT_GUIDE.md       # In-depth NBC Bakong KHQR documentation
├── DEPLOYMENT_GUIDE.md           # Production deployment instructions
├── GOOGLE_MAPS_FEATURE.md        # Google Maps pinning & store locator guide
└── MVC_STRUCTURE.md              # Architectural design document
```

---

## 🛠 Getting Started & Local Development

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a free MongoDB Atlas URI
- **Flutter SDK**: `v3.11.x`+ (for mobile development)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file from example
cp .env.example .env

# Edit .env with your credentials (MongoDB URI, JWT secret, etc.)
# Run database migrations / seed initial admin
npm run admin:bootstrap

# Start development server with hot reload
npm run dev
```
> The backend server will start at: **`http://localhost:4000`**  
> Health check endpoint: **`http://localhost:4000/health`**

---

### 2. User Web Frontend Setup

```bash
# In a new terminal, navigate to user-frontend
cd user-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> The customer storefront will launch at: **`http://localhost:5173`**

---

### 3. Admin Web Frontend Setup

```bash
# In a new terminal, navigate to admin-frontend
cd admin-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> The admin dashboard will launch at: **`http://localhost:5174`**

---

### 4. Flutter Mobile App Setup

```bash
# In a new terminal, navigate to mobile_app
cd mobile_app

# Fetch Flutter dependencies
flutter pub get

# Verify connected devices or launch an emulator
flutter devices

# Run the app (iOS Simulator or Android Emulator)
flutter run
```
> For complete instructions on mobile configurations, see [`mobile_app/README.md`](mobile_app/README.md).

---

## ⚙️ Environment Variables Guide

### Backend (`backend/.env`)

```ini
# Core Configuration
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
ADMIN_BOOTSTRAP_PASSWORD=AdminSecurePassword123!
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
ALLOW_LOCAL_DEV_ORIGINS=true

# National Bank of Cambodia (NBC) Bakong KHQR
BAKONG_ENABLED=true
BAKONG_ACCOUNT_TYPE=INDIVIDUAL
BAKONG_ACCOUNT_ID=your-account@your-bank
BAKONG_ACCOUNT_USERNAME=Cherish Baby Store
BAKONG_MERCHANT_CITY=Phnom Penh
BAKONG_PHONE_NUMBER=85512345678
BAKONG_TOKEN=your-production-bakong-api-token
BAKONG_API_URL=https://api-bakong.nbc.gov.kh
USD_TO_KHR_RATE=4100
BAKONG_RECONCILIATION_INTERVAL_MS=15000

# Telegram KHQR Alerts
TELEGRAM_BOT_TOKEN_4=your_telegram_bot_token
TELEGRAM_CHAT_ID_4=your_telegram_chat_id

# Cloudinary & Image Processing
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```

### Web Frontends (`.env`)

```ini
# user-frontend & admin-frontend
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_api_key
```

---

## 💳 Testing & Payment Simulation

You can test the entire Bakong KHQR payment lifecycle in development without a live banking debit:

1. **Place an Order**: On the user storefront, add items to your cart, proceed to checkout, pin your address on Google Maps, and select **Bakong KHQR**.
2. **Copy Transaction ID**: The system generates a dynamic QR code and displays a unique `Transaction ID`.
3. **Trigger Webhook Simulation**:
   ```bash
   curl -X POST http://localhost:4000/api/payments/bakong/verify \
     -H "Content-Type: application/json" \
     -d '{
       "transactionId": "PASTE_TRANSACTION_ID_HERE",
       "ackId": "ACK_TEST_123456",
       "status": "SUCCESS",
       "responseCode": "00",
       "payerName": "Sok Dara",
       "payerAccount": "012345678"
     }'
   ```
4. **Auto-Confirmation**: The client will immediately detect payment completion via Socket.io/polling and redirect to the order invoice!

---

## 🚀 Deployment Guide

This project is pre-configured with a Render Blueprint [`render.yaml`](render.yaml) for automated cloud deployments:

- **Backend Service**: Deployed as a Node Web Service with health checking at `/health`.
- **User Frontend**: Deployed as a static site with client-side rewrite rules (`/*` → `/index.html`).
- **Admin Frontend**: Can be deployed on Vercel or Render with proxy configurations.

For step-by-step production deployment instructions, please review the [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).

---

## 🎓 Academic Research & Case Study

This platform was developed as part of an applied research thesis:

> **Project Title**: Design and Development of an E-Commerce Platform for Baby Products with AI-Based Customer Sentiment Analysis  
> **Partner Enterprise**: PCHUNCHANACSAMAI CO., LTD.  
> **Core Focus**:
> - Solving unstructured review analysis using contextual NLP in bilingual environments (Khmer/English).
> - Eliminating manual inventory tracking challenges through automated 60-day batch expiry alarms.
> - Enabling financial inclusion using the National Bank of Cambodia's Bakong KHQR framework.

---

## 📄 Contributing & License

Contributions, issues, and feature requests are welcome!

Distributed under the **ISC License**. See `LICENSE` for more information.

---

<p align="center">
  Crafted with ❤️ for parents, babies, and merchants by the <b>Cherish Baby</b> Team.
</p>
