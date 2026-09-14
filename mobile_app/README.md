# 📱 Cherish Baby Store — Flutter Mobile Application

[![Flutter](https://img.shields.io/badge/Flutter-v3.11+-02569B.svg?style=flat-square&logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-v3.11+-0175C2.svg?style=flat-square&logo=dart)](https://dart.dev)
[![State Management](https://img.shields.io/badge/State-flutter__bloc-blue.svg?style=flat-square)](https://pub.dev/packages/flutter_bloc)
[![Payment](https://img.shields.io/badge/Payment-NBC%20Bakong%20KHQR-red.svg?style=flat-square)](https://bakong.nbc.gov.kh)
[![Maps](https://img.shields.io/badge/Maps-Google%20Maps%20Flutter-4285F4.svg?style=flat-square&logo=google-maps)](https://pub.dev/packages/google_maps_flutter)
[![Socket.io](https://img.shields.io/badge/RealTime-socket__io__client-black.svg?style=flat-square&logo=socket.io)](https://pub.dev/packages/socket_io_client)

The official cross-platform mobile shopping application for **Cherish Baby Store** (PCHUNCHANACSAMAI CO., LTD.), providing a seamless, native shopping experience for parents across Cambodia on both iOS and Android.

---

## 🌟 Features Overview

- **Bilingual Localization (Khmer 🇰🇭 & English 🇺🇸)**: Built-in internationalization supporting instant language toggling across all screens.
- **Smart Dual-Backend Auto-Detection**:
  - Automatically probes local dev server (`http://10.0.2.2:4000` on Android emulator, `http://127.0.0.1:4000` on iOS simulator).
  - Falls back seamlessly to the deployed cloud production server (`https://backend-80bu.onrender.com`).
- **AI Sentiment Badges on Customer Reviews**: Displays AI-classified sentiment indicators (Positive, Neutral, Negative) on baby product reviews.
- **Cambodia National Bank (NBC) Bakong KHQR Payment**:
  - In-app dynamic KHQR generation with countdown timer.
  - One-tap QR code download to device gallery (`gal`).
  - Real-time payment confirmation via Socket.io.
- **Google Maps Pin-Drop & Store Locator**:
  - Precise delivery address selection with draggable map markers.
  - GPS current location detection using `geolocator`.
  - Store branch locator with distance and direction information.
- **Real-Time Live Updates**: Powered by `socket_io_client` for order status changes and delivery milestone alerts.
- **Secure Authentication**: Email & password authentication with JWT token persistence and Google Sign-In (`google_sign_in`).
- **Theme Support**: Adaptive Light and Dark modes with custom baby care aesthetic palette.

---

## 🏗 Architecture & Design Patterns

The mobile app follows clean architecture principles paired with the **BLoC (Business Logic Component)** pattern:

```text
lib/
├── core/                         # Cross-cutting core services and utilities
│   ├── constants/                # AppConfig, ApiConstants, AppColors, Asset paths
│   ├── di/                       # Dependency Injection (ServiceLocator)
│   ├── errors/                   # Custom failure and error handlers
│   ├── network/                  # Base HTTP client with JWT interceptor
│   ├── services/                 # Device storage, location, and payment services
│   ├── theme/                    # Light & Dark theme definitions and ThemeCubit
│   └── widgets/                  # Reusable UI widgets (cards, buttons, loaders)
│
├── features/                     # Feature-first modular packages
│   ├── auth/                     # Login, Register, Forgot Password, Google Auth
│   ├── catalog/ & products/      # Category browsing, product search & filtering
│   ├── product_details/          # Image carousel, variants, stock, reviews & AI sentiment
│   ├── cart/                     # Shopping cart management with price calculations
│   ├── wishlist/                 # Saved items synchronized with backend
│   ├── checkout/                 # Map pin-drop, delivery address, KHQR payment modal
│   ├── orders/                   # Order tracking timeline, order history, receipts
│   ├── notifications/            # Real-time notification list and badges
│   ├── profile/                  # Account info, saved addresses, language/theme toggles
│   ├── store_locator/            # Google Maps store finder
│   └── splash/                   # Animated splash screen and backend probe check
│
├── l10n/                         # Internationalization files (ARB format)
│   ├── app_en.arb                # English strings
│   └── app_km.arb                # Khmer strings (ភាសាខ្មែរ)
│
└── main.dart                     # App entry point with MultiBlocProvider
```

---

## 🚀 Getting Started

### Prerequisites

- **Flutter SDK**: `v3.11.4` or higher ([Install Flutter](https://docs.flutter.dev/get-started/install))
- **Dart SDK**: Compatible with Flutter SDK (`^3.11.4`)
- **Android**: Android Studio / SDK with Android API 21+
- **iOS**: macOS with Xcode 15+ and CocoaPods installed (`sudo gem install cocoapods`)

---

### Step 1: Install Dependencies

```bash
cd mobile_app
flutter pub get
```

### Step 2: Generate Code & Localization (if modifying assets or arb files)

```bash
# Generate l10n localization delegates
flutter gen-l10n

# (Optional) Run build_runner if modifying JSON models
dart run build_runner build --delete-conflicting-outputs
```

### Step 3: Run the Application

```bash
# Check connected devices or running emulators
flutter devices

# Run in debug mode
flutter run
```

---

## ⚙️ Environment Configuration

The app config is managed in [`lib/core/constants/app_config.dart`](lib/core/constants/app_config.dart). You can override defaults at build or run time using `--dart-define`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | Auto-detected | Force a custom backend URL |
| `LOCAL_BASE_URL` | Platform-specific | Override local development server address |
| `GOOGLE_MAPS_API_KEY` | Pre-configured key | Google Maps Android/iOS API key |
| `APP_ENV` | `production` | Environment mode (`development`, `staging`, `production`) |
| `BAKONG_MERCHANT_ID` | `cherish_baby@abaa` | Default merchant account for Bakong KHQR |

### Running with Compile-Time Overrides:

```bash
# Connect explicitly to local backend on physical device
flutter run --dart-define=BASE_URL=http://192.168.1.50:4000

# Connect explicitly to production cloud backend
flutter run --dart-define=BASE_URL=https://backend-80bu.onrender.com
```

---

## 📦 Building for Production

### Android

```bash
# Build Android App Bundle (Google Play release)
flutter build appbundle --release

# Build standalone Android APK
flutter build apk --release
```
The resulting `.apk` will be in `build/app/outputs/flutter-apk/app-release.apk`.

### iOS

```bash
# Build iOS archive (Requires macOS & Xcode)
flutter build ipa --release
```

---

## 🗺️ Google Maps Setup

For Android, verify your API key is declared in `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

For iOS, ensure your key is registered in `ios/Runner/AppDelegate.swift`:
```swift
GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
```

---

## 🧪 Testing

```bash
# Run unit and widget tests
flutter test

# Run integration tests
flutter test integration_test/
```

---

## 📄 License

Part of the **Cherish Baby** E-Commerce System (PCHUNCHANACSAMAI CO., LTD.).  
Distributed under the **ISC License**.
