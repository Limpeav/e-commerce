import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:gal/gal.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/services/bakong_service.dart';

class KhqrPaymentModal extends StatefulWidget {
  final String? orderId;
  final double totalUsd;
  final double totalKhr;
  final String orderSummary;
  final VoidCallback onPaymentSuccess;
  final String? authToken; // JWT token from AuthController

  const KhqrPaymentModal({
    super.key,
    this.orderId,
    required this.totalUsd,
    required this.totalKhr,
    required this.orderSummary,
    required this.onPaymentSuccess,
    this.authToken,
  });

  static Future<void> show(
    BuildContext context, {
    String? orderId,
    required double totalUsd,
    required double totalKhr,
    required String orderSummary,
    required VoidCallback onPaymentSuccess,
    String? authToken,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => KhqrPaymentModal(
        orderId: orderId,
        totalUsd: totalUsd,
        totalKhr: totalKhr,
        orderSummary: orderSummary,
        onPaymentSuccess: onPaymentSuccess,
        authToken: authToken,
      ),
    );
  }

  @override
  State<KhqrPaymentModal> createState() => _KhqrPaymentModalState();
}

class _KhqrPaymentModalState extends State<KhqrPaymentModal>
    with SingleTickerProviderStateMixin {
  int _remainingSeconds = 900; // 15 minutes
  Timer? _timer;
  Timer? _pollTimer;
  bool _isVerifying = false;
  bool _isPaymentSuccess = false;
  String? _paymentId;
  String? _qrData;
  String? _qrError; // Non-null when QR generation failed
  final GlobalKey _qrCardKey = GlobalKey();
  bool _isSavingQr = false;
  String _selectedCurrency = 'USD'; // 'USD' or 'KHR'

  double get _currentAmount =>
      _selectedCurrency == 'KHR' ? widget.totalKhr : widget.totalUsd;

  late AnimationController _scanAnimController;
  late Animation<double> _scanLineAnim;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _initBakongPayment();

    // Laser scanline animation for the QR code
    _scanAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);
    _scanLineAnim = Tween<double>(begin: 0.05, end: 0.95).animate(
      CurvedAnimation(parent: _scanAnimController, curve: Curves.easeInOut),
    );
  }

  void _switchCurrency(String currency) {
    if (_selectedCurrency == currency || _isSavingQr) return;
    HapticFeedback.selectionClick();
    setState(() {
      _selectedCurrency = currency;
    });
    _pollTimer?.cancel();
    _initBakongPayment();
  }

  Future<void> _initBakongPayment() async {
    if (!mounted) return;
    setState(() {
      _qrError = null;
      _qrData = null;
    });

    final res = await BakongService.generateMerchantQr(
      amount: _currentAmount,
      currency: _selectedCurrency,
      orderId: widget.orderId,
      authToken: widget.authToken,
    );

    if (!mounted) return;

    if (res.success && res.qrData != null && res.qrData!.isNotEmpty) {
      setState(() {
        _paymentId = res.paymentId;
        _qrData = res.qrData;
        _qrError = null;
      });
      if (_paymentId != null && _paymentId!.isNotEmpty) {
        _startPollingPayment();
      }
    } else {
      // Gracefully fallback to generating official EMVCo Bakong KHQR so the customer can always scan
      debugPrint('ℹ️ Bakong backend note: ${res.errorMessage}. Generating merchant KHQR fallback in $_selectedCurrency.');
      final fallbackQr = BakongService.generateFallbackKhqr(
        amount: _currentAmount,
        currency: _selectedCurrency,
        orderId: widget.orderId,
      );
      setState(() {
        _qrData = fallbackQr;
        _qrError = null;
      });
    }
  }

  void _startPollingPayment() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (_paymentId == null || !mounted || _isVerifying || _isPaymentSuccess) return;
      final status = await BakongService.checkPaymentStatus(_paymentId!, authToken: widget.authToken);
      if (status.isPaid && mounted) {
        timer.cancel();
        setState(() {
          _isPaymentSuccess = true;
          _isVerifying = false;
        });
        HapticFeedback.heavyImpact();
        Future.delayed(const Duration(milliseconds: 1400), () {
          if (!mounted) return;
          Navigator.of(context).pop();
          widget.onPaymentSuccess();
        });
      }
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_remainingSeconds > 0) {
        if (mounted) {
          setState(() {
            _remainingSeconds--;
          });
        }
      } else {
        t.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pollTimer?.cancel();
    _scanAnimController.dispose();
    super.dispose();
  }

  String get _formattedTime {
    final mins = _remainingSeconds ~/ 60;
    final secs = _remainingSeconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  Future<void> _handleSaveQr() async {
    if (_isSavingQr) return;
    HapticFeedback.selectionClick();

    setState(() {
      _isSavingQr = true;
    });

    try {
      // Small pause to allow laser line to hide and UI to render cleanly
      await Future.delayed(const Duration(milliseconds: 50));

      final boundary =
          _qrCardKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        throw Exception('QR code view is not ready yet.');
      }

      final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      final ByteData? byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) {
        throw Exception('Failed to generate image bytes.');
      }
      final Uint8List pngBytes = byteData.buffer.asUint8List();

      final hasAccess = await Gal.hasAccess();
      if (!hasAccess) {
        final granted = await Gal.requestAccess();
        if (!granted) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    Icon(Icons.warning_amber_rounded,
                        color: Colors.amber, size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                          'Please allow Photos access in Settings to save the QR code.'),
                    ),
                  ],
                ),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
          return;
        }
      }

      await Gal.putImageBytes(
        pngBytes,
        name: 'KHQR_${DateTime.now().millisecondsSinceEpoch}',
      );

      HapticFeedback.mediumImpact();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded,
                    color: Colors.greenAccent, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text('📸 KHQR code saved to your Photos!'),
                ),
              ],
            ),
            backgroundColor: Color(0xFF1E293B),
            duration: Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error saving QR code to photos: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save QR code: $e'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingQr = false;
        });
      }
    }
  }

  void _handleCopyAccount() {
    HapticFeedback.selectionClick();
    Clipboard.setData(const ClipboardData(text: 'cherish_baby@abaa'));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📋 Merchant ID (cherish_baby@abaa) copied to clipboard!'),
        duration: Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _formatKhr(double amount) {
    final intVal = amount.round();
    final str = intVal.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(str[i]);
    }
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    if (_isPaymentSuccess) {
      return Container(
        height: 380,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2220) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: Colors.green.withAlpha(25),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withAlpha(50),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  Icons.check_circle_rounded,
                  size: 64,
                  color: Colors.green,
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Payment Received!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Verified \$${widget.totalUsd.toStringAsFixed(2)} (៛${_formatKhr(widget.totalKhr)}) via KHQR',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 18),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.green),
                ),
                SizedBox(width: 10),
                Text(
                  'Redirecting to order confirmation...',
                  style: TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Container(
      constraints: BoxConstraints(maxHeight: size.height * 0.94),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2220) : const Color(0xFFF7F5F0),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top Sheet Drag Handle
          Center(
            child: Container(
              width: 42,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 10),
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey[400],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(18, 4, 18, 28),
              child: Column(
                children: [
                  // Currency Switcher: USD ($) vs KHR (៛ Riels)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF282D2A) : const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildCurrencyTab(
                          label: '\$ USD',
                          currency: 'USD',
                          isSelected: _selectedCurrency == 'USD',
                        ),
                        _buildCurrencyTab(
                          label: '៛ KHR (Riels)',
                          currency: 'KHR',
                          isSelected: _selectedCurrency == 'KHR',
                        ),
                      ],
                    ),
                  ),

                  // ================= OFFICIAL BAKONG KHQR STANDEE CARD =================
                  RepaintBoundary(
                    key: _qrCardKey,
                    child: Container(
                      width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(isDark ? 50 : 25),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // 1. Official Red KHQR Top Banner
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFFE51A24), Color(0xFFC71019)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                // KHQR Bold Brand Header
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text(
                                        'KHQR',
                                        style: TextStyle(
                                          color: Color(0xFFE51A24),
                                          fontWeight: FontWeight.w900,
                                          fontSize: 15,
                                          letterSpacing: 1.2,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'BAKONG KHQR • ${_selectedCurrency == 'USD' ? '\$ USD' : '៛ KHR'}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 13,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                        Text(
                                          'National Bank of Cambodia',
                                          style: TextStyle(
                                            color: Colors.white70,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),

                                // Countdown Timer Pill
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withAlpha(60),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.timer_outlined, color: Colors.white, size: 14),
                                      const SizedBox(width: 5),
                                      Text(
                                        _formattedTime,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // 2. Merchant Info & Amount Block
                          Padding(
                            padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
                            child: Column(
                              children: [
                                // Merchant Name with Verified Badge
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      'Cherish Baby Store',
                                      style: TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF1E293B),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(Icons.verified_rounded, size: 18, color: Colors.blue[600]),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                // Merchant ID Pill with Copy
                                GestureDetector(
                                  onTap: _handleCopyAccount,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'cherish_baby@abaa',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF475569),
                                          ),
                                        ),
                                        SizedBox(width: 6),
                                        Icon(Icons.copy_rounded, size: 12, color: Color(0xFF64748B)),
                                      ],
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 12),

                                // Amount Row (USD & KHR Swappable)
                                GestureDetector(
                                  onTap: () => _switchCurrency(_selectedCurrency == 'USD' ? 'KHR' : 'USD'),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.baseline,
                                    textBaseline: TextBaseline.alphabetic,
                                    children: [
                                      Text(
                                        _selectedCurrency == 'USD'
                                            ? '\$${widget.totalUsd.toStringAsFixed(2)}'
                                            : '៛${_formatKhr(widget.totalKhr)}',
                                        style: const TextStyle(
                                          fontSize: 31,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF0F172A),
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE51A24).withAlpha(20),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              _selectedCurrency == 'USD'
                                                  ? '៛${_formatKhr(widget.totalKhr)}'
                                                  : '\$${widget.totalUsd.toStringAsFixed(2)}',
                                              style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w800,
                                                color: Color(0xFFE51A24),
                                              ),
                                            ),
                                            const SizedBox(width: 3),
                                            const Icon(
                                              Icons.swap_horiz_rounded,
                                              size: 15,
                                              color: Color(0xFFE51A24),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // 3. Dense KHQR Matrix with Laser Scanline Animation
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                // Outer QR border container
                                Container(
                                  width: 224,
                                  height: 224,
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: _qrData != null
                                      // Real scannable Bakong KHQR with custom center badge
                                      ? Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            QrImageView(
                                              data: _qrData!,
                                              version: QrVersions.auto,
                                              size: 200,
                                              backgroundColor: Colors.white,
                                              eyeStyle: const QrEyeStyle(
                                                eyeShape: QrEyeShape.square,
                                                color: Color(0xFF0F172A),
                                              ),
                                              dataModuleStyle: const QrDataModuleStyle(
                                                dataModuleShape: QrDataModuleShape.square,
                                                color: Color(0xFF0F172A),
                                              ),
                                              errorCorrectionLevel: QrErrorCorrectLevel.H,
                                            ),
                                            // Bakong red center badge (no image file needed)
                                            Container(
                                              width: 38,
                                              height: 38,
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Container(
                                                margin: const EdgeInsets.all(3),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFE51A24),
                                                  borderRadius: BorderRadius.circular(7),
                                                ),
                                                child: const Center(
                                                  child: Text(
                                                    '៛',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 18,
                                                      fontWeight: FontWeight.w900,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        )
                                      // Error state with retry button
                                      : _qrError != null
                                          ? Center(
                                              child: Padding(
                                                padding: const EdgeInsets.all(12),
                                                child: Column(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    const Icon(Icons.wifi_off_rounded, color: Colors.grey, size: 36),
                                                    const SizedBox(height: 10),
                                                    const Text(
                                                      'Could not generate QR',
                                                      textAlign: TextAlign.center,
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        fontWeight: FontWeight.w700,
                                                        color: Color(0xFF0F172A),
                                                      ),
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      _qrError ?? 'Please check your connection or login status',
                                                      textAlign: TextAlign.center,
                                                      maxLines: 2,
                                                      overflow: TextOverflow.ellipsis,
                                                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                                                    ),
                                                    const SizedBox(height: 12),
                                                    ElevatedButton.icon(
                                                      onPressed: _initBakongPayment,
                                                      icon: const Icon(Icons.refresh_rounded, size: 16),
                                                      label: const Text('Retry'),
                                                      style: ElevatedButton.styleFrom(
                                                        backgroundColor: const Color(0xFFE51A24),
                                                        foregroundColor: Colors.white,
                                                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                                        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            )
                                          // Generating spinner
                                          : const Center(
                                              child: Column(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  CircularProgressIndicator(
                                                    color: Color(0xFFE51A24),
                                                    strokeWidth: 3,
                                                  ),
                                                  SizedBox(height: 12),
                                                  Text(
                                                    'Generating KHQR...',
                                                    style: TextStyle(
                                                      fontSize: 12,
                                                      color: Colors.grey,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                ),

                                // Laser Scanline Beam
                                AnimatedBuilder(
                                  animation: _scanAnimController,
                                  builder: (context, child) {
                                    if (_isSavingQr) return const SizedBox.shrink();
                                    return Positioned(
                                      top: 14 + (200 * _scanLineAnim.value),
                                      left: 20,
                                      right: 20,
                                      child: Container(
                                        height: 2,
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              Colors.transparent,
                                              const Color(0xFFE51A24).withAlpha(180),
                                              const Color(0xFFE51A24),
                                              const Color(0xFFE51A24).withAlpha(180),
                                              Colors.transparent,
                                            ],
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFFE51A24).withAlpha(120),
                                              blurRadius: 8,
                                              spreadRadius: 2,
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 14),

                          // 4. Supported Cambodian Bank Badges Row
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              alignment: WrapAlignment.center,
                              children: [
                                _buildBankPill('ABA Bank', const Color(0xFF003B6F), Colors.white),
                                _buildBankPill('Bakong', const Color(0xFFE51A24), Colors.white),
                                _buildBankPill('ACLEDA', const Color(0xFF0B286D), const Color(0xFFFDB913)),
                                _buildBankPill('Wing Bank', const Color(0xFF87C440), const Color(0xFF0A2E5C)),
                                _buildBankPill('Canadia', const Color(0xFFD32F2F), Colors.white),
                                _buildBankPill('Sathapana', const Color(0xFF004F9E), Colors.white),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // 5. Quick Tools (Save QR to Photos & Copy Details)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF282D2A) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      TextButton.icon(
                        onPressed: _isSavingQr ? null : _handleSaveQr,
                        icon: _isSavingQr
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFFE51A24),
                                ),
                              )
                            : const Icon(Icons.download_rounded, size: 18, color: Color(0xFFE51A24)),
                        label: Text(
                          _isSavingQr ? 'Saving to Photos...' : 'Save QR Code',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFFE51A24),
                          ),
                        ),
                      ),
                      Container(width: 1, height: 18, color: isDark ? Colors.white24 : Colors.grey[300]),
                      TextButton.icon(
                        onPressed: _handleCopyAccount,
                        icon: Icon(Icons.copy_rounded, size: 15, color: isDark ? Colors.white70 : const Color(0xFF0F172A)),
                        label: Text(
                          'Copy Details',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white70 : const Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Live Automated Payment Verification Status
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Awaiting KHQR payment...',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Scan with ABA, Bakong, Wing, or any banking app. Order confirms automatically once paid.',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white60 : Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Cancel Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                        color: isDark ? Colors.white24 : const Color(0xFFCBD5E1),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      'Cancel & Choose Another Method',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white70 : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBankPill(String name, Color bg, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        name,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildCurrencyTab({
    required String label,
    required String currency,
    required bool isSelected,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => _switchCurrency(currency),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE51A24) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFFE51A24).withAlpha(90),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
          ),
        ),
      ),
    );
  }
}
