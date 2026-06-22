import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Package, User } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

const TAB_ITEMS = [
  {
    id: 'home',
    to: '/customer',
    exact: true,
    icon: Home,
    labelKey: 'nav.home',
  },
  {
    id: 'products',
    to: '/customer/products',
    icon: Grid,
    labelKey: 'nav.products',
    matchPrefixes: ['/products', '/customer/products', '/deals', '/customer/deals'],
  },
  {
    id: 'cart',
    to: '/customer/cart',
    icon: ShoppingCart,
    labelKey: 'nav.cart',
    matchPrefixes: ['/cart', '/customer/cart'],
    hasBadge: true,
  },
  {
    id: 'orders',
    to: '/customer/orders',
    icon: Package,
    labelKey: 'nav.myOrders',
    matchPrefixes: ['/orders', '/customer/orders'],
    requiresAuth: true,
  },
  {
    id: 'profile',
    to: '/login',
    toAuth: '/customer/profile',
    icon: User,
    labelKey: 'nav.profile',
    matchPrefixes: ['/profile', '/customer/profile', '/login', '/register'],
  },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { cart } = useCart();
  const [isDark] = useDarkMode();
  const { t } = useLanguage();

  const cartItemCount = cart.reduce((total, item) => {
    if (!item.product) return total;
    return total + (item.quantity || 1);
  }, 0);

  const isTabActive = (tab) => {
    const path = location.pathname;
    if (tab.exact) {
      return path === tab.to || path === '/';
    }
    if (tab.matchPrefixes) {
      return tab.matchPrefixes.some((prefix) => path.startsWith(prefix));
    }
    const dest = user && tab.toAuth ? tab.toAuth : tab.to;
    return path.startsWith(dest);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[90] lg:hidden border-t transition-colors duration-300 ${
        isDark
          ? 'bg-[#1A1C19]/96 border-slate-800'
          : 'bg-[#FCF9F5]/96 border-stone-200'
      } backdrop-blur-xl`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >
      <div className="flex items-stretch justify-around h-16">
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab);
          const dest =
            tab.id === 'profile'
              ? user
                ? '/customer/profile'
                : '/login'
              : tab.requiresAuth && !user
              ? '/login'
              : tab.to;

          return (
            <Link
              key={tab.id}
              to={dest}
              className={`relative flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-colors duration-200 ${
                active
                  ? 'text-primary'
                  : isDark
                  ? 'text-slate-500 hover:text-slate-300'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active indicator pill */}
              <AnimatePresence>
                {active && (
                  <Motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-primary"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with badge */}
              <div className="relative">
                <Motion.div
                  animate={active ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
                </Motion.div>

                {/* Cart badge */}
                <AnimatePresence>
                  {tab.hasBadge && cartItemCount > 0 && (
                    <Motion.span
                      key={cartItemCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-black text-white ring-2 ${
                        isDark ? 'ring-[#1A1C19]' : 'ring-[#FCF9F5]'
                      }`}
                    >
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </Motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold leading-none transition-all duration-200 ${
                  active ? 'opacity-100' : 'opacity-60'
                }`}
              >
                {t(tab.labelKey, { defaultValue: tab.id })}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
