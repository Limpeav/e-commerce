import 'api_constants.dart';

class AuthConstants {
  static String get login => '${ApiConstants.baseUrl}/api/users/login';
  static String get register => '${ApiConstants.baseUrl}/api/users/register';
  static String get verifyRegistrationEmail =>
      '${ApiConstants.baseUrl}/api/users/verify-registration-email';
  static String get resendRegistrationVerification =>
      '${ApiConstants.baseUrl}/api/users/resend-registration-verification';
  static String get forgotPassword => '${ApiConstants.baseUrl}/api/users/forgot-password';
  static String get verifyResetCode => '${ApiConstants.baseUrl}/api/users/verify-reset-code';
  static String get resetPassword => '${ApiConstants.baseUrl}/api/users/reset-password';
  static String get updateProfile => '${ApiConstants.baseUrl}/api/users/profile';
  static String get googleLogin => '${ApiConstants.baseUrl}/api/auth/google';
  static const String googleServerClientId =
      '114319681725-8fku26naudiu0ved83vrrllpb0q95tss.apps.googleusercontent.com';
  static const String googleIosClientId =
      '114319681725-s9lh8honou0fklulla6fsqe2v79ur45h.apps.googleusercontent.com';
}
