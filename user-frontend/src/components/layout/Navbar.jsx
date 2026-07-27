import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Home,
  Package,
  User,
  Heart,
  LogOut,
  ChevronDown,
  Baby,
  Menu,
  X,
  Settings,
  MapPin,
  HelpCircle,
  Info,
  LifeBuoy,
  Moon,
  Sun,
  Languages,
} from "lucide-react";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";
import { useAuth } from "../../context/useAuth";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../../hooks";
import { useScrollVisibility } from "../../hooks/useScrollVisibility";
import { useLanguage } from "../../context/useLanguage";
import { supportedLanguages } from "../../i18n/translations";
import { useToast } from "../../context/useToast";
import {
  CUSTOMER_ORDER_CREATED_EVENT,
  getMyOrders,
} from "../../services/orderService";
import { subscribeRealtimeDomains } from "../../services/realtime";
import BrandLogo from "../common/BrandLogo";

const LanguageSelect = ({ language, setLanguage, t, fullWidth = false }) => (
  <label
    className={`${fullWidth ? "flex w-full" : "inline-flex"} min-w-0 items-center gap-2 rounded-2xl border bg-[color:var(--color-surface-soft)] px-3 py-2 text-text-main`}
    style={{ borderColor: "var(--color-border)" }}
  >
    <Languages className="h-4 w-4 shrink-0 text-primary" />
    <span className="sr-only">{t("language.switch")}</span>
    <select
      value={language}
      onChange={(event) => setLanguage(event.target.value)}
      className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
      aria-label={t("language.switch")}
    >
      {supportedLanguages.map((item) => (
        <option key={item.code} value={item.code}>
          {t(item.labelKey)}
        </option>
      ))}
    </select>
  </label>
);

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, openCartDrawer } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { info } = useToast();
  const [isDark, , themeMode, setThemeMode] = useDarkMode();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isScrollNavbarVisible = useScrollVisibility({
    keepVisibleFocusSelector: "[data-product-search-input='true']",
  });
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const accountDropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isHomeActive = location.pathname === "/" || location.pathname === "/customer";
  const isProductDetailPage = /^\/(?:customer\/)?products\/[^/]+\/?$/.test(location.pathname);

  const refreshActiveOrderAlert = useCallback(async () => {
    try {
      const orders = await getMyOrders();
      setHasActiveOrder(
        Array.isArray(orders)
          && orders.some((order) => {
            const status = String(order?.orderStatus || "").trim();
            return status !== "Delivered" && status !== "Cancelled";
          })
      );
    } catch {
      setHasActiveOrder(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    Promise.resolve().then(refreshActiveOrderAlert);
    const handleOrderCreated = () => setHasActiveOrder(true);
    const unsubscribeRealtime = subscribeRealtimeDomains(
      ["orders"],
      refreshActiveOrderAlert
    );

    window.addEventListener(CUSTOMER_ORDER_CREATED_EVENT, handleOrderCreated);

    return () => {
      unsubscribeRealtime();
      window.removeEventListener(
        CUSTOMER_ORDER_CREATED_EVENT,
        handleOrderCreated
      );
    };
  }, [refreshActiveOrderAlert, user]);

  useEffect(() => {
    if (!showDropdown) return undefined;

    const handleOutsideClick = (event) => {
      if (!accountDropdownRef.current?.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [showDropdown]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showMobileMenu]);

  const cartItemCount = cart.reduce((total, item) => {
    if (!item.product) return total;
    return total + (item.quantity || 1);
  }, 0);

  const wishlistItemCount = wishlist.length;
  const shellClassName = isDark
    ? "bg-[#1A1C19]/88 text-text-main"
    : "bg-[#FCF9F5]/88 text-text-main";
  const panelClassName = isDark
    ? "bg-bg-card text-text-main"
    : "bg-bg-card text-text-main";
  const subtleSurfaceClassName = isDark
    ? "bg-[color:var(--color-surface-soft)] text-text-main"
    : "bg-[color:var(--color-surface-soft)] text-text-main";
  const mutedTextClassName = "text-text-muted";
  const themeConfig = {
    light: {
      icon: Sun,
      label: t("nav.light"),
      modeLabel: t("nav.lightMode"),
      ariaLabel: t("nav.switchToDark"),
    },
    dark: {
      icon: Moon,
      label: t("nav.dark"),
      modeLabel: t("nav.darkMode"),
      ariaLabel: t("nav.switchToLight"),
    },
  };
  const themeOrder = ["light", "dark"];
  const currentThemeIndex = themeOrder.includes(themeMode) ? themeOrder.indexOf(themeMode) : 0;
  const currentTheme = themeConfig[themeMode] || themeConfig.light;
  const CurrentThemeIcon = currentTheme.icon;
  const nextThemeMode = themeOrder[(currentThemeIndex + 1) % themeOrder.length];
  const nextTheme = themeConfig[nextThemeMode] || themeConfig.light;
  const handleThemeClick = () => setThemeMode(nextThemeMode);
  const homeLinkState = { scrollToTop: true };
  const isNavbarVisible =
    isProductDetailPage || isScrollNavbarVisible || showDropdown || showMobileMenu;
  const navbarVisibilityClassName = isNavbarVisible
    ? "translate-y-0 opacity-100 shadow-sm"
    : "-translate-y-full opacity-0 shadow-none pointer-events-none";

  const scrollHomeToTop = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  };

  const handleLogout = () => {
    logout();
    setHasActiveOrder(false);
    info(t("auth.logoutTitle"), t("auth.logoutMessage"));
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate("/customer");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] hidden transform-gpu border-b backdrop-blur-xl transition-[transform,opacity,box-shadow,background-color,color,border-color] duration-300 ease-out will-change-transform lg:block ${navbarVisibilityClassName} ${shellClassName}`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-20 flex justify-between items-center">
            {/* Logo */}
            <Link
              to="/customer"
              state={homeLinkState}
              onClick={scrollHomeToTop}
              className="flex items-center gap-3 group"
            >
              <Motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex h-12 w-12 items-center justify-center transition-all duration-300"
              >
                <BrandLogo className="h-full w-full object-contain" />
              </Motion.div>
              <h1 className="text-2xl font-bold text-text-main tracking-tight font-display leading-none">
                Cherish Baby Store
              </h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-4">
                <Link
                  to="/customer"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${isHomeActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : `${mutedTextClassName} hover:bg-primary/10 hover:text-primary`
                    }`}
                >
                  <Home className="w-4 h-4" />
                  <span>{t("nav.home")}</span>
                </Link>

                <Link
                  to="/customer/wishlist"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border-2 relative ${isActive("/customer/wishlist")
                    ? `${isDark ? '[background:linear-gradient(#242723,#242723)_padding-box,linear-gradient(to_right,#A7C7AD,#D4A38B)_border-box] text-text-main' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#8DAA91,#E6BAA3)_border-box] text-primary'} border-transparent shadow-lg shadow-primary/10`
                    : `bg-transparent border-transparent ${mutedTextClassName} hover:bg-primary/10 hover:text-primary`
                    }`}
                >
                  <div className="relative">
                    <Heart className={`w-5 h-5 ${isActive("/customer/wishlist") ? "text-primary" : ""}`} />
                    <AnimatePresence mode="wait">
                      {wishlistItemCount > 0 && (
                        <Motion.span
                          key={wishlistItemCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-md ring-2 ring-white"
                        >
                          {wishlistItemCount}
                        </Motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>{t("nav.wishlist")}</span>
                </Link>

                <button
                  type="button"
                  data-cart-target="true"
                  onClick={openCartDrawer}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative ${isActive("/customer/cart")
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : `${mutedTextClassName} hover:bg-primary/10 hover:text-primary`
                    }`}
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    <AnimatePresence mode="wait">
                      {cartItemCount > 0 && (
                        <Motion.span
                          key={cartItemCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-md ring-2 ring-white"
                        >
                          {cartItemCount}
                        </Motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>{t("nav.cart")}</span>
                </button>
              </div>

              {/* Desktop Auth */}
              <div className="flex items-center gap-3 border-l pl-4" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={handleThemeClick}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${subtleSurfaceClassName}`}
                  aria-label={nextTheme.ariaLabel}
                  title={nextTheme.ariaLabel}
                >
                  <CurrentThemeIcon className="h-4 w-4 text-text-main" />
                  <span>{currentTheme.label}</span>
                </button>
                <LanguageSelect language={language} setLanguage={setLanguage} t={t} />
                {user ? (
                  <div ref={accountDropdownRef} className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 rounded-2xl p-1 transition-colors hover:bg-primary/10"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-gradient-to-tr from-primary to-primary-light font-black text-white shadow-md"
                        style={{ borderColor: isDark ? "#1A1C19" : "#FFFFFF" }}
                      >
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-text-muted transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showDropdown && (
                        <Motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute right-0 z-20 mt-3 w-64 overflow-hidden rounded-[2rem] border shadow-2xl ${panelClassName}`}
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            <div className="border-b bg-primary/8 px-6 py-6" style={{ borderColor: "var(--color-border)" }}>
                              <p className="text-sm font-bold text-text-main leading-none mb-1">{user.name}</p>
                              <p className="text-xs text-text-muted font-medium truncate">{user.email}</p>
                            </div>
                            <div className="p-3">
                              <Link to="/customer/profile" onClick={() => setShowDropdown(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${mutedTextClassName} hover:bg-primary/10 hover:text-primary`}>
                                <User className="w-4 h-4" /><span className="text-sm font-semibold">{t("nav.profile")}</span>
                              </Link>
                              <Link to="/customer/orders" onClick={() => setShowDropdown(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${mutedTextClassName} hover:bg-primary/10 hover:text-primary`}>
                                <Package className="w-4 h-4" />
                                <span className="text-sm font-semibold">{t("nav.myOrders")}</span>
                                {hasActiveOrder && (
                                  <span
                                    className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm"
                                    aria-label="1 active order"
                                  >
                                    1
                                  </span>
                                )}
                              </Link>
                              <Link to="/customer/support/tickets" onClick={() => setShowDropdown(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${mutedTextClassName} hover:bg-primary/10 hover:text-primary`}>
                                <LifeBuoy className="w-4 h-4" />
                                <span className="text-sm font-semibold">Support Tickets</span>
                              </Link>
                              <div className="mx-4 my-2 h-px" style={{ backgroundColor: "var(--color-border)" }}></div>
                              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-text-muted transition-colors hover:bg-secondary/15 hover:text-secondary">
                                <LogOut className="w-4 h-4" /><span className="text-sm font-bold">{t("nav.logout")}</span>
                              </button>
                            </div>
                          </Motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/login"
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${subtleSurfaceClassName} hover:bg-primary/10 hover:text-primary`}
                      title={t("nav.loginRegister")}
                    >
                      <User className="w-6 h-6" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header - Compact & Sticky */}
      <nav
        className={`safe-area-top fixed top-0 left-0 right-0 z-[90] transform-gpu border-b backdrop-blur-xl transition-[transform,opacity,box-shadow,background-color,color,border-color] duration-300 ease-out will-change-transform lg:hidden ${navbarVisibilityClassName} ${isDark ? "bg-[#1A1C19]/95" : "bg-[#FCF9F5]/95"}`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="px-4 h-16 flex justify-between items-center">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="ml-[-0.375rem] rounded-xl p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link
              to="/customer"
              state={homeLinkState}
              onClick={scrollHomeToTop}
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center">
                <BrandLogo className="h-full w-full object-contain" />
              </div>
              <h1 className="text-[1.1rem] font-bold text-text-main font-display tracking-tight">Cherish Baby Store</h1>
            </Link>
          </div>

          {/* Right: Cart & Profile/Auth */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleThemeClick}
              className="rounded-full p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
              aria-label={nextTheme.ariaLabel}
              title={nextTheme.ariaLabel}
            >
              <CurrentThemeIcon className="w-5 h-5" />
            </button>

            <Link to="/customer/wishlist" className="relative rounded-full p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary">
              <Heart className="w-5 h-5" />
              {wishlistItemCount > 0 && (
                <span className={`absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-white ring-2 ${isDark ? "ring-[#1A1C19]" : "ring-white"}`}>
                  {wishlistItemCount > 9 ? "9+" : wishlistItemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              data-cart-target="true"
              onClick={openCartDrawer}
              className="relative rounded-full p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
              aria-label={t("nav.cart")}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className={`absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ${isDark ? "ring-[#1A1C19]" : "ring-white"}`}>
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </button>

            {user ? (
              <Link to="/customer/profile" className="ml-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
            ) : (
              <Link to="/login" className="rounded-full p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Slide-in Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[110]"
              onClick={() => setShowMobileMenu(false)}
            />
            <Motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 z-[120] flex h-dvh w-[min(88vw,360px)] max-w-[calc(100vw-3rem)] flex-col shadow-2xl transition-colors duration-300 ${panelClassName}`}
            >
              {/* User Info Header */}
              <div className="border-b bg-primary/8 px-5 pt-6 pb-4" style={{ borderColor: "var(--color-border)" }}>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white text-lg font-black shadow-md">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-main text-sm truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <button onClick={() => setShowMobileMenu(false)} className="rounded-xl p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-text-main">{t("nav.welcome")}</p>
                    <button onClick={() => setShowMobileMenu(false)} className="rounded-xl p-2 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="flex-1 space-y-1 overflow-y-auto p-4 pb-6">
                <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">{t("nav.browse")}</p>
                {[
                  { to: "/customer", icon: Home, label: t("nav.home") },
                  { to: "/customer/wishlist", icon: Heart, label: t("nav.wishlist"), badge: wishlistItemCount },
                  { to: "/customer/cart", icon: ShoppingCart, label: t("nav.cart"), badge: cartItemCount },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${(item.to === "/customer" ? isHomeActive : isActive(item.to))
                      ? "bg-primary/10 text-primary"
                      : `${mutedTextClassName} hover:bg-primary/10 hover:text-primary`
                      }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleThemeClick}
                  className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-text-main transition-all hover:bg-primary/15"
                  aria-label={nextTheme.ariaLabel}
                >
                  <CurrentThemeIcon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 leading-snug">{currentTheme.modeLabel}</span>
                </button>

                <LanguageSelect language={language} setLanguage={setLanguage} t={t} fullWidth />

                {user && (
                  <>
                    <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">{t("nav.account")}</p>
                    {[
                      { to: "/customer/profile", icon: User, label: t("nav.profile") },
                      { to: "/customer/orders", icon: Package, label: t("nav.myOrders"), showPendingAlert: true },
                      { to: "/customer/support/tickets", icon: LifeBuoy, label: "Support Tickets" },
                      { to: "/customer/settings", icon: Settings, label: t("nav.settings") },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${isActive(item.to)
                          ? "bg-primary/10 text-primary"
                          : `${mutedTextClassName} hover:bg-primary/10 hover:text-primary`
                          }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                        {item.showPendingAlert && hasActiveOrder && (
                          <span
                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm"
                            aria-label="1 active order"
                          >
                            1
                          </span>
                        )}
                      </Link>
                    ))}
                  </>
                )}

                <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">{t("nav.more")}</p>
                {[
                  { to: "/about", icon: Info, label: t("nav.about") },
                  { to: "/contact", icon: HelpCircle, label: t("nav.contact") },
                  { to: "/location", icon: MapPin, label: t("nav.location") },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : `${mutedTextClassName} hover:bg-primary/10 hover:text-primary`
                      }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="shrink-0 border-t p-4" style={{ borderColor: "var(--color-border)" }}>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/15 px-4 py-3 text-sm font-bold text-secondary transition-colors hover:bg-secondary/25"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("nav.logout")}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setShowMobileMenu(false)} className="block w-full rounded-2xl bg-primary/10 px-4 py-3 text-center text-sm font-bold text-text-main transition-colors hover:bg-primary/15">
                      {t("nav.login")}
                    </Link>
                    <Link to="/register" onClick={() => setShowMobileMenu(false)} className="block w-full text-center px-4 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                      {t("nav.register")}
                    </Link>
                  </div>
                )}
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>


    </>
  );
}
