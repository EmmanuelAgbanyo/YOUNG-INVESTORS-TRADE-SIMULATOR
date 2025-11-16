
import React, { useState, useRef, useEffect } from 'react';
import ThemeSwitcher from './ui/ThemeSwitcher.tsx';
import type { MarketSentiment, UserProfile, Team, MarketStatus } from '../types.ts';

interface HeaderProps {
    theme: string;
    toggleTheme: () => void;
    cash: number;
    marketSentiment: MarketSentiment;
    marketStatus: MarketStatus;
    onOpenGuide: () => void;
    profile: UserProfile;
    onLogout: () => void;
    onSecureProfile: () => void;
    onCreateTeam: () => void;
    onViewInviteCode: () => void;
}

const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);

const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
  </svg>
);

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 0115 12a3.75 3.75 0 01-2.25 3.512m-3.75 1.488A2.25 2.25 0 016.75 18v-2.25m0 0a3.75 3.75 0 01-3.75-3.75m3.75 3.75A3.75 3.75 0 016 16.5m-3 3.75a3.75 3.75 0 01-3.75-3.75m0 0A3.75 3.75 0 013 12.75m3.75 1.488A3.75 3.75 0 019 15.25m-3.75 1.488a3.75 3.75 0 01-3.75-3.75m3.75 3.75c-1.33 0-2.51-.54-3.375-1.417-1.146-1.146-1.146-3.033 0-4.179 1.146-1.146 3.033-1.146 4.179 0 1.146 1.146 1.146 3.033 0 4.179Z" />
    </svg>
);

const TicketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h-1.5m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125H18v4.875c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-1.5-1.5H5.625c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5m9-1.5h-5.25m5.25 0h1.5m1.5 0h.375c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18v-4.875c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5m-9-1.5h5.25m-5.25 0h-1.5m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125H18v4.875c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-1.5-1.5H5.625c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5Z" />
    </svg>
);


const MarketClock: React.FC<{ status: MarketStatus }> = ({ status }) => {
    const statusConfig = {
        OPEN: { text: 'Market Open', color: 'text-success', pulse: true },
        CLOSED: { text: 'Market Closed', color: 'text-error', pulse: false },
        PRE_MARKET: { text: 'Pre-Market', color: 'text-info', pulse: true },
        HALTED: { text: 'Trading Halted', color: 'text-warning', pulse: true },
    };
    const config = statusConfig[status];

    return (
        <div className="flex items-center space-x-2 mr-4">
            <div className={`relative flex h-3 w-3`}>
                {config.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color.replace('text-', 'bg-')}`}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${config.color.replace('text-', 'bg-')}`}></span>
            </div>
            <span className={`font-semibold text-sm ${config.color}`}>{config.text}</span>
        </div>
    );
};

const UserMenu: React.FC<{
    cash: number;
    profile: UserProfile;
    onLogout: () => void;
    onSecureProfile: () => void;
    onCreateTeam: () => void;
    onViewInviteCode: () => void;
}> = ({ cash, profile, onLogout, onSecureProfile, onCreateTeam, onViewInviteCode }) => {
    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
    const [isOpen, setIsOpen] = useState(false);
    const [teamName, setTeamName] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const initial = profile.name ? profile.name.charAt(0).toUpperCase() : '?';
    const creationDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    
    useEffect(() => {
        if (profile.teamId) {
            try {
                const teams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
                const team = teams.find(t => t.id === profile.teamId);
                setTeamName(team ? team.name : null);
            } catch (e) {
                console.error("Failed to parse teams from localStorage", e);
                setTeamName(null);
            }
        } else {
            setTeamName(null);
        }
    }, [profile.teamId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <div className="relative" ref={menuRef}>
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="text-right hidden sm:block">
                    <div className="text-xs text-base-content">{profile.name}</div>
                    <div className="font-bold text-text-strong">{formatter.format(cash)}</div>
                </div>
                <div className="w-10 h-10 rounded-full themed-bg-gradient flex items-center justify-center text-white font-bold text-lg ring-2 ring-offset-2 ring-offset-base-200 ring-primary/50">
                    {initial}
                </div>
            </div>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-56 bg-base-200 rounded-lg shadow-xl border border-base-300/70 animate-fade-in z-30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-base-300">
                        <p className="text-sm font-semibold text-text-strong truncate">{profile.name}</p>
                        <p className="text-xs text-base-content/70">Trader since: {creationDate}</p>
                        {teamName && <p className="text-xs text-info font-semibold mt-1">Team: {teamName}</p>}
                    </div>
                    {!profile.password && profile.name !== 'Admin' && (
                        <button onClick={() => { onSecureProfile(); setIsOpen(false); }} className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-success hover:bg-success hover:text-white transition-colors duration-200">
                            <ShieldCheckIcon className="w-5 h-5" />
                            <span>Secure Profile</span>
                        </button>
                    )}
                    {!profile.teamId && profile.name !== 'Admin' && (
                         <button onClick={() => { onCreateTeam(); setIsOpen(false); }} className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-info hover:bg-info hover:text-white transition-colors duration-200">
                            <UsersIcon className="w-5 h-5" />
                            <span>Create Team</span>
                        </button>
                    )}
                    {profile.isTeamLeader && (
                         <button onClick={() => { onViewInviteCode(); setIsOpen(false); }} className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-secondary hover:bg-secondary hover:text-white transition-colors duration-200">
                            <TicketIcon className="w-5 h-5" />
                            <span>View Invite Code</span>
                        </button>
                    )}
                    <button onClick={onLogout} className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-error hover:bg-error hover:text-white transition-colors duration-200">
                        <LogoutIcon className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    )
};


const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, cash, marketSentiment, marketStatus, onOpenGuide, profile, onLogout, onSecureProfile, onCreateTeam, onViewInviteCode }) => {
  return (
    <header className="bg-base-200/80 backdrop-blur-md sticky top-0 z-20 border-b border-base-300/70 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center">
            <div className="bg-primary/20 p-2 rounded-lg mr-3">
                <LogoIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-text-strong tracking-wide hidden sm:block">
                YIN Trade Simulator
            </h1>
        </div>
        <div className="flex items-center space-x-4">
            <MarketClock status={marketStatus} />
            <button
                onClick={onOpenGuide}
                id="help-guide-button"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-base-300/70 hover:bg-base-300 text-base-content hover:text-text-strong transition-all"
                aria-label="Open Simulator Guide"
            >
                <QuestionMarkCircleIcon className="w-6 h-6" />
            </button>
            <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
            <div className="h-8 w-px bg-base-300/70 hidden md:block"></div>
            <UserMenu cash={cash} profile={profile} onLogout={onLogout} onSecureProfile={onSecureProfile} onCreateTeam={onCreateTeam} onViewInviteCode={onViewInviteCode} />
        </div>
      </div>
    </header>
  );
};

export default Header;
