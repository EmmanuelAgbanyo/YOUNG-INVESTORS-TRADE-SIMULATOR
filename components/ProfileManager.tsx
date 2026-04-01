


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile, Team, TeamInvite } from '../types.ts';
import Button from './ui/Button.tsx';
import ThemeSwitcher from './ui/ThemeSwitcher.tsx';
import PasswordLoginModal from './PasswordLoginModal.tsx';
import { apiClient } from '../hooks/useAPI.ts';

// Legacy password hash checks for offline demo capabilities (optional)
const hashPassword = (password: string): string => btoa(password);
const verifyPassword = (password: string, hash: string): boolean => btoa(password) === hash;


interface ProfileManagerProps {
    onProfileSelected: (profile: UserProfile) => void;
    theme: string;
    toggleTheme: () => void;
}

const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const ProfileManager: React.FC<ProfileManagerProps> = ({ onProfileSelected, theme, toggleTheme }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [view, setView] = useState<'login' | 'signup'>('login');

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup State
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shouldShake, setShouldShake] = useState(false);

    const [profileForPasswordLogin, setProfileForPasswordLogin] = useState<UserProfile | null>(null);

    useEffect(() => {
        try {
            const storedProfiles = localStorage.getItem('yin_trade_profiles');
            if (storedProfiles) {
                setProfiles(JSON.parse(storedProfiles));
            }
        } catch (e) {
            console.error("Failed to load profiles:", e);
            setProfiles([]);
        }
    }, []);

    const triggerError = (message: string) => {
        setError(message);
        setShouldShake(true);
    }

    // Converts a raw input (email or plain username) to a Firebase-valid email.
    // If it already contains '@', use it as-is. Otherwise append @yintrade.com.
    const toEmail = (input: string): string =>
        input.includes('@') ? input.trim() : `${input.trim().replace(/\s+/g, '')}@yintrade.com`;

    const handleProfileSelect = (profile: UserProfile) => {
        if (profile.password && verifyPassword(loginPassword, profile.password)) {
            onProfileSelected(profile);
        } else if (profile.password) {
            triggerError('Incorrect password.');
        } else {
            onProfileSelected(profile);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Super Admin Check — supports both email and legacy 'Admin' name
            if ((loginEmail === 'Admin' || loginEmail === 'admin@yin.com') && (loginPassword === 'GSE@2024!' || loginPassword === 'GSE@2026!')) {
                const adminProfile: UserProfile = {
                    id: 'admin_session',
                    name: 'Admin',
                    createdAt: Date.now(),
                };
                onProfileSelected(adminProfile);
                setIsLoading(false);
                return;
            }

            // Login with email-or-username — convert if necessary
            const data = await apiClient.login(toEmail(loginEmail), loginPassword);
            const profilesData = await apiClient.getProfiles(data.userId);

            if (profilesData && profilesData.length > 0) {
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = {
                    id: String(selectedProfile.id),
                    name: selectedProfile.name,
                    createdAt: Date.now(),
                    password: loginPassword,
                };

                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                // Auto-create profile if user was manually added in Firebase Auth Console
                const displayName = loginEmail.split('@')[0].replace(/\s+/g, '') || 'User';
                const newProfileData = await apiClient.createProfile(displayName);
                const activeProfile: UserProfile = {
                    id: String(newProfileData.id),
                    name: newProfileData.name,
                    createdAt: Date.now(),
                    password: loginPassword,
                };

                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            }
        } catch (err: any) {
            triggerError(err.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!signupName.trim()) return triggerError('Display name cannot be empty.');
        if (!signupEmail.trim()) return triggerError('Please enter an email address or username.');
        if (signupPassword.length < 6) return triggerError('Password must be at least 6 characters long.');
        if (signupPassword !== signupConfirmPassword) return triggerError('Passwords do not match.');
        if (signupName.trim().toLowerCase() === 'admin') return triggerError('This profile name is reserved.');

        setIsLoading(true);

        try {
            // Convert username or email to a valid Firebase email format
            const data = await apiClient.signup(toEmail(signupEmail), signupPassword, signupName.trim());

            const profilesData = await apiClient.getProfiles(data.userId);

            if (profilesData && profilesData.length > 0) {
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = {
                    id: String(selectedProfile.id),
                    name: selectedProfile.name,
                    createdAt: Date.now(),
                    password: hashPassword(signupPassword),
                };

                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                triggerError('Profile creation on backend failed during signup.');
            }
        } catch (err: any) {
            triggerError(err.message || 'Signup failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);

        try {
            const data = await apiClient.loginWithGoogle();
            const profilesData = await apiClient.getProfiles(data.userId);

            if (profilesData && profilesData.length > 0) {
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = {
                    id: String(selectedProfile.id),
                    name: selectedProfile.name,
                    createdAt: Date.now(),
                };

                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                triggerError('Profile synchronization failed.');
            }
        } catch (err: any) {
            triggerError(err.message || 'Google Sign-In failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleView = (v: 'login' | 'signup') => {
        setError('');
        setLoginEmail('');
        setLoginPassword('');
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setInviteCode('');
        setView(v);
    }

    return (
        <>
            <div className="min-h-screen bg-white dark:bg-[#0f172a] text-base-content font-sans flex overflow-hidden">
                <div className="absolute top-6 right-6 z-50 animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                </div>

                {/* Split-Screen Container */}
                <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">

                    {/* Left Panel: Branding & Visuals (Deep Slate to Vibrant) */}
                    <div className="hidden lg:flex flex-col justify-end items-start relative overflow-hidden bg-[#0f172a] p-16 pb-24 group">
                        {/* Top Logo */}
                        <div className="absolute top-12 left-16 z-30 animate-fade-in-down drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl hover:scale-105 transition-transform duration-500 cursor-default">
                                <img src="/yin-logo.png" alt="Young Investors Network" className="h-[40px] w-auto object-contain" />
                            </div>
                        </div>

                        {/* Decorative background elements (Cinematic + Lively) */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <img
                                src="/niq-students.jpg"
                                alt="National Investment Quiz"
                                className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105 group-hover:scale-110 transition-transform duration-[15000ms] ease-out origin-center"
                            />
                            {/* Multi-layered cinematic gradient for text legibility and mood */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/70 to-transparent z-10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/80 via-transparent to-transparent z-10" />

                            {/* Lively tech/energy accents */}
                            <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse z-10" style={{ animationDuration: '6s' }} />
                            <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] mix-blend-screen animate-pulse z-10" style={{ animationDuration: '8s' }} />
                        </div>

                        <div className="relative z-20 flex flex-col items-start animate-fade-in-up w-full max-w-xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-xl hover:bg-white/20 transition-colors">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase drop-shadow-md">Live Simulator</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-xl" style={{ animationDelay: '100ms' }}>
                                Nurturing the Next<br />Generation of<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Financial Leaders</span>
                            </h1>
                            <p className="text-xl text-white/90 font-medium leading-relaxed border-l-4 border-blue-500 pl-5 drop-shadow-md" style={{ animationDelay: '200ms' }}>
                                Where Future Financial Leaders Compete.<br /> Master the Market, Risk-Free.
                            </p>
                        </div>
                    </div>

                    {/* Right Panel: Auth Forms */}
                    <div className="flex flex-col justify-center items-center relative bg-white dark:bg-[#0a0f1e] overflow-y-auto py-8 sm:py-12 px-4 sm:px-8 w-full lg:w-auto">

                        {/* --- Dynamic Background Elements --- */}
                        {/* Subtle Dot Matrix layout */}
                        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                        {/* Animated Mesh Blend Orbs */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
                            <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-rose-500/10 dark:bg-rose-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_alternate]" />
                            <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[90px] mix-blend-multiply dark:mix-blend-screen animate-[spin_15s_linear_infinite] origin-[150%_150%]" />
                        </div>

                        {/* Floating Abstract Badges (Decorative & Professional) */}
                        <div className="hidden xl:flex absolute top-[15%] right-[8%] z-10 animate-fade-in-up bg-white/60 dark:bg-gray-800/60 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 dark:border-gray-700/50 items-center justify-center gap-2 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Live Market Data</span>
                        </div>

                        {/* Mobile Branding Header */}
                        <div className="lg:hidden flex flex-col items-center text-center w-full max-w-md mb-6 animate-fade-in-up relative z-20">
                            <img src="/yin-logo.png" alt="Young Investors Network" className="h-[32px] sm:h-[40px] mb-3 drop-shadow-md" />
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1e40af] dark:text-[#60a5fa] drop-shadow-sm">Junior Investors League</h1>
                        </div>                        {/* Glassmorphic Premium Form Container */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`w-full max-w-[480px] bg-white/75 dark:bg-[#0f172a]/80 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 relative z-20 transition-all duration-500 ${shouldShake ? 'animate-shake' : ''}`}
                        >
                            <div className="relative min-h-[420px] sm:min-h-[530px] w-full flex flex-col">
                                
                                {/* Mobile Header (Visible only on small screens) */}
                                <div className="lg:hidden flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-br from-[#1e40af] to-blue-600 text-white p-2.5 rounded-xl font-bold tracking-widest text-[10px] inline-flex items-center justify-center shadow-lg">
                                        JIL
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-serif font-bold text-[#1e40af] dark:text-[#60a5fa] leading-tight">Junior Investors League</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Global Trading Terminal</p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {view === 'login' ? (
                                        <motion.div
                                            key="login"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            className="w-full h-full flex flex-col justify-center"
                                        >
                                            <form onSubmit={handleLogin} className="space-y-6 w-full">
                                                {/* Desktop Header */}
                                                <div className="hidden lg:flex items-center gap-4 mb-8">
                                                    <div className="bg-gradient-to-br from-[#1e40af] to-blue-600 text-white p-3 rounded-2xl font-bold tracking-widest text-xs inline-flex items-center justify-center shadow-[0_8px_15px_rgba(30,64,175,0.3)]">
                                                        JIL
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl font-serif font-bold text-[#1e40af] dark:text-[#60a5fa] drop-shadow-sm leading-tight">Junior Investors League</h2>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Enter your details to access the portal.</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label htmlFor="loginEmail" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Email or Username</label>
                                                        <input
                                                            id="loginEmail"
                                                            type="text"
                                                            value={loginEmail}
                                                            onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
                                                            placeholder="you@email.com or YourUsername"
                                                            className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[48px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-lg"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between items-center">
                                                            <label htmlFor="loginPassword" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Password</label>
                                                            <span className="text-xs font-bold text-[#1e40af] dark:text-[#60a5fa] cursor-pointer hover:underline transition-colors">Forgot Password?</span>
                                                        </div>
                                                        <input
                                                            id="loginPassword"
                                                            type="password"
                                                            value={loginPassword}
                                                            onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                                                            placeholder="••••••••"
                                                            className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[48px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-xl tracking-widest"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3 pl-1">
                                                        <input type="checkbox" id="remember" className="rounded-md border-gray-300 text-[#1e40af] focus:ring-[#1e40af] bg-white/50 dark:bg-gray-800 focus:ring-offset-0" />
                                                        <label htmlFor="remember" className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">Remember me for 30 days</label>
                                                    </div>
                                                </div>

                                                <div className="min-h-[20px] flex items-center">
                                                    {error && <p className="text-sm text-rose-500 dark:text-rose-400 font-bold animate-fade-in flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>{error}</p>}
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full h-[54px] text-lg font-bold text-white bg-gradient-to-r from-[#1e40af] to-blue-600 hover:from-blue-700 hover:to-blue-500 shadow-[0_8px_20px_rgba(30,64,175,0.3)] hover:shadow-[0_12px_25px_rgba(30,64,175,0.5)] transition-all duration-300 transform hover:scale-[1.02] rounded-xl flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
                                                >
                                                    {isLoading ? <span className="loading loading-spinner loading-md"></span> : 'Access Terminal'}
                                                </button>

                                                <div className="relative py-4">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-gray-200 dark:border-gray-700/50"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-white dark:bg-[#0a0f1e] px-4 font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">Or secure access via</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleGoogleSignIn}
                                                    disabled={isLoading}
                                                    className="w-full h-[54px] bg-white dark:bg-[#1e293b]/50 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-[#1e293b] text-gray-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(30,64,175,0.2)] hover:-translate-y-0.5 group disabled:opacity-70"
                                                >
                                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                    <span>Continue with Google</span>
                                                </button>

                                                <div className="flex items-center justify-center text-sm pt-4 mt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                                                    <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Don't have an account yet?</span>
                                                    <button type="button" onClick={() => toggleView('signup')} className="font-bold text-[#1e40af] dark:text-[#60a5fa] hover:underline transition-colors drop-shadow-sm">
                                                        Create an account
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="signup"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            className="w-full h-full flex flex-col justify-center"
                                        >
                                            <form onSubmit={handleSignUp} className="space-y-5 w-full">
                                                {/* Desktop Header */}
                                                <div className="hidden lg:flex items-center gap-4 mb-6">
                                                    <div className="bg-gradient-to-br from-[#1e40af] to-emerald-600 text-white p-3 rounded-2xl font-bold tracking-widest text-xs inline-flex items-center justify-center shadow-[0_8px_15px_rgba(16,185,129,0.3)]">
                                                        JIL
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl font-serif font-bold text-[#1e40af] dark:text-[#60a5fa] drop-shadow-sm leading-tight">Junior Investors League</h2>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Join the League and secure your spot.</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label htmlFor="signupName" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Display Name</label>
                                                    <input
                                                        id="signupName"
                                                        type="text"
                                                        value={signupName}
                                                        onChange={(e) => { setSignupName(e.target.value); setError(''); }}
                                                        placeholder="Your name / nickname"
                                                        className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[44px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-lg"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label htmlFor="signupEmail" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Email or Username</label>
                                                    <input
                                                        id="signupEmail"
                                                        type="text"
                                                        value={signupEmail}
                                                        onChange={(e) => { setSignupEmail(e.target.value); setError(''); }}
                                                        placeholder="you@email.com or YourUsername"
                                                        className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[44px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-lg"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label htmlFor="signupPassword" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Password</label>
                                                        <input
                                                            id="signupPassword"
                                                            type="password"
                                                            value={signupPassword}
                                                            onChange={(e) => { setSignupPassword(e.target.value); setError(''); }}
                                                            placeholder="Min. 6 chars"
                                                            className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[44px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-xl tracking-widest"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <label htmlFor="signupConfirmPassword" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Confirm</label>
                                                        <input
                                                            id="signupConfirmPassword"
                                                            type="password"
                                                            value={signupConfirmPassword}
                                                            onChange={(e) => { setSignupConfirmPassword(e.target.value); setError(''); }}
                                                            placeholder="Repeat password"
                                                            className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[44px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-xl tracking-widest"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label htmlFor="inviteCode" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">School/Team Code</label>
                                                    <input
                                                        id="inviteCode"
                                                        type="text"
                                                        value={inviteCode}
                                                        onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
                                                        placeholder="(Optional) Entry code"
                                                        className="input input-bordered w-full bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 focus:border-[#1e40af] overflow-hidden focus:bg-white dark:focus:bg-[#0f172a] focus:ring-2 focus:ring-[#1e40af] shadow-inner rounded-xl h-[44px] text-[#1e40af] dark:text-[#60a5fa] transition-all font-bold placeholder:font-medium text-lg"
                                                    />
                                                </div>

                                                <div className="min-h-[20px] flex items-center">
                                                    {error && <p className="text-sm text-rose-500 dark:text-rose-400 font-bold animate-fade-in flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>{error}</p>}
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full h-[54px] text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-[#1e40af] hover:from-emerald-500 hover:to-blue-600 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(30,64,175,0.5)] transition-all duration-300 transform hover:scale-[1.02] rounded-xl flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
                                                >
                                                    {isLoading ? <span className="loading loading-spinner loading-md"></span> : 'Create Profile'}
                                                </button>

                                                <div className="relative py-3">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-gray-200 dark:border-gray-700/50"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-white dark:bg-[#0a0f1e] px-4 font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">Or register through</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleGoogleSignIn}
                                                    disabled={isLoading}
                                                    className="w-full h-[54px] bg-white dark:bg-[#1e293b]/50 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-[#1e293b] text-gray-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg dark:hover:shadow-[10px_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-0.5 group disabled:opacity-70"
                                                >
                                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                    <span>Continue with Google</span>
                                                </button>

                                                <div className="flex items-center justify-center text-sm pt-4 mt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                                                    <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Already registered?</span>
                                                    <button type="button" onClick={() => toggleView('login')} className="font-bold text-[#1e40af] dark:text-[#60a5fa] hover:underline transition-colors drop-shadow-sm">
                                                        Sign In
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Premium Auth Footer */}
                        <div className="absolute bottom-4 sm:bottom-8 w-full flex flex-col items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium z-20 px-6">
                            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 tracking-wide">
                                <a href="#" className="hover:text-[#dc2626] dark:hover:text-[#ef4444] transition-colors duration-300">About YIN</a>
                                <a href="#" className="hover:text-[#dc2626] dark:hover:text-[#ef4444] transition-colors duration-300">Help & Support</a>
                                <a href="#" className="hover:text-[#dc2626] dark:hover:text-[#ef4444] transition-colors duration-300">Privacy Policy</a>
                                <a href="#" className="hover:text-[#dc2626] dark:hover:text-[#ef4444] transition-colors duration-300">Terms of Service</a>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} Young Investors Network. All rights reserved.</span>
                                <span className="text-gray-400/80 dark:text-gray-500/80 text-[10px] font-bold uppercase tracking-wider">Powered by NexusByte Technologies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <PasswordLoginModal
                isOpen={!!profileForPasswordLogin}
                onClose={() => setProfileForPasswordLogin(null)}
                profile={profileForPasswordLogin}
                onSuccess={onProfileSelected}
            />
        </>
    );
};

export default ProfileManager;
