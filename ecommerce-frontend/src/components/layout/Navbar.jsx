import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Baby,
  ChevronDown,
  Heart,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NotificationPanel from "../NotificationPanel";

const QUICK_CATEGORIES = [
  "Diapers",
  "Milk & Feeding",
  "Clothing",
  "Toys",
  "Baby Care",
  "Strollers",
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("q") || "");
  }, [location.search]);

  useEffect(() => {
    setShowProfileDropdown(false);
    setShowCategoryDropdown(false);
    setShowMobileMenu(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const cartItemCount = cart.reduce((total, item) => {
    if (!item.product) return total;
    return total + (item.quantity || 1);
  }, 0);

  const wishlistItemCount = wishlist.length;

  const applySearchNavigation = (category = "") => {
    const params = new URLSearchParams();
    const query = searchValue.trim();

    if (query) {
      params.set("q", query);
    }

    if (category && category !== "All") {
      params.set("category", category);
    }

    navigate({
      pathname: "/",
      search: params.toString(),
      hash: "products",
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    applySearchNavigation();
    setShowMobileSearch(false);
    setShowMobileMenu(false);
    setShowCategoryDropdown(false);
  };

  const handleCategorySelect = (category) => {
    applySearchNavigation(category);
    setShowCategoryDropdown(false);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/wishlist", label: "Wishlist", icon: Heart, count: wishlistItemCount },
    { to: "/cart", label: "Cart", icon: ShoppingCart, count: cartItemCount },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] border-b border-primary/18 bg-gradient-to-r from-blue-soft/90 via-white/96 to-blue-soft/82 shadow-[0_10px_22px_rgba(124,179,228,0.16)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 -top-9 h-24 w-40 rounded-[44%] bg-blue-soft/85 shadow-[0_12px_20px_rgba(124,179,228,0.22)]" />
        <div className="absolute right-[36%] -top-6 h-18 w-32 rounded-[44%] bg-secondary-light/88 shadow-[0_10px_18px_rgba(124,179,228,0.20)]" />
        <div className="absolute right-10 top-0 h-20 w-32 rounded-[44%] bg-blue-soft/78 shadow-[0_10px_18px_rgba(124,179,228,0.18)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex h-[76px] items-center justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-white text-text-muted transition-colors hover:text-primary lg:hidden"
              aria-label="Open mobile menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-sm md:h-11 md:w-11">
                <Baby className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-display text-lg text-text-main md:text-xl">LittleNest</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-primary">Baby Essentials</p>
              </div>
            </Link>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden w-full max-w-lg items-center lg:flex"
            role="search"
            aria-label="Search products"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search diapers, milk, toys..."
              className="w-full rounded-2xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted/70 focus:border-primary focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3.5 py-2 text-sm font-semibold text-text-main transition-colors hover:border-primary hover:text-primary"
              >
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-primary/15 bg-white p-2 shadow-[0_16px_32px_rgba(116,178,226,0.12)]"
                  >
                    {QUICK_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-text-muted transition-colors hover:bg-blue-soft/45 hover:text-primary"
                      >
                        <Package className="w-4 h-4" />
                        {category}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileSearch((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-white text-text-muted transition-colors hover:text-primary lg:hidden"
              aria-label="Open search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            <Link
              to="/wishlist"
              className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-white text-text-muted transition-colors hover:text-primary sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="w-4.5 h-4.5" />
              {wishlistItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-text-main">
                  {wishlistItemCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              id="cart-icon"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-white text-text-muted transition-colors hover:text-primary"
              aria-label="Cart"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-text-main">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <div className="hidden md:block">{user && <NotificationPanel />}</div>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white p-1.5 transition-colors hover:bg-blue-soft/45"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown
                    className={`hidden h-4 w-4 text-text-muted sm:block ${showProfileDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close profile menu"
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProfileDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className="absolute right-0 z-20 mt-3 w-64 overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-[0_18px_40px_rgba(116,178,226,0.12)]"
                      >
                        <div className="border-b border-primary/10 bg-gradient-to-r from-blue-soft/82 to-cream px-5 py-4">
                          <p className="mb-1 text-sm font-semibold leading-none text-text-main">{user.name}</p>
                          <p className="truncate text-xs text-text-muted">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-text-muted hover:bg-primary/10 hover:text-primary"
                          >
                            <User className="w-4 h-4" />
                            <span className="text-sm font-semibold">Profile</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-text-muted hover:bg-primary/10 hover:text-primary"
                          >
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-semibold">Orders</span>
                          </Link>
                          <div className="mx-2 my-1 h-px bg-primary/12" />
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-text-muted hover:bg-red-50 hover:text-red-700"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-semibold">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-xl border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:bg-primary-hover"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-primary/15 bg-white px-4 py-3 lg:hidden"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search baby products"
                className="w-full rounded-xl border border-primary/20 bg-white py-2.5 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted/70 focus:border-primary focus:outline-none"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMobileMenu && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[90] bg-black/20 lg:hidden"
              aria-label="Close menu"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed inset-y-0 left-0 z-[95] w-[86%] max-w-sm overflow-y-auto border-r border-primary/15 bg-cream p-4 shadow-xl lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Browse</p>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-white"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-semibold ${
                        isActive(item.to)
                          ? "border-primary bg-blue-soft/45 text-primary"
                          : "border-primary/10 bg-white text-text-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </span>
                      {item.count > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-text-main">{item.count}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-primary/12 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Shop by Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className="rounded-xl border border-primary/15 bg-blue-soft/35 px-3 py-2.5 text-left text-xs font-semibold text-text-main"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {!user && (
                <div className="mt-6 space-y-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center rounded-xl border border-primary/20 bg-white py-2.5 text-sm font-semibold text-text-main"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-text-main"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
