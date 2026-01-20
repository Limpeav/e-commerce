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
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Calculate total quantity in cart
  const cartItemCount = cart.reduce((total, item) => {
    if (!item.product) return total;
    return total + (item.quantity || 1);
  }, 0);

  const wishlistItemCount = wishlist.length;

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-stone-100/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="h-20 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 12 }}
              className="bg-primary-light/20 p-2.5 rounded-2xl transition-all duration-300"
            >
              <Baby className="w-7 h-7 text-primary" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-text-main tracking-tight font-display leading-none">
                ShopX
              </h1>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {/* Main Nav */}
            <div className="hidden md:flex items-center gap-1 mr-4">
              <Link
                to="/"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${isActive("/")
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-text-muted hover:text-primary hover:bg-stone-50"
                  }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <Link
                to="/wishlist"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative ${isActive("/wishlist")
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-text-muted hover:text-primary hover:bg-primary-light/10"
                  }`}
              >
                <div className="relative">
                  <Heart className="w-4 h-4" />
                  {wishlistItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-secondary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm ring-1 ring-secondary/20">
                      {wishlistItemCount}
                    </span>
                  )}
                </div>
                <span>Wishlist</span>
              </Link>

              <Link
                to="/cart"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 relative ${isActive("/cart")
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-text-muted hover:text-primary hover:bg-primary-light/10"
                  }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm ring-1 ring-primary/20">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span>Cart</span>
              </Link>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3 pl-4 border-l border-stone-100">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1 rounded-2xl hover:bg-stone-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-white font-black shadow-md border-2 border-white">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowDropdown(false)}
                        ></div>

                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden z-20"
                        >
                          <div className="px-6 py-6 bg-stone-50/50 border-b border-stone-100">
                            <p className="text-sm font-bold text-text-main leading-none mb-1">
                              {user.name}
                            </p>
                            <p className="text-xs text-text-muted font-medium truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="p-3">
                            <Link
                              to="/profile"
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-primary hover:bg-stone-50 transition-colors"
                            >
                              <User className="w-4 h-4" />
                              <span className="text-sm font-semibold">Profile</span>
                            </Link>

                            <Link
                              to="/orders"
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-primary hover:bg-stone-50 transition-colors"
                            >
                              <Package className="w-4 h-4" />
                              <span className="text-sm font-semibold">Orders</span>
                            </Link>

                            <div className="h-px bg-stone-100 my-2 mx-4"></div>

                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="text-sm font-bold">Logout</span>
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
                    className="hidden sm:inline-flex px-6 py-3 rounded-xl font-semibold text-sm text-text-muted hover:text-primary hover:bg-stone-50 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex px-6 py-3 rounded-xl font-semibold text-sm bg-text-main text-white hover:bg-primary transition-all shadow-xl shadow-stone-200 hover:shadow-primary/20 hover:-translate-y-0.5"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

