import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import {
    User,
    ShoppingBag,
    Heart,
    Settings,
    LogOut,
    Briefcase,
    MapPin,
    CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../../hooks';

const ProfileSidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDark] = useDarkMode();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/profile', icon: User, label: 'My Profile' },
        { path: '/orders', icon: ShoppingBag, label: 'My Orders' },
        { path: '/wishlist', icon: Heart, label: 'Wishlist' },
        // { path: '/addresses', icon: MapPin, label: 'Address Book' }, // Future Implementation
        // { path: '/payment-methods', icon: CreditCard, label: 'Payment Methods' }, // Future Implementation
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className={`rounded-3xl border shadow-sm overflow-hidden sticky top-24 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100"}`}>
            {/* User Header */}
            <div className={`p-8 border-b flex flex-col items-center text-center ${isDark ? "border-slate-800 bg-slate-800/70" : "border-stone-100 bg-stone-50/50"}`}>
                <div className={`w-24 h-24 rounded-full border-4 shadow-md flex items-center justify-center overflow-hidden mb-4 ${isDark ? "bg-slate-900 border-slate-900" : "bg-white border-white"}`}>
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="bg-primary text-white text-3xl font-black w-full h-full flex items-center justify-center">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-bold text-text-main">{user?.name}</h2>
                <p className="text-sm text-text-muted font-medium mb-1">{user?.email}</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mt-2">
                    {user?.role === 'admin' ? 'Administrator' : 'Valued Customer'}
                </span>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 font-bold text-sm group relative overflow-hidden ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : isDark ? 'text-text-muted hover:bg-slate-800 hover:text-white' : 'text-text-muted hover:bg-stone-50 hover:text-text-main'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : isDark ? 'text-slate-500 group-hover:text-primary transition-colors' : 'text-stone-400 group-hover:text-primary transition-colors'}`} />
                                <span className="relative z-10">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute inset-0 bg-primary z-0"
                                        initial={{ borderRadius: 16 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                <div className={`pt-4 mt-4 border-t ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 transition-all font-bold text-sm group ${isDark ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-red-50 hover:text-red-600"}`}
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default ProfileSidebar;
