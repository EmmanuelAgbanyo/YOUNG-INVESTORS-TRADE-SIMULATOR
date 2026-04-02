import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../types.ts';
import ThemeSwitcher from './ui/ThemeSwitcher.tsx';
import PasswordLoginModal from './PasswordLoginModal.tsx';
import { apiClient } from '../hooks/useAPI.ts';

const hashPassword = (password: string): string => btoa(password);
const verifyPassword = (password: string, hash: string): boolean => btoa(password) === hash;

interface ProfileManagerProps {
    onProfileSelected: (profile: UserProfile) => void;
    theme: string;
    toggleTheme: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onProfileSelected, theme, toggleTheme }) => {
    const [view, setView] = useState<'login' | 'signup'>('login');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shouldShake, setShouldShake] = useState(false);
    const [marketStatus, setMarketStatus] = useState<string>('CLOSED');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const unsub = apiClient.subscribeMarketStatus((status) => {
            setMarketStatus(status);
        });
        return () => unsub();
    }, []);

    const [profileForPasswordLogin, setProfileForPasswordLogin] = useState<UserProfile | null>(null);

    const triggerError = (message: string) => {
        setError(message);
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
    }

    const toEmail = (input: string): string =>
        input.includes('@') ? input.trim() : `${input.trim().replace(/\\s+/g, '')}@yintrade.com`;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {

            const data = await apiClient.login(toEmail(loginEmail), loginPassword);
            const profilesData = await apiClient.getProfiles(data.userId);

            if (profilesData && profilesData.length > 0) {
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = { 
                    id: String(selectedProfile.id), 
                    name: selectedProfile.name, 
                    email: toEmail(loginEmail),
                    createdAt: Date.now(), 
                    password: loginPassword 
                };
                
                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                const displayName = loginEmail.split('@')[0].replace(/\s+/g, '') || 'User';
                const newProfileData = await apiClient.createProfile(displayName);
                const activeProfile: UserProfile = { 
                    id: String(newProfileData.id), 
                    name: newProfileData.name, 
                    email: toEmail(loginEmail),
                    createdAt: Date.now(), 
                    password: loginPassword 
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
            const data = await apiClient.signup(toEmail(signupEmail), signupPassword, signupName.trim());
            const profilesData = await apiClient.getProfiles(data.userId);

            if (profilesData && profilesData.length > 0) {
                const selectedProfile = profilesData[0];
                const activeProfile: UserProfile = { 
                    id: String(selectedProfile.id), 
                    name: selectedProfile.name, 
                    email: toEmail(signupEmail),
                    createdAt: Date.now(), 
                    password: hashPassword(signupPassword) 
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
                    email: selectedProfile.email || 'authenticated-user@google.com',
                    createdAt: Date.now() 
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
        setError(''); setLoginEmail(''); setLoginPassword(''); setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupConfirmPassword(''); setInviteCode('');
        setView(v);
    }

    const inputClasses = "w-full bg-white/5 dark:bg-black/20 border-b-2 border-slate-200/50 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-300 font-medium placeholder-slate-400 dark:placeholder-slate-500 rounded-t-lg";
    const labelClasses = "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1 mb-1 block";
    const buttonClasses = "w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center outline-none active:scale-[0.98]";

    return (
        <>
            <div className={`min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] bg-slate-50 dark:bg-[#080B14] transition-colors duration-500`}>
                
                {/* Left Panel: Immersive Institutional Hero */}
                <div className="hidden lg:flex flex-col relative overflow-hidden bg-[#0B101E] p-12">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="/niq-students.jpg" 
                            alt="Trading Floor" 
                            className="w-full h-full object-cover opacity-80 scale-105 transition-transform duration-[20s] animate-slow-zoom" 
                        />
                        {/* High-Contrast Gradient Overlays for Readability */}
                        <div className="absolute inset-0 bg-[#0B101E]/40" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B101E] via-[#0B101E]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B101E] via-transparent to-[#0B101E]/20" />
                    </div>

                    <div className="absolute top-8 left-12 z-20">
                        <img src="/yin-logo.png" alt="YIN" className="h-[36px] object-contain drop-shadow-2xl" />
                    </div>
                    
                    <div className="relative z-10 flex-grow flex flex-col justify-center max-w-lg mx-auto">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${marketStatus === 'OPEN' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                        Market Status: {marketStatus}
                                    </span>
                                </div>
                                <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-[10px] rounded-full uppercase tracking-wider border border-indigo-500/30">
                                    Live Terminal v4.0
                                </div>
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6 font-serif [text-shadow:_0_4px_8px_rgb(0_0_0_/_60%)]">
                                Master the <br/>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-200">
                                    Financial Markets.
                                </span>
                            </h1>
                            
                            <p className="text-slate-100 text-lg leading-relaxed font-semibold mb-8 max-w-md drop-shadow-2xl">
                                A browser-based stock trading simulator for young investors to learn trading strategies with virtual money.
                            </p>

                            <div className="space-y-4 mb-8">
                                {[
                                    'Real-time stock price simulation',
                                    'Advanced portfolio management',
                                    'Collaborative team trading',
                                    'AI-powered trading assistant'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-white text-sm font-bold tracking-wide drop-shadow-lg">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/50 flex items-center justify-center border border-indigo-300/40 backdrop-blur-sm">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Latency', value: '4ms' },
                                    { label: 'Uptime', value: '99.9%' },
                                    { label: 'Feed', value: 'GSE Direct' },
                                    { label: 'Standard', value: 'ISO-20022' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                                        <div className="text-lg font-mono text-white font-bold">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between mt-auto pt-10 border-t border-white/5">
                        <div className="flex gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            <span className="hover:text-indigo-400 transition-colors cursor-help italic underline-offset-4 underline decoration-white/10">Terms of Service</span>
                            <span className="hover:text-indigo-400 transition-colors cursor-help italic underline-offset-4 underline decoration-white/10">Privacy Protocol</span>
                        </div>
                        <div className="text-indigo-400/60 font-mono text-xs">
                            System Node: AFX-GSE-MAIN
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive Auth Forms */}
                <div className="flex flex-col items-center justify-center relative p-6 sm:p-12 w-full">
                    <div className="absolute top-6 right-6 z-50">
                        <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                    </div>

                    {/* Mobile Logo Logo */}
                    <div className="lg:hidden mb-8 mt-4 animate-fade-in text-center">
                        <img src="/yin-logo.png" alt="Young Investors Network" className="h-[36px] mx-auto mb-2" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Junior Investors League</h2>
                    </div>

                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
                        <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
                    </div>

                    <motion.div 
                        className={`w-full max-w-[440px] relative z-10 backdrop-blur-2xl bg-white/40 dark:bg-slate-900/60 border border-white/20 dark:border-white/10 shadow-2xl rounded-[2.5rem] p-8 sm:p-10 ${shouldShake ? 'animate-shake' : ''}`}
                    >
                        <AnimatePresence mode="wait">
                            {view === 'login' ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    <div className="mb-10 text-center lg:text-left">
                                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 font-serif">Terminal Access</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Enter your credentials to manage your institutional portfolio.</p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-6">
                                        <div className="space-y-5">
                                            <div className="relative group">
                                                <label htmlFor="loginEmail" className={labelClasses}>Email or Username</label>
                                                <input id="loginEmail" type="text" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setError(''); }} placeholder="you@example.com" className={inputClasses} required />
                                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                            </div>
                                            <div className="relative group">
                                                <div className="flex justify-between items-center w-full">
                                                    <label htmlFor="loginPassword" className={labelClasses}>Password</label>
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold hover:text-indigo-300">
                                                        {showPassword ? 'Hide' : 'Show'}
                                                    </button>
                                                </div>
                                                <input id="loginPassword" type={showPassword ? "text" : "password"} value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setError(''); }} placeholder="••••••••" className={inputClasses} required />
                                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                            </div>
                                        </div>

                                        {error && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-rose-500 text-xs font-semibold flex items-center gap-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />{error}</motion.div>}

                                        <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow-xl shadow-indigo-500/10 disabled:opacity-70 font-bold uppercase tracking-widest`}>
                                            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Initialize Session'}
                                        </button>

                                        <div className="relative py-4 flex items-center justify-center">
                                            <div className="border-t border-slate-200 dark:border-slate-800 absolute w-full" />
                                            <span className="bg-slate-50 dark:bg-[#080B14] px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10 transition-colors duration-500">Universal Access</span>
                                        </div>

                                        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className={`${buttonClasses} bg-white dark:bg-slate-800/40 text-slate-700 dark:text-indigo-100 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 shadow-sm disabled:opacity-70 gap-3 font-semibold`}>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                            Continue with Google
                                        </button>

                                        <div className="text-center pt-2">
                                            <span className="text-sm text-slate-500">New to the platform? </span>
                                            <button type="button" onClick={() => toggleView('signup')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Apply for Access</button>
                                        </div>
                                    </form>
                                </motion.div>

                            ) : (

                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    <div className="mb-8 text-center lg:text-left">
                                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 font-serif">Apply for Membership</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Join the elite league of junior traders and master market dynamics.</p>
                                    </div>

                                    <form onSubmit={handleSignUp} className="space-y-5">
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <label htmlFor="signupName" className={labelClasses}>Full Legal Name</label>
                                                <input id="signupName" type="text" value={signupName} onChange={(e) => { setSignupName(e.target.value); setError(''); }} placeholder="Institutional identity" className={inputClasses} required />
                                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                            </div>
                                            <div className="relative group">
                                                <label htmlFor="signupEmail" className={labelClasses}>Corporate Email</label>
                                                <input id="signupEmail" type="text" value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); setError(''); }} placeholder="you@organization.com" className={inputClasses} required />
                                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative group">
                                                    <label htmlFor="signupPassword" className={labelClasses}>Secure Key</label>
                                                    <input id="signupPassword" type={showPassword ? "text" : "password"} value={signupPassword} onChange={(e) => { setSignupPassword(e.target.value); setError(''); }} placeholder="Min. 6 chars" className={inputClasses} required />
                                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                                </div>
                                                <div className="relative group">
                                                    <label htmlFor="signupConfirmPassword" className={labelClasses}>Identity Sync</label>
                                                    <input id="signupConfirmPassword" type={showPassword ? "text" : "password"} value={signupConfirmPassword} onChange={(e) => { setSignupConfirmPassword(e.target.value); setError(''); }} placeholder="Repeat key" className={inputClasses} required />
                                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <label htmlFor="inviteCode" className={labelClasses}>Team Protocol Code (Optional)</label>
                                                <input id="inviteCode" type="text" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setError(''); }} placeholder="Authorization hash" className={inputClasses} />
                                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-focus-within:w-full" />
                                            </div>
                                        </div>

                                        {error && <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-rose-500 text-xs font-semibold flex items-center gap-2 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />{error}</motion.div>}

                                        <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 disabled:opacity-70 mt-4 font-bold uppercase tracking-widest`}>
                                            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Create Institutional Profile'}
                                        </button>

                                        <div className="relative py-4 flex items-center justify-center">
                                            <div className="border-t border-slate-200 dark:border-slate-800 absolute w-full" />
                                            <span className="bg-slate-50 dark:bg-[#080B14] px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10 transition-colors duration-500">Universal Access</span>
                                        </div>

                                        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className={`${buttonClasses} bg-white dark:bg-slate-800/40 text-slate-700 dark:text-indigo-100 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 shadow-sm disabled:opacity-70 gap-3 font-semibold`}>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                            Continue with Google
                                        </button>

                                        <div className="text-center pt-2">
                                            <span className="text-sm text-slate-500">Already registered? </span>
                                            <button type="button" onClick={() => toggleView('login')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-serif">Sign In</button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    
                    <div className="absolute bottom-6 w-full text-center tracking-wider text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase mt-auto z-10">
                        Powered by NexusByte Technologies &copy; {new Date().getFullYear()}
                    </div>
                </div>
            </div>
            
            <PasswordLoginModal
                isOpen={!!profileForPasswordLogin}
                onClose={() => setProfileForPasswordLogin(null)}
                profile={profileForPasswordLogin}
                onSuccess={onProfileSelected}
            />
            <style>{`
                @keyframes slow-zoom {
                    0% { transform: scale(1.05); }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1.05); }
                }
                .animate-slow-zoom {
                    animation: slow-zoom 30s ease-in-out infinite;
                }
            `}</style>
        </>
    );
};

export default ProfileManager;
