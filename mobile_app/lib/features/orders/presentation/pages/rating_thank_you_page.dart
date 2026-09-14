import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

class RatingThankYouPage extends StatefulWidget {
  final Duration displayDuration;
  final VoidCallback? onDismissed;

  const RatingThankYouPage({
    super.key,
    this.displayDuration = const Duration(milliseconds: 2000),
    this.onDismissed,
  });

  @override
  State<RatingThankYouPage> createState() => _RatingThankYouPageState();
}

class _RatingThankYouPageState extends State<RatingThankYouPage>
    with TickerProviderStateMixin {
  late final AnimationController _entranceController;
  late final AnimationController _progressController;

  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _starsScaleAnimation;

  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();

    // 1. Entrance animation (750ms)
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 750),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _entranceController,
      curve: Curves.elasticOut,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.2, 0.9, curve: Curves.easeIn),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.25, 0.95, curve: Curves.easeOutCubic),
    ));

    _starsScaleAnimation = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.35, 1.0, curve: Curves.easeOutBack),
    );

    // 2. 2-second progress bar animation matching the display duration
    _progressController = AnimationController(
      vsync: this,
      duration: widget.displayDuration,
    );

    _entranceController.forward();
    _progressController.forward();

    // 3. Auto-dismiss after displayDuration (~2s)
    _dismissTimer = Timer(widget.displayDuration, _handleDismiss);
  }

  void _handleDismiss() {
    if (!mounted) return;
    if (widget.onDismissed != null) {
      widget.onDismissed!();
    } else if (Navigator.canPop(context)) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _entranceController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor:
            isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: _handleDismiss,
          child: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Animated Checkmark Icon with soft glowing aura
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: Container(
                        width: 104,
                        height: 104,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isDark
                              ? AppColors.primary.withAlpha(35)
                              : AppColors.primaryLight.withAlpha(45),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withAlpha(isDark ? 60 : 70),
                              blurRadius: 36,
                              spreadRadius: 6,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Container(
                            width: 78,
                            height: 78,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [
                                  AppColors.primaryLight,
                                  AppColors.primaryDark,
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primaryDark.withAlpha(90),
                                  blurRadius: 18,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.check_rounded,
                              size: 46,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Staggered Animated 5 Golden Stars
                    ScaleTransition(
                      scale: _starsScaleAnimation,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 3),
                            child: Icon(
                              Icons.star_rounded,
                              size: 28,
                              color: AppColors.warmAmber,
                            ),
                          );
                        }),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Slide & Fade in Thank You Text
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: SlideTransition(
                        position: _slideAnimation,
                        child: Column(
                          children: [
                            Text(
                              'Thank You!',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                                color: isDark
                                    ? AppColors.textPrimaryDark
                                    : AppColors.textPrimaryLight,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Your feedback has been submitted successfully.\nThank you for helping us improve!',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                height: 1.45,
                                color: isDark
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 36),

                    // Animated Countdown Progress Bar (~2 seconds)
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Column(
                        children: [
                          SizedBox(
                            width: 140,
                            height: 4,
                            child: AnimatedBuilder(
                              animation: _progressController,
                              builder: (context, child) {
                                return ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: _progressController.value,
                                    backgroundColor: isDark
                                        ? Colors.white.withAlpha(25)
                                        : Colors.black.withAlpha(15),
                                    valueColor: const AlwaysStoppedAnimation<Color>(
                                      AppColors.primary,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Returning in a moment...',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.textSecondaryDark.withAlpha(180)
                                  : AppColors.textSecondaryLight.withAlpha(180),
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
