import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_config.dart';
import '../theme/bloc/locale_cubit.dart';
import '../theme/bloc/theme_cubit.dart';
import '../network/api_client.dart';
import '../models/user_profile.dart';
import '../services/push_notification_service.dart';
import '../services/search_history_service.dart';
import '../services/settings_service.dart';
import '../services/socket_service.dart';
import '../../features/auth/data/datasources/auth_local_datasource.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_event.dart';
import '../../features/auth/presentation/bloc/auth_state.dart';
import '../../features/cart/presentation/bloc/cart_bloc.dart';
import '../../features/cart/presentation/bloc/cart_event.dart';
import '../../features/notifications/presentation/bloc/notification_cubit.dart';
import '../../features/orders/presentation/bloc/order_bloc.dart';
import '../../features/orders/presentation/bloc/order_event.dart';
import '../../features/products/data/datasources/product_remote_datasource.dart';
import '../../features/products/data/repositories/product_repository_impl.dart';
import '../../features/products/domain/repositories/product_repository.dart';
import '../../features/products/domain/usecases/get_products_usecase.dart';
import '../../features/products/presentation/bloc/product_bloc.dart';
import '../../features/products/presentation/bloc/product_event.dart';
import '../../features/profile/presentation/bloc/address_cubit.dart';
import '../../features/wishlist/presentation/bloc/wishlist_bloc.dart';
import '../../features/wishlist/presentation/bloc/wishlist_event.dart';

class ServiceLocator {
  static final ServiceLocator instance = ServiceLocator._internal();

  ServiceLocator._internal();

  bool _isInitialized = false;
  StreamSubscription<AuthState>? _authSubscription;
  StreamSubscription<void>? _sessionSubscription;
  StreamSubscription<Map<String, dynamic>>? _socketOrderSubscription;
  StreamSubscription<Map<String, dynamic>>? _socketProductSubscription;

  late ApiClient apiClient;
  late ProductRemoteDataSource productRemoteDataSource;
  late ProductRepository productRepository;
  late GetProductsUseCase getProductsUseCase;

  late AuthLocalDataSource authLocalDataSource;
  late AuthRemoteDataSource authRemoteDataSource;
  late AuthRepository authRepository;

  late ThemeCubit themeCubit;
  late LocaleCubit localeCubit;
  late AuthBloc authBloc;
  late ProductBloc productBloc;
  late CartBloc cartBloc;
  late WishlistBloc wishlistBloc;
  late OrderBloc orderBloc;
  late AddressCubit addressCubit;
  late NotificationCubit notificationCubit;
  late SearchHistoryService searchHistoryService;
  late UserProfile userProfile;

