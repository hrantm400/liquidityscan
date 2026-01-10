import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

const MainLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser, token, isAdmin } = useAuthStore();
    const [loading, setLoading] = useState(true);

    // Fetch user profile if we have a token but no user data, and protect routes
    useEffect(() => {
        const fetchProfile = async () => {
            // MainLayout is only used for protected routes, so if no token, redirect to login
            if (!token) {
                navigate('/login', { replace: true });
                setLoading(false);
                return;
            }

            // Fetch profile if we have token but no user data, or if isAdmin is not set
            if (token && (!user || user.isAdmin === undefined)) {
                try {
                    const profile = await authApi.getProfile();
                    setUser(profile);
                } catch (error) {
                    // If profile fetch fails, user might not be authenticated
                    console.error('Failed to fetch profile:', error);
                    navigate('/login', { replace: true });
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, [token, user, setUser, navigate]);

    const isActive = (path: string) => {
        const currentPath = location.pathname || '/';
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return currentPath === normalizedPath || currentPath.startsWith(normalizedPath + '/')
            ? 'bg-primary/10 border-l-4 border-l-primary dark:text-white light:text-text-dark' 
            : 'dark:text-gray-500 light:text-text-light-secondary dark:hover:text-white light:hover:text-text-dark dark:hover:bg-white/5 light:hover:bg-green-100';
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';
    const displayEmail = user?.email || '';
    const subscriptionPlan = user?.subscriptionId ? 'Pro Plan' : 'Free Plan';

    return (
        <div className="flex h-screen w-full selection:bg-primary selection:text-black overflow-hidden font-sans dark:bg-background-dark dark:text-white light:bg-background-light light:text-text-dark">
            <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern bg-[length:24px_24px] dark:opacity-50 light:opacity-30"></div>
            <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Sidebar */}
            <aside className="relative z-50 flex w-72 flex-col glass-sidebar h-full shrink-0 transition-opacity duration-300 group/sidebar overflow-hidden">
                {/* Top section - Logo */}
                <div className="p-6 pb-4 shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary ring-1 ring-primary/40 shadow-[0_0_15px_rgba(19,236,55,0.3)]">
                            <span className="material-symbols-outlined text-2xl">waves</span>
                        </div>
                        <div>
                            <h1 className="dark:text-white light:text-text-dark text-lg font-black tracking-wider leading-none">LIQUIDITY</h1>
                            <h2 className="text-primary text-xs font-bold tracking-[0.2em] leading-tight">SCANNER</h2>
                        </div>
                    </div>
                    <Link 
                        to="/" 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg dark:bg-white/5 light:bg-green-50 dark:hover:bg-white/10 light:hover:bg-green-100 dark:text-gray-400 light:text-text-light-secondary dark:hover:text-white light:hover:text-text-dark transition-all text-sm font-medium border dark:border-white/10 light:border-green-300/50"
                    >
                        <span className="material-symbols-outlined text-base">home</span>
                        <span>Back to Landing</span>
                    </Link>
                </div>

                {/* Middle section - Navigation (scrollable) */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4">
                    <div className="flex flex-col gap-8 pb-4">
                        {/* SCANNER Dashboard */}
                        <div className="flex flex-col gap-2">
                            <p className="px-4 text-xs font-bold tracking-widest dark:text-gray-500 light:text-text-light-secondary uppercase">SCANNER Dashboard</p>

                            <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all ${isActive('/dashboard')}`}>
                                <span className="material-symbols-outlined transition-colors">dashboard</span>
                                <span className="text-sm font-bold">Dashboard</span>
                            </Link>

                            <Link to="/monitor/superengulfing" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/monitor/superengulfing')}`}>
                                <span className="material-symbols-outlined transition-colors">candlestick_chart</span>
                                <span className="text-sm font-medium">SuperEngulfing</span>
                            </Link>

                            <Link to="/monitor/bias" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/monitor/bias')}`}>
                                <span className="material-symbols-outlined transition-colors">timeline</span>
                                <span className="text-sm font-medium">Bias</span>
                            </Link>

                            <Link to="/monitor/rsi" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/monitor/rsi')}`}>
                                <span className="material-symbols-outlined transition-colors">hub</span>
                                <span className="text-sm font-medium">RSI Divergence</span>
                            </Link>
                        </div>

                        {/* STRATEGIES Dashboard */}
                        <div className="flex flex-col gap-2">
                            <p className="px-4 text-xs font-bold tracking-widest dark:text-gray-500 light:text-text-light-secondary uppercase">STRATEGIES Dashboard</p>

                            <Link to="/strategies" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/strategies')}`}>
                                <span className="material-symbols-outlined transition-colors">dashboard</span>
                                <span className="text-sm font-medium">Strategies Dashboard</span>
                            </Link>
                        </div>

                        {/* TOOLS Dashboard */}
                        <div className="flex flex-col gap-2">
                            <p className="px-4 text-xs font-bold tracking-widest dark:text-gray-500 light:text-text-light-secondary uppercase">TOOLS Dashboard</p>

                            <Link to="/tools" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/tools')}`}>
                                <span className="material-symbols-outlined transition-colors">dashboard</span>
                                <span className="text-sm font-medium">Tools Dashboard</span>
                            </Link>
                        </div>

                        {/* Other Pages */}
                        <div className="flex flex-col gap-2">
                            <Link to="/academy" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/academy')}`}>
                                <span className="material-symbols-outlined transition-colors">school</span>
                                <span className="text-sm font-medium">Academy</span>
                            </Link>

                            <Link to="/daily-recap" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/daily-recap')}`}>
                                <span className="material-symbols-outlined transition-colors">summarize</span>
                                <span className="text-sm font-medium">Daily Recap</span>
                            </Link>

                            <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/settings')}`}>
                                <span className="material-symbols-outlined transition-colors">settings</span>
                                <span className="text-sm font-medium">Settings</span>
                            </Link>

                            <Link to="/subscription" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/subscription')}`}>
                                <span className="material-symbols-outlined transition-colors">card_membership</span>
                                <span className="text-sm font-medium">Subscription</span>
                            </Link>

                            <Link to="/support" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/support')}`}>
                                <span className="material-symbols-outlined transition-colors">help</span>
                                <span className="text-sm font-medium">Support</span>
                            </Link>

                            {/* Admin Panel Link - only for admins */}
                            {isAdmin && (
                                <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all border-2 ${isActive('/admin') ? 'bg-red-500/20 border-red-500/30 dark:text-red-400 light:text-red-600' : 'border-red-500/20 dark:text-red-400 light:text-red-600 hover:bg-red-500/10'}`}>
                                    <span className="material-symbols-outlined transition-colors">admin_panel_settings</span>
                                    <span className="text-sm font-bold">Admin Panel</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom section - Theme Toggle & User Profile (always visible) */}
                <div className="shrink-0 p-4 pt-3 border-t dark:border-white/5 light:border-green-300 space-y-2 dark:bg-black/20 light:bg-white/50 backdrop-blur-sm">
                    <ThemeToggle />
                    <Link 
                        to="/profile"
                        className="flex items-center gap-3 p-2.5 rounded-xl dark:bg-white/10 light:bg-green-100 dark:hover:bg-white/15 light:hover:bg-green-200 cursor-pointer transition-colors group border dark:border-white/10 light:border-green-300/50"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 ring-2 dark:ring-white/20 light:ring-green-300/50 group-hover:ring-primary/70 transition-all flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                                {loading ? '...' : getInitials(user?.name, user?.email)}
                            </span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold dark:text-white light:text-text-dark group-hover:text-primary transition-colors truncate">
                                {loading ? 'Loading...' : displayName}
                            </span>
                            <span className="text-[11px] dark:text-gray-300 light:text-text-light-secondary font-medium">
                                {loading ? '...' : subscriptionPlan}
                            </span>
                        </div>
                        <span className="material-symbols-outlined dark:text-gray-400 light:text-text-light-secondary text-base ml-auto dark:group-hover:text-white light:group-hover:text-primary transition-colors shrink-0">chevron_right</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="relative z-10 flex flex-col flex-1 h-full overflow-y-auto custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
