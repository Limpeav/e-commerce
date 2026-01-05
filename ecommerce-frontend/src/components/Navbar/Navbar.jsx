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
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Calculate total quantity in cart
  const cartItemCount = cart.reduce((total, item) => {
    return total + (item.quantity || 1);
  }, 0);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl sticky top-0 z-50 border-b border-slate-700/50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl transform group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ShopX
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {/* Main Nav */}
            <div className="flex items-center gap-1 mr-4">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive("/")
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              <Link
                to="/wishlist"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 relative ${
                  isActive("/wishlist")
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Wishlist</span>
              </Link>

              <Link
                to="/cart"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 relative ${
                  isActive("/cart")
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Cart</span>
              </Link>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
              {user ? (
                // Logged In - Show User Menu
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-slate-700/50 bg-slate-800/50 border border-slate-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs text-gray-400">
                        Welcome back
                      </span>
                      <span className="text-sm font-semibold text-white leading-tight">
                        {user.name || "User"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      ></div>

                      {/* Dropdown Content */}
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-20 animate-fadeIn">
                        {/* User Info */}
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-b border-slate-700">
                          <p className="text-sm font-semibold text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              My Profile
                            </span>
                          </Link>

                          <Link
                            to="/orders"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              My Orders
                            </span>
                          </Link>

                          <div className="my-1 border-t border-slate-700"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Not Logged In - Show Login/Register
                <div className="flex items-center gap-1">
                  <Link
                    to="/login"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive("/login")
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">Login</span>
                  </Link>

                  <Link
                    to="/register"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      isActive("/register")
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden md:inline">Register</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}