  Future<void> init({SharedPreferences? preferences, bool force = false}) async {
    if (_isInitialized && !force) return;

    final prefs = preferences ?? await SharedPreferences.getInstance();
    await AppConfig.initBackendSelection(prefs);
    authLocalDataSource = AuthLocalDataSourceImpl(sharedPreferences: prefs);

    // 1. Core Network & Data Sources
    apiClient = ApiClient(
      onRefreshToken: () => authRepository.refreshToken(),
      onSessionExpired: () {
        if (authRepository is AuthRepositoryImpl) {
          (authRepository as AuthRepositoryImpl).notifySessionExpired();
        }
      },
    );

    productRemoteDataSource = ProductRemoteDataSourceImpl(apiClient: apiClient);
    productRepository = ProductRepositoryImpl(remoteDataSource: productRemoteDataSource);

    authRemoteDataSource = AuthRemoteDataSourceImpl(apiClient: apiClient);
    authRepository = AuthRepositoryImpl(
      remoteDataSource: authRemoteDataSource,
      localDataSource: authLocalDataSource,
    );

    // 3. Domain Use Cases
    getProductsUseCase = GetProductsUseCase(productRepository);

    // 4. BLoCs / Cubits
    themeCubit = ThemeCubit(preferences: prefs);
    localeCubit = LocaleCubit(preferences: prefs);
    authBloc = AuthBloc(authRepository: authRepository);
    productBloc = ProductBloc(
      getProductsUseCase: getProductsUseCase,
      productRepository: productRepository,
    );
    cartBloc = CartBloc(preferences: prefs);
    wishlistBloc = WishlistBloc(preferences: prefs);
    orderBloc = OrderBloc(preferences: prefs);
    addressCubit = AddressCubit(preferences: prefs);
    notificationCubit = NotificationCubit(preferences: prefs);
    PushNotificationService.instance.init(notificationCubit: notificationCubit);
    searchHistoryService = SearchHistoryService(preferences: prefs);
    userProfile = UserProfile.defaultUser;

    _isInitialized = true;

    // Listen to session expiry to automatically log out
    _sessionSubscription?.cancel();
    _sessionSubscription = authRepository.sessionExpiredStream.listen((_) {
      authBloc.add(const AuthLogoutRequested());
    });

    // Fetch admin-configured financial settings and apply to CartBloc
    SettingsService.fetchFinancialSettings().then((settings) {
      cartBloc.add(CartFinancialSettingsUpdated(
        shippingFee: settings.shippingFee,
        taxRate: settings.taxRate,
        freeShippingThreshold: settings.freeShippingThreshold,
      ));
    });

    // Listen to real-time order updates from backend socket
    _socketOrderSubscription?.cancel();
    _socketOrderSubscription =
        SocketService.instance.orderUpdatesStream.listen((data) {
      final user = authBloc.state.user;
      final token = user?.token;
      if (token != null && token.isNotEmpty) {
        orderBloc.add(OrderFetchRequested(authToken: token, userId: user?.id));
      }
    });

    // Listen to real-time product updates from backend socket
    _socketProductSubscription?.cancel();
    _socketProductSubscription =
        SocketService.instance.productUpdatesStream.listen((data) {
      productBloc.add(const ProductLoadRequested());
    });

    // Automatically resync orders, cart, and wishlist whenever user logs in or logs out
    _authSubscription?.cancel();
    _authSubscription = authBloc.stream.listen((authState) {
      final user = authState.user;
      final token = user?.token;
      if (token != null && token.isNotEmpty) {
        orderBloc.add(OrderFetchRequested(authToken: token, userId: user?.id));
        cartBloc.add(CartRemoteFetchRequested(authToken: token));
        wishlistBloc.add(WishlistRemoteFetchRequested(authToken: token));
        SocketService.instance.connect(userId: user?.id, token: token);
      } else if (authState.status == AuthStatus.unauthenticated) {
        orderBloc.add(const OrderCleared());
        SocketService.instance.disconnect();
      }
    });

    // Fetch user orders, cart & wishlist and connect socket if initial cached token exists
    final cachedUser = authBloc.state.user;
    final cachedToken = cachedUser?.token;
    if (cachedToken != null && cachedToken.isNotEmpty) {
      orderBloc.add(OrderFetchRequested(authToken: cachedToken, userId: cachedUser?.id));
      cartBloc.add(CartRemoteFetchRequested(authToken: cachedToken));
      wishlistBloc.add(WishlistRemoteFetchRequested(authToken: cachedToken));
      SocketService.instance.connect(userId: cachedUser?.id, token: cachedToken);
    }
  }

  void reset() {
    _isInitialized = false;
    init(force: true);
  }

  void dispose() {
    _authSubscription?.cancel();
    _sessionSubscription?.cancel();
    _socketOrderSubscription?.cancel();
    _socketProductSubscription?.cancel();
    SocketService.instance.disconnect();
    themeCubit.close();
    localeCubit.close();
    authBloc.close();
    productBloc.close();
    cartBloc.close();
    wishlistBloc.close();
    orderBloc.close();
    addressCubit.close();
    notificationCubit.close();
    _isInitialized = false;
  }
}
