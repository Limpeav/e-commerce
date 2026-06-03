import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
    User,
    ShoppingBag,
    Heart,
    Settings,
    LogOut,
    Shield
} from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { useToast } from '../../context/ToastContext';

const ProfileSidebar = ({ activeTab = 'edit', onTabChange = () => {}, variant = 'desktop' }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isDark] = useDarkMode();
    const { t } = useLanguage();
    const { info } = useToast();

    const handleLogout = () => {
        logout();
        info(t('auth.logoutTitle'), t('auth.logoutMessage'));
        navigate('/login');
    };

    const profileTabs = [
        { id: 'edit', icon: User, label: t('profile.profileDetails') },
        { id: 'security', icon: Shield, label: t('profile.securityLogin') },
    ];

    const routeItems = [
        { path: '/customer/orders', icon: ShoppingBag, label: t('profile.myOrders') },
        { path: '/customer/wishlist', icon: Heart, label: t('profile.wishlist') },
        { path: '/customer/settings', icon: Settings, label: t('profile.settings') },
    ];

    if (variant === 'mobile') {
        return (
            <nav
                className={`no-scrollbar sticky top-16 z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-y px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden ${
                    isDark ? "border-slate-800 bg-[#1A1C1B]/92" : "border-stone-200 bg-[#FCF9F5]/92"
                }`}
                aria-label={t('profile.myProfile')}
            >
                {profileTabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onTabChange(item.id)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                            activeTab === item.id
                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                : isDark
                                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-primary/50 hover:text-primary-light'
                                  : 'border-stone-200 bg-white text-stone-600 hover:border-primary/40 hover:text-primary'
                        }`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </button>
                ))}
                {routeItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                isActive
                                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                                    : isDark
                                      ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-primary/50 hover:text-primary-light'
                                      : 'border-stone-200 bg-white text-stone-600 hover:border-primary/40 hover:text-primary'
                            }`
                        }
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </NavLink>
                ))}
                <button
                    type="button"
                    onClick={handleLogout}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        isDark
                            ? 'border-secondary/40 bg-slate-900 text-slate-200 hover:bg-secondary/10 hover:text-secondary'
                            : 'border-secondary/50 bg-white text-stone-700 hover:bg-secondary/10 hover:text-secondary'
                    }`}
                >
                    <LogOut className="h-4 w-4" />
                    {t('profile.signOut')}
                </button>
            </nav>
        );
    }

    return (
        <aside className={`hidden rounded-3xl border p-3 shadow-sm lg:block transition-colors duration-300 ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-white/95 border-stone-100"}`}>
            <div className="px-4 pb-3 pt-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">{t('nav.account')}</p>
            </div>

            <nav className="space-y-1">
                {profileTabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onTabChange(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                            activeTab === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-primary-light' : 'text-text-muted hover:bg-stone-50 hover:text-primary'
                        }`}
                    >
                        <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-white' : 'text-stone-400 group-hover:text-primary'}`} />
                        <span>{item.label}</span>
                    </button>
                ))}

                <div className={`my-3 h-px ${isDark ? "bg-slate-800" : "bg-stone-100"}`} />

                {routeItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-primary-light' : 'text-text-muted hover:bg-stone-50 hover:text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-primary'}`} />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                <div className={`pt-4 mt-4 border-t ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                    <button
                        onClick={handleLogout}
                        className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${isDark ? "border-secondary/40 text-slate-100 hover:bg-secondary/10 hover:text-secondary" : "border-secondary/50 text-stone-700 hover:bg-secondary/10 hover:text-secondary"}`}
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {t('profile.signOut')}
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default ProfileSidebar;
