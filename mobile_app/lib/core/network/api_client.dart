import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../constants/app_config.dart';
import '../errors/exceptions.dart';

class ApiClient {
  final http.Client _client;

  /// Optional callback invoked when a request receives a 401 Unauthorized status.
  /// Should return a fresh authentication token or null if refresh failed.
  Future<String?> Function()? onRefreshToken;

  /// Optional callback invoked when a token refresh fails or session is definitively expired.
  void Function()? onSessionExpired;

  ApiClient({
    http.Client? client,
    this.onRefreshToken,
    this.onSessionExpired,
  }) : _client = client ?? http.Client();

  Map<String, String> _defaultHeaders(Map<String, String>? customHeaders) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?customHeaders,
    };
  }

  Future<dynamic> _executeWithAuthIntercept({
    required Future<http.Response> Function(Map<String, String> headers) request,
    Map<String, String>? headers,
  }) async {
    final initialHeaders = _defaultHeaders(headers);
    final response = await request(initialHeaders);

    if (response.statusCode == 401) {
      if (onRefreshToken != null) {
        try {
          final newToken = await onRefreshToken!();
          if (newToken != null && newToken.isNotEmpty) {
            final retriedHeaders = Map<String, String>.from(initialHeaders);
            retriedHeaders['Authorization'] = 'Bearer $newToken';
            final retryResponse = await request(retriedHeaders);
            if (retryResponse.statusCode != 401) {
              return _handleResponse(retryResponse);
            }
          }
        } catch (_) {}
      }
      onSessionExpired?.call();
    }

    return _handleResponse(response);
  }

  Future<dynamic> _executeWithFallback({
    required String url,
    required Future<http.Response> Function(Uri uri, Map<String, String> headers) request,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    final uri = Uri.parse(url);
    try {
      return await _executeWithAuthIntercept(
        headers: headers,
        request: (hdrs) => request(uri, hdrs).timeout(timeout),
      );
    } on ServerException {
      rethrow;
    } catch (e) {
      // If primary request failed due to network / timeout, try alternate backend
      final altUrl = AppConfig.switchFallback(url);
      if (altUrl != url) {
        debugPrint('🔄 ApiClient: Primary call to $url failed ($e). Retrying with fallback: $altUrl');
        try {
          final altUri = Uri.parse(altUrl);
          return await _executeWithAuthIntercept(
            headers: headers,
            request: (hdrs) => request(altUri, hdrs).timeout(timeout),
          );
        } catch (fallbackError) {
          throw NetworkException('Network error on primary ($e) and fallback ($fallbackError)');
        }
      }
      throw NetworkException('Network error: $e');
    }
  }

  Future<dynamic> get(
    String url, {
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    return _executeWithFallback(
      url: url,
      headers: headers,
      timeout: timeout,
      request: (uri, hdrs) => _client.get(uri, headers: hdrs),
    );
  }

  Future<dynamic> post(
    String url, {
    dynamic body,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    return _executeWithFallback(
      url: url,
      headers: headers,
      timeout: timeout,
      request: (uri, hdrs) => _client.post(
        uri,
        headers: hdrs,
        body: body != null ? json.encode(body) : null,
      ),
    );
  }

  Future<dynamic> put(
    String url, {
    dynamic body,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    return _executeWithFallback(
      url: url,
      headers: headers,
      timeout: timeout,
      request: (uri, hdrs) => _client.put(
        uri,
        headers: hdrs,
        body: body != null ? json.encode(body) : null,
      ),
    );
  }

  Future<dynamic> delete(
    String url, {
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    return _executeWithFallback(
      url: url,
      headers: headers,
      timeout: timeout,
      request: (uri, hdrs) => _client.delete(uri, headers: hdrs),
    );
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        final decoded = utf8.decode(response.bodyBytes);
        return json.decode(decoded);
      } catch (_) {
        return json.decode(response.body);
      }
    } else {
      throw ServerException(
        message: 'Failed request with status ${response.statusCode}: ${response.body}',
        statusCode: response.statusCode,
      );
    }
  }
}
