import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Home,
  Package,
  User,
  UserPlus,
  Heart,
  LogOut,
  ChevronDown,
  Baby,
  Menu,
  X,
  Search,
  Settings,
  MapPin,
  HelpCircle,
  Info,
  Moon,
  Sun,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../../hooks";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const [isDark, toggleDarkMode] = useDarkMode();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowDropdown(false);
  }, [location.pathname]);

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
    ? "bg-slate-950/85 border-slate-800 text-slate-100"
    : "bg-white/80 border-stone-100/50 text-text-main";
  const panelClassName = isDark
    ? "bg-slate-900 border-slate-800 text-slate-100"
    : "bg-white border-stone-100 text-text-main";
  const subtleSurfaceClassName = isDark
    ? "bg-slate-800/80 border-slate-700 text-slate-200"
    : "bg-stone-50 border-stone-100 text-text-main";
  const mutedTextClassName = isDark ? "text-slate-400" : "text-text-muted";

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate("/");
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl border-b hidden md:block transition-colors duration-300 ${shellClassName}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-20 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 12 }}
                className="bg-primary-light/20 p-2.5 rounded-2xl transition-all duration-300"
              >
                <Baby className="w-7 h-7 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold text-text-main tracking-tight font-display leading-none">
                ShopX
              </h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-4">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${isActive("/")
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : `${mutedTextClassName} hover:text-primary ${isDark ? "hover:bg-slate-800" : "hover:bg-stone-50"}`
                    }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>

                <Link
                  to="/wishlist"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border-2 relative ${isActive("/wishlist")
                    ? `${isDark ? '[background:linear-gradient(#020617,#020617)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box] text-slate-100' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box] text-indigo-600'} border-transparent shadow-lg shadow-indigo-500/10`
                    : `bg-transparent border-transparent ${mutedTextClassName} hover:text-indigo-600`
                    }`}
                >
                  <div className="relative">
                    <Heart className={`w-5 h-5 ${isActive("/wishlist") ? "text-indigo-600" : ""}`} />
                    <AnimatePresence mode="wait">
                      {wishlistItemCount > 0 && (
                        <motion.span
                          key={wishlistItemCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-white"
                        >
                          {wishlistItemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>Wishlist</span>
                </Link>

                <Link
                  to="/cart"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative ${isActive("/cart")
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : `${mutedTextClassName} hover:text-primary ${isDark ? "hover:bg-slate-800" : "hover:bg-primary-light/10"}`
                    }`}
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    <AnimatePresence mode="wait">
                      {cartItemCount > 0 && (
                        <motion.span
                          key={cartItemCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-white"
                        >
                          {cartItemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>Cart</span>
                </Link>
              </div>

              {/* Desktop Auth */}
              <div className={`flex items-center gap-3 pl-4 border-l ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                <button
                  type="button"
                  onClick={() => toggleDarkMode()}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${subtleSurfaceClassName}`}
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                  title={`Switch to ${isDark ? "light" : "dark"} mode`}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>{isDark ? "Light" : "Dark"}</span>
                </button>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className={`flex items-center gap-2 p-1 rounded-2xl transition-colors ${isDark ? "hover:bg-slate-800" : "hover:bg-stone-50"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white font-black shadow-md border-2 ${isDark ? "border-slate-900" : "border-white"}`}>
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${isDark ? "text-slate-500" : "text-stone-400"} ${showDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute right-0 mt-3 w-64 rounded-[2rem] shadow-2xl border overflow-hidden z-20 ${panelClassName}`}
                          >
                            <div className={`px-6 py-6 border-b ${isDark ? "bg-slate-800/70 border-slate-800" : "bg-stone-50/50 border-stone-100"}`}>
                              <p className="text-sm font-bold text-text-main leading-none mb-1">{user.name}</p>
                              <p className="text-xs text-text-muted font-medium truncate">{user.email}</p>
                            </div>
                            <div className="p-3">
                              <Link to="/profile" onClick={() => setShowDropdown(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${mutedTextClassName} hover:text-primary ${isDark ? "hover:bg-slate-800" : "hover:bg-stone-50"}`}>
                                <User className="w-4 h-4" /><span className="text-sm font-semibold">Profile</span>
                              </Link>
                              <Link to="/orders" onClick={() => setShowDropdown(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${mutedTextClassName} hover:text-primary ${isDark ? "hover:bg-slate-800" : "hover:bg-stone-50"}`}>
                                <Package className="w-4 h-4" /><span className="text-sm font-semibold">Orders</span>
                              </Link>
                              <div className={`h-px my-2 mx-4 ${isDark ? "bg-slate-800" : "bg-stone-100"}`}></div>
                              <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:bg-red-500/10" : "text-stone-400 hover:bg-red-50"} hover:text-red-500`}>
                                <LogOut className="w-4 h-4" /><span className="text-sm font-bold">Logout</span>
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/login"
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${subtleSurfaceClassName} hover:text-primary ${isDark ? "hover:bg-slate-800" : "hover:bg-primary-light/10"}`}
                      title="Login / Register"
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
      <nav className={`fixed top-0 left-0 right-0 z-[90] backdrop-blur-xl border-b md:hidden safe-area-top transition-colors duration-300 ${isDark ? "bg-slate-950/95 border-slate-800" : "bg-white/95 border-stone-100"}`}>
        <div className="px-4 h-16 flex justify-between items-center">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className={`p-1.5 -ml-1.5 rounded-xl transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-50"}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary-light/10 p-1.5 rounded-xl">
                <Baby className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-[1.1rem] font-bold text-text-main font-display tracking-tight">ShopX</h1>
            </Link>
          </div>

          {/* Right: Wishlist, Cart & Profile/Auth */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleDarkMode()}
              className={`p-2 rounded-full transition-colors ${isDark ? "text-amber-300 hover:bg-slate-800" : "text-slate-700 hover:bg-stone-100"}`}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link to="/wishlist" className={`relative p-2 rounded-full transition-all duration-300 border-2 ${isActive("/wishlist") ? `${isDark ? '[background:linear-gradient(#0f172a,#0f172a)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]' : '[background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#4f46e5,#f43f5e)_border-box]'} border-transparent shadow-md shadow-indigo-500/10 text-indigo-600` : `bg-transparent border-transparent ${isDark ? "text-slate-300" : "text-stone-600"} hover:text-indigo-600`}`}>
              <Heart className="w-5 h-5" />
              {wishlistItemCount > 0 && (
                <span className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold ring-2 ${isDark ? "ring-slate-950" : "ring-white"}`}>
                  {wishlistItemCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className={`relative p-2 rounded-full transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-50"}`}>
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-indigo-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold ring-2 ${isDark ? "ring-slate-950" : "ring-white"}`}>
                  {cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link to="/profile" className="ml-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>
            ) : (
              <Link to="/login" className={`p-2 rounded-full transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-50"}`}>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[110]"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] z-[120] shadow-2xl overflow-y-auto transition-colors duration-300 ${panelClassName}`}
            >
              {/* User Info Header */}
              <div className={`px-5 pt-6 pb-4 border-b ${isDark ? "border-slate-800 bg-slate-800/70" : "border-stone-100 bg-stone-50/50"}`}>
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white text-lg font-black shadow-md">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-main text-sm truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <button onClick={() => setShowMobileMenu(false)} className={`p-2 rounded-xl ${isDark ? "text-slate-500 hover:text-white" : "text-stone-400 hover:text-text-main"}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-text-main">Welcome!</p>
                    <button onClick={() => setShowMobileMenu(false)} className={`p-2 rounded-xl ${isDark ? "text-slate-500 hover:text-white" : "text-stone-400 hover:text-text-main"}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-2 pb-2 ${isDark ? "text-slate-500" : "text-stone-400"}`}>Browse</p>
                {[
                  { to: "/", icon: Home, label: "Home" },
                  { to: "/wishlist", icon: Heart, label: "Wishlist", badge: wishlistItemCount },
                  { to: "/cart", icon: ShoppingCart, label: "Cart", badge: cartItemCount },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : `${mutedTextClassName} ${isDark ? "hover:bg-slate-800 hover:text-white" : "hover:bg-stone-50 hover:text-text-main"}`
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="min-w-[22px] h-[22px] bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={() => toggleDarkMode()}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${isDark ? "bg-slate-800 text-amber-300" : "bg-stone-50 text-slate-700"}`}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{isDark ? "Light mode" : "Dark mode"}</span>
                </button>

                {user && (
                  <>
                    <p className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-2 ${isDark ? "text-slate-500" : "text-stone-400"}`}>Account</p>
                    {[
                      { to: "/profile", icon: User, label: "Profile" },
                      { to: "/orders", icon: Package, label: "My Orders" },
                      { to: "/settings", icon: Settings, label: "Settings" },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${isActive(item.to)
                          ? "bg-primary/10 text-primary"
                          : `${mutedTextClassName} ${isDark ? "hover:bg-slate-800 hover:text-white" : "hover:bg-stone-50 hover:text-text-main"}`
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </>
                )}

                <p className={`text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-2 ${isDark ? "text-slate-500" : "text-stone-400"}`}>More</p>
                {[
                  { to: "/about", icon: Info, label: "About Us" },
                  { to: "/contact", icon: HelpCircle, label: "Contact" },
                  { to: "/location", icon: MapPin, label: "Store Location" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : `${mutedTextClassName} ${isDark ? "hover:bg-slate-800 hover:text-white" : "hover:bg-stone-50 hover:text-text-main"}`
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className={`p-4 mt-auto border-t ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-red-500 font-bold text-sm transition-colors ${isDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"}`}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" className={`block w-full text-center px-4 py-3 rounded-2xl font-bold text-sm transition-colors ${isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-stone-100 text-text-main hover:bg-stone-200"}`}>
                      Login
                    </Link>
                    <Link to="/register" className="block w-full text-center px-4 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </>
  );
}
