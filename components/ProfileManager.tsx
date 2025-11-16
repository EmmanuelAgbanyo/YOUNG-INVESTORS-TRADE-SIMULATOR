


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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => { // Simulate network latency for a better UX
        // Super Admin Check
        if (loginName === 'Admin' && loginPassword === 'GSE@2024!') {
            const adminProfile: UserProfile = {
                id: 'admin_session',
                name: 'Admin',
                createdAt: Date.now(),
            };
            onProfileSelected(adminProfile);
            return;
        }

        const profile = profiles.find(p => p.name.toLowerCase() === loginName.toLowerCase());
        
        if (profile) {
            // Updated logic: a profile can be password-protected or not.
            // If it is, the password MUST be provided in the login form.
            if (profile.password) {
                 if (verifyPassword(loginPassword, profile.password)) {
                    onProfileSelected(profile);
                } else {
                    triggerError('Incorrect password.');
                }
            } else {
                // If profile is not password protected, log in directly.
                onProfileSelected(profile);
            }
        } else {
            triggerError('Profile not found.');
        }
        setIsLoading(false);
    }, 500);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!signupName.trim()) return triggerError('Profile name cannot be empty.');
    if (signupPassword.length < 6) return triggerError('Password must be at least 6 characters long.');
    if (signupPassword !== signupConfirmPassword) return triggerError('Passwords do not match.');
    if (profiles.some(p => p.name.trim().toLowerCase() === signupName.trim().toLowerCase())) return triggerError('A profile with this name already exists.');
    if (signupName.trim().toLowerCase() === 'admin') return triggerError('This profile name is reserved.');
    
    setIsLoading(true);

    setTimeout(() => {
        const newProfileId = `user_${Date.now()}`;
        let teamId: string | undefined = undefined;

        if (inviteCode.trim()) {
            try {
                const invites: TeamInvite[] = JSON.parse(localStorage.getItem('yin_trade_invites') || '[]');
                const teams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
                const validInvite = invites.find(inv => inv.code === inviteCode.trim());
                
                if (!validInvite) {
                    triggerError('Invalid invite code.');
                    setIsLoading(false);
                    return;
                }
                teamId = validInvite.teamId;
                const teamIndex = teams.findIndex(t => t.id === teamId);
                if (teamIndex !== -1) {
                    teams[teamIndex].memberIds.push(newProfileId);
                    localStorage.setItem('yin_trade_teams', JSON.stringify(teams));
                }
            } catch (e) {
                triggerError('Error processing invite code.');
                setIsLoading(false);
                return;
            }
        }

        const newProfile: UserProfile = {
            id: newProfileId,
            name: signupName.trim(),
            createdAt: Date.now(),
            password: hashPassword(signupPassword),
            teamId: teamId,
            isTeamLeader: false,
        };

        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);
        localStorage.setItem('yin_trade_profiles', JSON.stringify(updatedProfiles));
        onProfileSelected(newProfile);
    }, 500);
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
    <div className="min-h-screen themed-bg-shimmer text-base-content font-sans flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-6 right-6 animate-fade-in" style={{ animationDelay: '500ms'}}>
            <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
        </div>
        
        <div className="w-full max-w-sm">
            <div className="flex flex-col items-center text-center mb-8 animate-fade-in-up">
                <div className="bg-primary/20 p-3 rounded-2xl mb-4">
                    <LogoIcon className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-text-strong tracking-tight" style={{ animationDelay: '100ms'}}>YIN Trade Simulator</h1>
                <p className="text-base-content/80 transition-opacity duration-300" style={{ animationDelay: '200ms'}}>
                  {view === 'login' ? 'Welcome Back, Future Investor' : 'Create Your Trading Profile'}
                </p>
            </div>

            <div 
              className={`bg-base-200 rounded-2xl shadow-2xl border border-base-300/50 relative animate-fade-in-up ${shouldShake ? 'animate-shake' : ''}`}
              style={{ animationDelay: '300ms' }}
              onAnimationEnd={() => setShouldShake(false)}
            >
              <div className="relative h-[480px] overflow-hidden">
                {/* Login Form */}
                <div 
                  className="p-8 absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out"
                  style={{ transform: view === 'login' ? 'translateX(0)' : 'translateX(-100%)' }}
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-strong mb-4 text-center">Login to Your Profile</h2>
                      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms'}}>
                          <label htmlFor="loginName" className="sr-only">Profile Name</label>
                          <input
                              id="loginName"
                              type="text"
                              value={loginName}
                              onChange={(e) => { setLoginName(e.target.value); setError(''); }}
                              placeholder="Profile Name or 'Admin'"
                              className="input input-bordered w-full bg-base-100 border-base-300"
                              required
                          />
                      </div>
                      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms'}}>
                          <label htmlFor="loginPassword" className="sr-only">Password</label>
                          <input
                              id="loginPassword"
                              type="password"
                              value={loginPassword}
                              onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                              placeholder="Password (if set)"
                              className="input input-bordered w-full bg-base-100 border-base-300"
                          />
                      </div>
                      <div className="h-5 text-center flex items-center justify-center">
                        {error && <p className="text-sm text-error text-center">{error}</p>}
                      </div>
                      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms'}}>
                        <Button type="submit" className="w-full !py-3 !text-base" loading={isLoading}>
                            Login & Start Trading
                        </Button>
                      </div>
                      <p className="text-center text-sm pt-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '700ms'}}>
                          Don't have an account?{' '}
                          <button type="button" onClick={() => toggleView('signup')} className="font-semibold text-primary hover:underline">
                              Sign Up
                          </button>
                      </p>
                  </form>
                </div>
                {/* Signup Form */}
                <div 
                  className="p-8 absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out"
                  style={{ transform: view === 'signup' ? 'translateX(0)' : 'translateX(100%)' }}
                >
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-strong mb-4 text-center">Create Profile</h2>
                      <div>
                          <label htmlFor="signupName" className="sr-only">Profile Name</label>
                          <input
                              id="signupName"
                              type="text"
                              value={signupName}
                              onChange={(e) => { setSignupName(e.target.value); setError(''); }}
                              placeholder="Choose your trader name"
                              className="input input-bordered w-full bg-base-100 border-base-300"
                              required
                          />
                      </div>
                      <div>
                          <label htmlFor="signupPassword" className="sr-only">Password</label>
                          <input
                              id="signupPassword"
                              type="password"
                              value={signupPassword}
                              onChange={(e) => { setSignupPassword(e.target.value); setError(''); }}
                              placeholder="Password (min. 6 characters)"
                              className="input input-bordered w-full bg-base-100 border-base-300"
                              required
                          />
                      </div>
                      <div>
                          <label htmlFor="signupConfirmPassword" className="sr-only">Confirm Password</label>
                          <input
                              id="signupConfirmPassword"
                              type="password"
                              value={signupConfirmPassword}
                              onChange={(e) => { setSignupConfirmPassword(e.target.value); setError(''); }}
                              placeholder="Confirm Password"
                              className="input input-bordered w-full bg-base-100 border-base-300"
                              required
                          />
                      </div>
                        <div>
                          <label htmlFor="inviteCode" className="sr-only">Invite Code</label>
                          <input
                              id="inviteCode"
                              type="text"
                              value={inviteCode}
                              onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
                              placeholder="Invite Code (Optional)"
                              className="input input-bordered w-full bg-base-100 border-base-300"
                          />
                      </div>
                       <div className="h-5 text-center flex items-center justify-center">
                        {error && <p className="text-sm text-error text-center">{error}</p>}
                      </div>
                      <Button type="submit" className="w-full !py-3 !text-base" loading={isLoading}>
                          Create & Start Trading
                      </Button>
                       <p className="text-center text-sm pt-2">
                          Already have an account?{' '}
                          <button type="button" onClick={() => toggleView('login')} className="font-semibold text-primary hover:underline">
                              Log In
                          </button>
                      </p>
                  </form>
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