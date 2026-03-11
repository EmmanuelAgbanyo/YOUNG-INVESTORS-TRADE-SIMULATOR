


import React, { useState, useEffect } from 'react';
import type { UserProfile, Team, TeamInvite } from '../types.ts';
import Button from './ui/Button.tsx';
import ThemeSwitcher from './ui/ThemeSwitcher.tsx';
import PasswordLoginModal from './PasswordLoginModal.tsx';

// A simple simulation of password hashing for this browser-only environment.
// In a real application, NEVER do this. Use a library like bcrypt on a server.
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
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup State
    const [signupName, setSignupName] = useState('');
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
            // Super Admin Check
            if (loginName === 'Admin' && loginPassword === 'GSE@2024!') {
                const adminProfile: UserProfile = {
                    id: 'admin_session',
                    name: 'Admin',
                    createdAt: Date.now(),
                };
                onProfileSelected(adminProfile);
                setIsLoading(false);
                return;
            }

            const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginName, password: loginPassword })
            });
            const data = await res.json();

            if (!res.ok) {
                triggerError(data.error || 'Invalid credentials.');
                setIsLoading(false);
                return;
            }

            localStorage.setItem('yin_trade_token', data.token);

            // Fetch user profiles
            const profileRes = await fetch(`${API_BASE_URL}/api/profiles/${data.userId}`, {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });
            const profilesData = await profileRes.json();

            if (profilesData && profilesData.length > 0) {
                // For simplicity in this iteration, pick the first profile attached to the user account
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = {
                    id: String(selectedProfile.id),
                    name: selectedProfile.name,
                    createdAt: Date.now(),
                    password: loginPassword, // temporarily keeping local hash auth structure satisfied if needed elsewhere
                };

                // Save to local storage for App.tsx to hydrate on refresh
                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                triggerError('No profile associated with this account.');
            }
        } catch (err) {
            triggerError('Network error connecting to authentication server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!signupName.trim()) return triggerError('Profile name cannot be empty.');
        if (signupPassword.length < 6) return triggerError('Password must be at least 6 characters long.');
        if (signupPassword !== signupConfirmPassword) return triggerError('Passwords do not match.');
        if (signupName.trim().toLowerCase() === 'admin') return triggerError('This profile name is reserved.');

        setIsLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
            const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: signupName.trim(), // treat username as email for simplicity
                    password: signupPassword,
                    name: signupName.trim()
                })
            });
            
            const data = await res.json();

            if (!res.ok) {
                triggerError(data.error || 'Signup failed.');
                setIsLoading(false);
                return;
            }

            localStorage.setItem('yin_trade_token', data.token);

            // Fetch user profile from the database to get the real profile ID
            // "LOG IN AFTER SIGN UP FEEDBACK" fix involves ensuring they are fully 
            // hydrated exactly like a normal login to prevent state bugs.
            const profileRes = await fetch(`${API_BASE_URL}/api/profiles/${data.userId}`, {
                headers: { 'Authorization': `Bearer ${data.token}` }
            });
            const profilesData = await profileRes.json();

            if (profilesData && profilesData.length > 0) {
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = {
                    id: String(selectedProfile.id),
                    name: selectedProfile.name,
                    createdAt: Date.now(),
                    password: loginPassword || hashPassword(signupPassword),
                };

                // Save to local storage for App.tsx to hydrate on refresh
                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                triggerError('Profile creation on backend failed during signup.');
            }
        } catch (err) {
            triggerError('Network error creating account.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleView = (v: 'login' | 'signup') => {
        setError('');
        setLoginName('');
        setLoginPassword('');
        setSignupName('');
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

                    {/* Right Panel: Premium Glassmorphic Form */}
                    <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative bg-[#f8fafc] dark:bg-[#020617] z-10 overflow-hidden w-full lg:w-auto">

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
                        <div className="lg:hidden flex flex-col items-center text-center w-full max-w-md mb-8 animate-fade-in-up relative z-20">
                            <img src="/yin-logo.png" alt="Young Investors Network" className="h-[40px] mb-4 drop-shadow-md" />
                            <h1 className="text-3xl font-serif font-bold text-[#1e40af] dark:text-[#60a5fa] drop-shadow-sm">Junior Investors League</h1>
                        </div>

                        {/* Glassmorphic Premium Form Container */}
                        <div className={`w-full max-w-[480px] bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-2xl border border-white dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_48px_rgba(30,64,175,0.15)] dark:hover:shadow-[0_16px_48px_rgba(30,64,175,0.25)] rounded-[2.5rem] p-8 sm:p-10 relative z-20 transition-all duration-500 hover:-translate-y-1 ${shouldShake ? 'animate-shake' : ''}`}>
                            <div className="relative h-[530px] w-full">

                                {/* --- Login Form --- */}
                                <div
                                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${view === 'login' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}
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
                                                <label htmlFor="loginName" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Username</label>
                                                <input
                                                    id="loginName"
                                                    type="text"
                                                    value={loginName}
                                                    onChange={(e) => { setLoginName(e.target.value); setError(''); }}
                                                    placeholder="Enter your username"
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

                                        <div className="flex items-center justify-center text-sm pt-4 mt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                                            <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Don't have an account yet?</span>
                                            <button type="button" onClick={() => toggleView('signup')} className="font-bold text-[#1e40af] dark:text-[#60a5fa] hover:underline transition-colors drop-shadow-sm">
                                                Create an account
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* --- Signup Form --- */}
                                <div
                                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${view === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}
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
                                            <label htmlFor="signupName" className="text-xs font-black text-[#dc2626] dark:text-[#ef4444] uppercase tracking-wider">Username</label>
                                            <input
                                                id="signupName"
                                                type="text"
                                                value={signupName}
                                                onChange={(e) => { setSignupName(e.target.value); setError(''); }}
                                                placeholder="Enter your username"
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

                                        <div className="flex items-center justify-center text-sm pt-4 mt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                                            <span className="text-gray-500 dark:text-gray-400 mr-2 font-medium">Already registered?</span>
                                            <button type="button" onClick={() => toggleView('login')} className="font-bold text-[#1e40af] dark:text-[#60a5fa] hover:underline transition-colors drop-shadow-sm">
                                                Sign In
                                            </button>
                                        </div>
                                    </form>
                                </div>

                            </div>
                        </div>

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