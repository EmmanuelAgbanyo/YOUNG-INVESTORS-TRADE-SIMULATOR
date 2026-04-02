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
                const activeProfile: UserProfile = { id: String(selectedProfile.id), name: selectedProfile.name, createdAt: Date.now(), password: loginPassword };
                
                const existingProfiles = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const filteredProfiles = existingProfiles.filter((p: UserProfile) => p.id !== activeProfile.id);
                localStorage.setItem('yin_trade_profiles', JSON.stringify([...filteredProfiles, activeProfile]));

                onProfileSelected(activeProfile);
            } else {
                const displayName = loginEmail.split('@')[0].replace(/\\s+/g, '') || 'User';
                const newProfileData = await apiClient.createProfile(displayName);
                const activeProfile: UserProfile = { id: String(newProfileData.id), name: newProfileData.name, createdAt: Date.now(), password: loginPassword };
                
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
                const activeProfile: UserProfile = { id: String(selectedProfile.id), name: selectedProfile.name, createdAt: Date.now(), password: hashPassword(signupPassword) };
                
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
                const activeProfile: UserProfile = { id: String(selectedProfile.id), name: selectedProfile.name, createdAt: Date.now() };
                
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

    const inputClasses = "w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white px-2 py-3 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-300 font-medium placeholder-slate-400 dark:placeholder-slate-500";
    const labelClasses = "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2";
    const buttonClasses = "w-full py-4 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center outline-none active:scale-[0.98]";

    return (
        <>
            <div className={`min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] bg-slate-50 dark:bg-[#080B14] transition-colors duration-500`}>
                
                {/* Left Panel: Subtle Geometric/Financial Mesh */}
                <div className="hidden lg:flex flex-col relative overflow-hidden bg-white dark:bg-[#0B101E] border-r border-slate-200 dark:border-slate-800/50 p-12">
                    <div className="absolute top-8 left-12 z-20">
                        <img src="/yin-logo.png" alt="YIN" className="h-[32px] object-contain drop-shadow" />
                    </div>
                    
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        {/* Premium Abstract Grid & Aura */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        <div className="absolute -top-[20%] -left-[20%] w-[70vw] h-[70vw] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_10s_ease-in-out_infinite]" />
                        <div className="absolute top-[40%] text-slate-900/5 dark:text-white/5 right-[-10%] select-none font-bold text-[300px] leading-none tracking-tighter">YIN</div>
                    </div>

                    <div className="relative z-10 flex-grow flex flex-col justify-center max-w-lg mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                            <div className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-full uppercase tracking-wider mb-6">
                                Global Market Simulator
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6 font-serif">
                                Command your <br/><span className="text-indigo-600 dark:text-indigo-400">financial future.</span>
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                                Join the Junior Investors League. Experience real-time market dynamics in a professional, risk-free environment.
                            </p>
                        </motion.div>
                    </div>
                    
                    <div className="relative z-10 flex gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Data</span>
                        <span>Institutional Grade</span>
                        <span>Zero Risk</span>
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

                    <motion.div 
                        className={`w-full max-w-[420px] ${shouldShake ? 'animate-shake' : ''}`}
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
                                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Welcome back</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your credentials to access the terminal.</p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-6">
                                        <div className="space-y-5">
                                            <div>
                                                <label htmlFor="loginEmail" className={labelClasses}>Email or Username</label>
                                                <input id="loginEmail" type="text" value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setError(''); }} placeholder="you@example.com" className={inputClasses} required />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center w-full">
                                                    <label htmlFor="loginPassword" className={labelClasses}>Password</label>
                                                    <a href="#" className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300">Reset</a>
                                                </div>
                                                <input id="loginPassword" type="password" value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setError(''); }} placeholder="••••••••" className={inputClasses} required />
                                            </div>
                                        </div>

                                        {error && <div className="text-rose-500 text-sm font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{error}</div>}

                                        <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow-md shadow-slate-900/10 dark:shadow-white/10 disabled:opacity-70`}>
                                            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Secure Sign In'}
                                        </button>

                                        <div className="relative py-4 flex items-center justify-center">
                                            <div className="border-t border-slate-200 dark:border-slate-800 absolute w-full" />
                                            <span className="bg-slate-50 dark:bg-[#080B14] px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10">Or continue with</span>
                                        </div>

                                        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className={`${buttonClasses} bg-white dark:bg-[#111827] text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm disabled:opacity-70 gap-3`}>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                            Google
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
                                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Create Profile</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Join the league and start trading risk-free.</p>
                                    </div>

                                    <form onSubmit={handleSignUp} className="space-y-5">
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="signupName" className={labelClasses}>Display Name</label>
                                                <input id="signupName" type="text" value={signupName} onChange={(e) => { setSignupName(e.target.value); setError(''); }} placeholder="How you appear on the leaderboard" className={inputClasses} required />
                                            </div>
                                            <div>
                                                <label htmlFor="signupEmail" className={labelClasses}>Email or Username</label>
                                                <input id="signupEmail" type="text" value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); setError(''); }} placeholder="you@example.com" className={inputClasses} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="signupPassword" className={labelClasses}>Password</label>
                                                    <input id="signupPassword" type="password" value={signupPassword} onChange={(e) => { setSignupPassword(e.target.value); setError(''); }} placeholder="Min. 6 chars" className={inputClasses} required />
                                                </div>
                                                <div>
                                                    <label htmlFor="signupConfirmPassword" className={labelClasses}>Confirm</label>
                                                    <input id="signupConfirmPassword" type="password" value={signupConfirmPassword} onChange={(e) => { setSignupConfirmPassword(e.target.value); setError(''); }} placeholder="Repeat password" className={inputClasses} required />
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor="inviteCode" className={labelClasses}>Team Code (Optional)</label>
                                                <input id="inviteCode" type="text" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setError(''); }} placeholder="Enter entry code if applicable" className={inputClasses} />
                                            </div>
                                        </div>

                                        {error && <div className="text-rose-500 text-sm font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{error}</div>}

                                        <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-70 mt-4`}>
                                            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Initialize Profile'}
                                        </button>

                                        <div className="relative py-4 flex items-center justify-center">
                                            <div className="border-t border-slate-200 dark:border-slate-800 absolute w-full" />
                                            <span className="bg-slate-50 dark:bg-[#080B14] px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10">Or register via</span>
                                        </div>

                                        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className={`${buttonClasses} bg-white dark:bg-[#111827] text-slate-700 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm disabled:opacity-70 gap-3`}>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                            Google
                                        </button>

                                        <div className="text-center pt-2">
                                            <span className="text-sm text-slate-500">Already registered? </span>
                                            <button type="button" onClick={() => toggleView('login')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Sign In</button>
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
        </>
    );
};

export default ProfileManager;
