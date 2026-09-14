import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Application-wide environment configuration with smart dual-backend support:
/// - Fast local backend (http://127.0.0.1:4000, http://10.0.2.2:4000, or http://localhost:4000)
/// - Deployed cloud backend (https://backend-80bu.onrender.com)
///
/// Automatically probes local backend on startup. If local is running, it connects
/// locally for instant response times. If local is not running or unreachable,
/// it seamlessly connects to the deployed cloud backend.
class AppConfig {
  /// Deployed cloud backend URL
  static const String deployedBaseUrl = 'https://backend-80bu.onrender.com';

  /// Returns the appropriate localhost URL for the current runtime platform
  static String get localBaseUrl {
    const customLocal = String.fromEnvironment('LOCAL_BASE_URL', defaultValue: '');
    if (customLocal.isNotEmpty) return customLocal;

    if (kIsWeb) return 'http://localhost:4000';
    try {
      if (Platform.isAndroid) {
        // Android emulator host loopback
        return 'http://10.0.2.2:4000';
      }
    } catch (_) {}
    // iOS Simulator, macOS desktop, etc.
    return 'http://127.0.0.1:4000';
  }

  /// Compile-time override if supplied via --dart-define=BASE_URL=...
  static const String _compileTimeBaseUrl = String.fromEnvironment('BASE_URL', defaultValue: '');

  static String _activeBaseUrl = _compileTimeBaseUrl.isNotEmpty
      ? _compileTimeBaseUrl
      : deployedBaseUrl;

  /// Active Base API URL (dynamically switched based on availability)
  static String get baseUrl => _activeBaseUrl;

  static bool get isUsingLocal =>
      _activeBaseUrl.contains('localhost') ||
      _activeBaseUrl.contains('127.0.0.1') ||
      _activeBaseUrl.contains('10.0.2.2');

  /// Google Maps API Key
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: 'AIzaSyBXva4PuRMiA-l2pgeSCSwxabTPG6FoupY',
  );

  /// Deployment environment: 'production', 'staging', or 'development'
  static const String environment = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'production',
  );

  /// Default Bakong merchant account ID
  static const String defaultBakongMerchant = String.fromEnvironment(
    'BAKONG_MERCHANT_ID',
    defaultValue: 'cherish_baby@abaa',
  );

  /// Quick environment checks
  static bool get isProduction => environment == 'production';
  static bool get isStaging => environment == 'staging';
  static bool get isDevelopment => environment == 'development';

  /// Probe local backend first. If available, use local for lightning-fast speed.
  /// If not running or times out, seamlessly use deployed cloud backend.
  static Future<String> initBackendSelection([SharedPreferences? prefs]) async {
    if (_compileTimeBaseUrl.isNotEmpty) {
      _activeBaseUrl = _compileTimeBaseUrl;
      debugPrint('🌐 AppConfig: Using compile-time BASE_URL: $_activeBaseUrl');
      return _activeBaseUrl;
    }

    // Check if user manually pinned a backend mode in SharedPreferences
    final savedPreference = prefs?.getString('app_backend_preference');
    if (savedPreference == 'local') {
      _activeBaseUrl = localBaseUrl;
      debugPrint('📌 AppConfig: User preference pinned to LOCAL: $_activeBaseUrl');
      return _activeBaseUrl;
    } else if (savedPreference == 'deployed') {
      _activeBaseUrl = deployedBaseUrl;
      debugPrint('📌 AppConfig: User preference pinned to DEPLOYED: $_activeBaseUrl');
      return _activeBaseUrl;
    }

    final localUrl = localBaseUrl;
    debugPrint('🔍 AppConfig: Probing local backend at $localUrl...');

    try {
      final probeUri = Uri.parse('$localUrl/api/products?limit=1');
      final response = await http
          .get(probeUri)
          .timeout(const Duration(milliseconds: 1200));

      if (response.statusCode >= 200 && response.statusCode < 500) {
        _activeBaseUrl = localUrl;
        debugPrint('🚀 AppConfig: Local backend is ACTIVE and responding! Using: $_activeBaseUrl');
        return _activeBaseUrl;
      }
    } catch (e) {
      debugPrint('ℹ️ AppConfig: Local backend not reachable ($e). Falling back to cloud backend.');
    }

    _activeBaseUrl = deployedBaseUrl;
    debugPrint('☁️ AppConfig: Using deployed cloud backend: $_activeBaseUrl');
    return _activeBaseUrl;
  }

  /// Switch the active base URL to the alternate backend and return updated URL
  static String switchFallback(String failedUrl) {
    if (failedUrl.startsWith(localBaseUrl)) {
      _activeBaseUrl = deployedBaseUrl;
      debugPrint('⚠️ AppConfig: Local failed, auto-switched to DEPLOYED: $_activeBaseUrl');
      return failedUrl.replaceFirst(localBaseUrl, deployedBaseUrl);
    } else if (failedUrl.startsWith(deployedBaseUrl)) {
      _activeBaseUrl = localBaseUrl;
      debugPrint('⚠️ AppConfig: Deployed failed, auto-switched to LOCAL: $_activeBaseUrl');
      return failedUrl.replaceFirst(deployedBaseUrl, localBaseUrl);
    }
    return failedUrl;
  }

  static void useLocal([SharedPreferences? prefs]) {
    _activeBaseUrl = localBaseUrl;
    prefs?.setString('app_backend_preference', 'local');
    debugPrint('🔄 AppConfig: Switched to LOCAL: $_activeBaseUrl');
  }

  static void useDeployed([SharedPreferences? prefs]) {
    _activeBaseUrl = deployedBaseUrl;
    prefs?.setString('app_backend_preference', 'deployed');
    debugPrint('🔄 AppConfig: Switched to DEPLOYED: $_activeBaseUrl');
  }

  static void useAuto([SharedPreferences? prefs]) {
    prefs?.remove('app_backend_preference');
    initBackendSelection(prefs);
  }
}
