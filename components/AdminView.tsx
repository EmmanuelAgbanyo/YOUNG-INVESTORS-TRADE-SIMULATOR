

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { UserProfile, ProfileState, Stock, Team, AdminSettings, ToastMessage, Module, MarketStatus } from '../types.ts';
import Card from './ui/Card.tsx';
import { 
    DEFAULT_STARTING_CAPITAL, DEFAULT_ANNUAL_DRIFT, DEFAULT_ANNUAL_VOLATILITY, 
    DEFAULT_EVENT_CHANCE_PER_TICK, DEFAULT_MARKET_DURATION_MINUTES,
    DEFAULT_CIRCUIT_BREAKER_ENABLED, DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
    DEFAULT_CIRCUIT_BREAKER_HALT_SECONDS, DEFAULT_SIMULATION_SPEED,
    DEFAULT_INTEREST_RATE, DEFAULT_COMMISSION_FEE
} from '../constants.ts';
import { MARKET_EVENTS_TEMPLATES } from '../hooks/useStockMarket.ts';
import { ACADEMY_MODULES } from '../academy-content.ts';
import Button from './ui/Button.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';

interface AdminViewProps {
    stocks: Stock[];
    setToast: (toast: ToastMessage | null) => void;
    marketStatus: MarketStatus;
    openMarketAdmin: () => void;
    closeMarketAdmin: () => void;
}

interface ProfileSummaryData {
    profile: UserProfile;
    state: ProfileState | null;
    portfolioValue: number;
    pnl: number;
}

// Sub-Components
const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-base-200 rounded-lg border border-base-300">
            <button
                className="w-full flex justify-between items-center p-4 font-bold text-text-strong"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 border-t border-base-300">{children}</div>}
        </div>
    );
};

const ManageUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    profileData: ProfileSummaryData | null;
    onResetProfile: (profileId: string) => void;
    onAdjustCash: (profileId: string, amount: number) => void;
}> = ({ isOpen, onClose, profileData, onResetProfile, onAdjustCash }) => {
    const [cashAmount, setCashAmount] = useState('');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    if (!isOpen || !profileData) return null;

    const handleAdjustCash = () => {
        const amount = parseFloat(cashAmount);
        if (!isNaN(amount)) {
            onAdjustCash(profileData.profile.id, amount);
            setCashAmount('');
        }
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
                <Card className="w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-text-strong mb-4">Manage Trader: {profileData.profile.name}</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-text-strong">Adjust Cash Balance</h3>
                            <div className="flex items-center space-x-2 mt-2">
                                <input type="number" placeholder="e.g., 5000 or -1000" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="input input-bordered w-full bg-base-100" />
                                <Button onClick={handleAdjustCash} disabled={!cashAmount}>Apply</Button>
                            </div>
                        </div>

                        <div className="border-t border-base-300 pt-4">
                             <h3 className="font-semibold text-error">Danger Zone</h3>
                             <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-base-content/70">Reset this trader to starting conditions.</p>
                                <Button variant="error" size="sm" onClick={() => setIsResetConfirmOpen(true)}>Reset Profile</Button>
                             </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button variant="ghost" onClick={onClose}>Close</Button>
                    </div>
                </Card>
            </div>
             <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={() => {
                    onResetProfile(profileData.profile.id);
                    setIsResetConfirmOpen(false);
                    onClose();
                }}
                title="Confirm Profile Reset"
                confirmText="Yes, Reset"
                confirmVariant="error"
             >
                <p>Are you sure you want to reset {profileData.profile.name}'s profile? Their portfolio and history will be deleted.</p>
             </ConfirmationModal>
        </>
    );
};


// Icons
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);
const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM10.5 9a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.89 6.663a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM21.75 12a9.75 9.75 0 10-19.5 0 9.75 9.75 0 0019.5 0z" /></svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 12.375a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg>
);
const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.036.243c-2.132 0-4.14-.834-5.657-2.343-1.517-1.509-2.343-3.525-2.343-5.657s.826-4.148 2.343-5.657c1.517-1.509 3.526-2.343 5.657-2.343m-7.087 7.087c-1.134.628-2.094 1.434-2.896 2.387M5.25 4.97A48.416 48.416 0 0112 4.5c2.291 0 4.545.16 6.75.47m-13.5 0c-1.01.143-2.01.317-3 .52m3-.52l-2.62 10.726c-.122.499.106 1.028-.589 1.202a5.989 5.989 0 002.036.243c2.132 0 4.14-.834 5.657-2.343 1.517-1.509 2.343-3.525-2.343-5.657s-.826-4.148-2.343-5.657c-1.517-1.509-3.526-2.343-5.657-2.343m7.087 7.087c1.134.628 2.094 1.434 2.896 2.387" /></svg>
);
const ArrowTrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);
const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
);
const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
    </svg>
);

const BigMarketClock: React.FC<{ status: MarketStatus }> = ({ status }) => {
    const statusConfig = {
        OPEN: { text: 'OPEN', color: 'text-success', pulse: true },
        CLOSED: { text: 'CLOSED', color: 'text-error', pulse: false },
        PRE_MARKET: { text: 'PRE-MARKET', color: 'text-info', pulse: true },
        HALTED: { text: 'HALTED', color: 'text-warning', pulse: true },
    };
    const config = statusConfig[status];

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`relative flex h-4 w-4`}>
                {config.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color.replace('text-', 'bg-')}`}></span>}
                <span className={`relative inline-flex rounded-full h-4 w-4 ${config.color.replace('text-', 'bg-')}`}></span>
            </div>
            <span className={`font-bold text-2xl tracking-wider ${config.color}`}>{config.text}</span>
        </div>
    );
};


const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <Card><div className="flex items-center space-x-4"><div className="p-3 bg-base-300 rounded-lg">{icon}</div><div><div className="text-sm text-base-content/70">{label}</div><div className="text-2xl font-bold text-text-strong">{value}</div></div></div></Card>
);

const AdminView: React.FC<AdminViewProps> = ({ stocks, setToast, marketStatus, openMarketAdmin, closeMarketAdmin }) => {
    const [allProfilesData, setAllProfilesData] = useState<ProfileSummaryData[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [initialSettings, setInitialSettings] = useState<AdminSettings | null>(null);
    const [formSettings, setFormSettings] = useState<AdminSettings | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isCloseMarketConfirmOpen, setIsCloseMarketConfirmOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    const [activeTab, setActiveTab] = useState<'Dashboard' |'Traders' | 'Teams' | 'Settings' | 'Academy'>('Dashboard');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [manualEvent, setManualEvent] = useState('');
    const [isManageUserModalOpen, setIsManageUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<ProfileSummaryData | null>(null);
    const [videoLinks, setVideoLinks] = useState<Record<string, string>>({});
    
    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
    const stockMap = useMemo(() => new Map(stocks.map(s => [s.symbol, s.price])), [stocks]);

    const loadData = useCallback(() => {
        try {
            const profiles: UserProfile[] = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
            const teams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
            const settingsJSON = localStorage.getItem('yin_trade_admin_settings');
             
            const settings: AdminSettings = settingsJSON ? {
                startingCapital: DEFAULT_STARTING_CAPITAL, interestRate: DEFAULT_INTEREST_RATE, commissionFee: DEFAULT_COMMISSION_FEE, ...JSON.parse(settingsJSON)
            } : {
                startingCapital: DEFAULT_STARTING_CAPITAL, settlementCycle: 'T+2', baseDrift: DEFAULT_ANNUAL_DRIFT, baseVolatility: DEFAULT_ANNUAL_VOLATILITY, eventFrequency: DEFAULT_EVENT_CHANCE_PER_TICK,
                marketDurationMinutes: DEFAULT_MARKET_DURATION_MINUTES, circuitBreakerEnabled: DEFAULT_CIRCUIT_BREAKER_ENABLED, circuitBreakerThreshold: DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
                circuitBreakerHaltSeconds: DEFAULT_CIRCUIT_BREAKER_HALT_SECONDS, simulationSpeed: DEFAULT_SIMULATION_SPEED, interestRate: DEFAULT_INTEREST_RATE, commissionFee: DEFAULT_COMMISSION_FEE,
            };
            setInitialSettings(settings); setFormSettings(settings); setAllTeams(teams);

            const storedVideos = localStorage.getItem('yin_trade_academy_videos');
            if (storedVideos) {
                setVideoLinks(JSON.parse(storedVideos));
            }

            const profileData = profiles.filter(p => p.name !== 'Admin').map(profile => {
                const leaderId = profile.isTeamLeader ? profile.id : teams.find(t => t.id === profile.teamId)?.leaderId;
                const stateKeyId = leaderId || profile.id;
                const stateJSON = localStorage.getItem(`yin_trade_profile_${stateKeyId}`);
                const state: ProfileState | null = stateJSON ? JSON.parse(stateJSON) : null;
                
                let holdingsValue = 0, totalCostBasis = 0;
                if (state) {
                    Object.values(state.portfolio.holdings).forEach(h => {
                        const price = stockMap.get(h.symbol) || 0;
                        holdingsValue += h.quantity * price;
                        totalCostBasis += h.quantity * h.avgCost;
                    });
                }
                const totalUnsettledCash = state?.portfolio.unsettledCash.reduce((sum, item) => sum + item.amount, 0) ?? 0;
                const portfolioValue = (state?.portfolio.cash ?? settings.startingCapital) + totalUnsettledCash + holdingsValue;
                const pnl = portfolioValue - settings.startingCapital;
                return { profile, state, portfolioValue, pnl };
            });
            setAllProfilesData(profileData);
        } catch (e) { console.error("Failed to load admin data:", e); }
    }, [stockMap]);
    
    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { setIsDirty(JSON.stringify(initialSettings) !== JSON.stringify(formSettings)); }, [formSettings, initialSettings]);
    
    const handleSettingsSave = useCallback(() => {
        if (!formSettings) return;
        localStorage.setItem('yin_trade_admin_settings', JSON.stringify(formSettings));
        setInitialSettings(formSettings);
        setToast({ type: 'success', text: `Settings saved! Changes will apply on the next market session.` });
    }, [formSettings, setToast]);

    const handleVideoLinksSave = useCallback(() => {
        localStorage.setItem('yin_trade_academy_videos', JSON.stringify(videoLinks));
        setToast({ type: 'success', text: `Academy video links have been updated.` });
    }, [videoLinks, setToast]);

    const handleResetAllData = useCallback(() => {
        Object.keys(localStorage).forEach(key => { if (key.startsWith('yin_trade_')) localStorage.removeItem(key); });
        setIsResetModalOpen(false); setResetConfirmationText('');
        setToast({ type: 'success', text: 'All trader data has been reset!'});
        loadData();
    }, [setToast, loadData]);

    const handleBroadcast = useCallback(() => {
        if (!broadcastMessage.trim()) return;
        localStorage.setItem('yin_trade_broadcast', JSON.stringify({ message: broadcastMessage, timestamp: Date.now() }));
        setToast({ type: 'success', text: 'Broadcast sent to all users!' });
        setBroadcastMessage('');
    }, [broadcastMessage, setToast]);
    
    const handleTriggerEvent = useCallback(() => {
        if (!manualEvent) return;
        localStorage.setItem('yin_trade_manual_event', JSON.stringify({ eventName: manualEvent, timestamp: Date.now() }));
        setToast({ type: 'info', text: `Event "${manualEvent}" triggered!` });
        setManualEvent('');
    }, [manualEvent, setToast]);
    
    const handleManageUser = (profileData: ProfileSummaryData) => { setSelectedUser(profileData); setIsManageUserModalOpen(true); };

    const handleResetProfile = useCallback((profileId: string) => {
        const profileData = allProfilesData.find(p => p.profile.id === profileId);
        if (!profileData) return;
        const key = `yin_trade_profile_${profileData.profile.teamId ? allTeams.find(t=>t.id === profileData.profile.teamId)?.leaderId : profileId}`;
        localStorage.removeItem(key);
        setToast({ type: 'success', text: `Portfolio for ${profileData.profile.name} has been reset.` });
        loadData();
    }, [allProfilesData, allTeams, setToast, loadData]);

    const handleAdjustCash = useCallback((profileId: string, amount: number) => {
        const profileData = allProfilesData.find(p => p.profile.id === profileId);
        if (!profileData) return;
        const key = `yin_trade_profile_${profileData.profile.teamId ? allTeams.find(t=>t.id === profileData.profile.teamId)?.leaderId : profileId}`;
        const stateJSON = localStorage.getItem(key);
        if(stateJSON){
            const state = JSON.parse(stateJSON);
            state.portfolio.cash += amount;
            localStorage.setItem(key, JSON.stringify(state));
            setToast({ type: 'success', text: `GHS ${amount.toFixed(2)} ${amount > 0 ? 'added to' : 'removed from'} ${profileData.profile.name}.` });
            loadData();
        }
    }, [allProfilesData, allTeams, setToast, loadData]);
    
    const totalUsers = allProfilesData.length;
    const soloAndLeaderProfiles = useMemo(() => allProfilesData.filter(p => p.profile.isTeamLeader || !p.profile.teamId), [allProfilesData]);
    const totalAUM = useMemo(() => soloAndLeaderProfiles.reduce((sum, data) => sum + data.portfolioValue, 0), [soloAndLeaderProfiles]);
    const totalTrades = useMemo(() => allProfilesData.reduce((sum, data) => sum + (data.state?.orderHistory.filter(o => o.finalStatus === 'EXECUTED').length ?? 0), 0), [allProfilesData]);
    const sortedProfiles = [...allProfilesData].sort((a, b) => b.portfolioValue - a.portfolioValue);
    
    const renderDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                <StatCard icon={<UsersIcon className="w-6 h-6 text-primary" />} label="Total Traders" value={totalUsers.toLocaleString()} />
                <StatCard icon={<ScaleIcon className="w-6 h-6 text-secondary" />} label="Total AUM" value={formatter.format(totalAUM)} />
                <StatCard icon={<ArrowTrendingUpIcon className="w-6 h-6 text-success" />} label="Total Trades" value={totalTrades.toLocaleString()} />
            </div>
             <Card className="lg:col-span-3">
                 <h3 className="text-xl font-bold text-text-strong mb-4">Market Controls</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center p-4 bg-base-100 rounded-lg">
                    <div className="lg:col-span-2 space-y-4">
                         <div>
                            <label className="block text-sm font-medium mb-1 text-base-content/80">Broadcast Message</label>
                            <div className="flex items-center space-x-2">
                                 <input type="text" placeholder="Announce a competition..." value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} className="input input-bordered w-full bg-base-200" />
                                 <Button onClick={handleBroadcast} disabled={!broadcastMessage}>Send</Button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-base-content/80">Trigger Market Event</label>
                            <div className="flex items-center space-x-2">
                                 <select value={manualEvent} onChange={e => setManualEvent(e.target.value)} className="select select-bordered w-full bg-base-200">
                                    <option value="" disabled>Select an event...</option>
                                    {MARKET_EVENTS_TEMPLATES.map(e => <option key={e.title} value={e.title}>{e.title}</option>)}
                                 </select>
                                 <Button onClick={handleTriggerEvent} disabled={!manualEvent}>Trigger</Button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col items-center justify-center h-full p-4 bg-base-200 rounded-lg border border-base-300">
                        <p className="text-sm font-semibold text-base-content mb-2">Session Control</p>
                        <BigMarketClock status={marketStatus} />
                        <div className="mt-4 w-full">
                            {(() => {
                                switch (marketStatus) {
                                    case 'OPEN':
                                        return (
                                            <Button onClick={() => setIsCloseMarketConfirmOpen(true)} variant="error" className="w-full !py-3 !text-base flex items-center justify-center">
                                                <StopIcon className="w-5 h-5 mr-2" />
                                                Close Market
                                            </Button>
                                        );
                                    case 'PRE_MARKET':
                                    case 'CLOSED':
                                        return (
                                            <Button onClick={openMarketAdmin} variant="success" className="w-full !py-3 !text-base flex items-center justify-center animate-pulse">
                                                <PlayIcon className="w-5 h-5 mr-2" />
                                                Open Market
                                            </Button>
                                        );
                                    case 'HALTED':
                                        return (
                                            <Button variant="ghost" className="w-full !py-3 !text-base" disabled>
                                                Market Halted
                                            </Button>
                                        );
                                    default:
                                        return null;
                                }
                            })()}
                        </div>
                    </div>
                 </div>
            </Card>
        </div>
    );
    
    const renderTradersView = () => (
        <Card className="!p-0"><h3 className="text-xl font-bold text-text-strong p-4">Trader Leaderboard</h3><div className="overflow-x-auto"><table className="table w-full"><thead><tr className="border-b border-t border-base-300"><th className="text-left bg-transparent text-base-content font-semibold p-4">Rank</th><th className="text-left bg-transparent text-base-content font-semibold p-4">Trader Name</th><th className="text-right bg-transparent text-base-content font-semibold p-4">Portfolio Value</th><th className="text-right bg-transparent text-base-content font-semibold p-4">Total P/L</th><th className="text-center bg-transparent text-base-content font-semibold p-4">Actions</th></tr></thead><tbody>
{/* FIX: Explicitly type the 'data' parameter to resolve 'unknown' type error. */}
        {sortedProfiles.map((data: ProfileSummaryData, index) => (<tr key={data.profile.id} className={`border-b border-base-300/50 last:border-b-0 ${index % 2 === 0 ? 'bg-base-200/30' : ''}`}><td className="p-4 font-bold text-text-strong text-lg">#{index + 1}</td><td className="p-4 font-semibold text-text-strong">{data.profile.name} {data.profile.teamId && `(${allTeams.find(t=>t.id===data.profile.teamId)?.name})`}</td><td className="p-4 text-right font-mono text-primary">{formatter.format(data.portfolioValue)}</td><td className={`p-4 text-right font-mono ${data.pnl >= 0 ? 'text-success' : 'text-error'}`}>{formatter.format(data.pnl)}</td><td className="p-4 text-center"><Button size="sm" variant="ghost" onClick={() => handleManageUser(data)}>Manage</Button></td></tr>))}
        </tbody></table></div></Card>
    );

    const renderTeamsView = () => {
        const profileMap = new Map(allProfilesData.map(p => [p.profile.id, p]));
        return (<Card className="!p-0"><h3 className="text-xl font-bold text-text-strong p-4">Team Overview</h3><div className="overflow-x-auto"><table className="table w-full"><thead><tr className="border-b border-t border-base-300"><th className="text-left bg-transparent text-base-content font-semibold p-4">Team Name</th><th className="text-left bg-transparent text-base-content font-semibold p-4">Team Leader</th><th className="text-left bg-transparent text-base-content font-semibold p-4">Members</th><th className="text-right bg-transparent text-base-content font-semibold p-4">Team Portfolio Value</th></tr></thead><tbody>
        {allTeams.map((team, index) => { const leaderData = profileMap.get(team.leaderId); const members = team.memberIds.map(id => profileMap.get(id)?.profile.name).filter(Boolean);
        return (<tr key={team.id} className={`border-b border-base-300/50 last:border-b-0 ${index % 2 === 0 ? 'bg-base-200/30' : ''}`}><td className="p-4 font-bold text-text-strong">{team.name}</td><td className="p-4">{leaderData?.profile.name || 'N/A'}</td><td className="p-4">{members.join(', ')}</td><td className="p-4 text-right font-mono text-primary">{formatter.format(leaderData?.portfolioValue || 0)}</td></tr>)})}
        </tbody></table></div></Card>);
    };

    const renderAcademyManagementView = () => (
        <Card>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-text-strong">Academy Content Management</h3>
                    <p className="text-base-content/70">Assign YouTube video IDs to academy lessons.</p>
                </div>
                <Button onClick={handleVideoLinksSave}>Save Video Links</Button>
            </div>
            <div className="space-y-4">
                {ACADEMY_MODULES.map(module => (
                    <Accordion key={module.id} title={module.title}>
                        <div className="space-y-4">
                            {module.lessons.map(lesson => (
                                <div key={lesson.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <label htmlFor={`video-${lesson.id}`} className="font-semibold text-text-strong md:col-span-1">{lesson.title}</label>
                                    <div className="md:col-span-2">
                                        <input
                                            id={`video-${lesson.id}`}
                                            type="text"
                                            placeholder="Paste YouTube Video ID"
                                            value={videoLinks[lesson.id] || ''}
                                            onChange={e => setVideoLinks(prev => ({ ...prev, [lesson.id]: e.target.value }))}
                                            className="input input-bordered w-full bg-base-100"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                ))}
            </div>
        </Card>
    );

    const renderSettingsView = () => {
        if (!formSettings) return null;
        const presets: Record<string, Partial<AdminSettings>> = {
            'Calm Bull Market': { baseDrift: 0.15, baseVolatility: 0.10, eventFrequency: 0.01, simulationSpeed: 'Slow', interestRate: 0.015 },
            'Volatile Bear Market': { baseDrift: -0.10, baseVolatility: 0.40, eventFrequency: 0.15, simulationSpeed: 'Fast', interestRate: 0.05 },
            'Standard Conditions': { startingCapital: DEFAULT_STARTING_CAPITAL, baseDrift: DEFAULT_ANNUAL_DRIFT, baseVolatility: DEFAULT_ANNUAL_VOLATILITY, eventFrequency: DEFAULT_EVENT_CHANCE_PER_TICK, simulationSpeed: 'Normal', interestRate: DEFAULT_INTEREST_RATE },
        };
        return (<div className="space-y-6"><Card><h3 className="text-lg font-bold text-text-strong mb-4">Scenario Presets</h3><div className="flex flex-wrap gap-2">{Object.entries(presets).map(([name, settings]) => (<Button key={name} variant="ghost" size="sm" onClick={() => setFormSettings({ ...formSettings, ...settings })}>{name}</Button>))}</div></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                <Accordion title="Market Dynamics" defaultOpen={true}><div className="space-y-4"><div className="group relative"><label htmlFor="drift" className="block text-sm font-medium mb-1 text-base-content/80">Base Market Drift <span className="font-bold text-primary">{(formSettings.baseDrift * 100).toFixed(1)}%</span></label><InfoIcon className="w-4 h-4 text-base-content/50 absolute top-0 right-0 cursor-help" title="The underlying annual trend. Negative is a bear market, positive is a bull market."/><input id="drift" type="range" min="-0.2" max="0.3" step="0.01" value={formSettings.baseDrift} onChange={e => setFormSettings({...formSettings, baseDrift: parseFloat(e.target.value)})} className="range range-primary" /></div><div className="group relative"><label htmlFor="volatility" className="block text-sm font-medium mb-1 text-base-content/80">Base Market Volatility <span className="font-bold text-primary">{(formSettings.baseVolatility * 100).toFixed(1)}%</span></label><InfoIcon className="w-4 h-4 text-base-content/50 absolute top-0 right-0 cursor-help" title="How much prices fluctuate. Higher means more risk and larger price swings."/><input id="volatility" type="range" min="0.05" max="0.5" step="0.01" value={formSettings.baseVolatility} onChange={e => setFormSettings({...formSettings, baseVolatility: parseFloat(e.target.value)})} className="range range-secondary" /></div><div className="group relative"><label htmlFor="eventFreq" className="block text-sm font-medium mb-1 text-base-content/80">Market Event Frequency <span className="font-bold text-primary">{(formSettings.eventFrequency * 100).toFixed(0)}%</span></label><InfoIcon className="w-4 h-4 text-base-content/50 absolute top-0 right-0 cursor-help" title="The chance of a random market-wide event occurring on each price tick."/><input id="eventFreq" type="range" min="0" max="0.2" step="0.01" value={formSettings.eventFrequency} onChange={e => setFormSettings({...formSettings, eventFrequency: parseFloat(e.target.value)})} className="range range-accent" /></div></div></Accordion>
                <Accordion title="Economic Factors"><div className="space-y-4"><div className="group relative"><label htmlFor="interestRate" className="block text-sm font-medium mb-1 text-base-content/80">Interest Rate <span className="font-bold text-primary">{(formSettings.interestRate * 100).toFixed(1)}%</span></label><InfoIcon className="w-4 h-4 text-base-content/50 absolute top-0 right-0 cursor-help" title="Simulated central bank rate. Higher rates apply a drag to market growth."/><input id="interestRate" type="range" min="0" max="0.1" step="0.005" value={formSettings.interestRate} onChange={e => setFormSettings({...formSettings, interestRate: parseFloat(e.target.value)})} className="range range-info" /></div></div></Accordion>
            </div>
            <div className="space-y-6">
                 <Accordion title="Trading Rules"><div className="space-y-4"><div><label htmlFor="capital" className="block text-sm font-medium text-base-content/80 mb-1">Starting Capital (GHS)</label><input id="capital" type="number" step="1000" min="0" value={formSettings.startingCapital} onChange={e => setFormSettings({...formSettings, startingCapital: parseInt(e.target.value, 10)})} className="input input-bordered w-full bg-base-100" /></div><div><label htmlFor="duration" className="block text-sm font-medium text-base-content/80 mb-1">Session Duration (minutes)</label><input id="duration" type="number" value={formSettings.marketDurationMinutes} onChange={e => setFormSettings({...formSettings, marketDurationMinutes: parseInt(e.target.value, 10)})} className="input input-bordered w-full bg-base-100" /></div><div><label htmlFor="speed" className="block text-sm font-medium text-base-content/80 mb-1">Simulation Speed</label><select id="speed" value={formSettings.simulationSpeed} onChange={e => setFormSettings({...formSettings, simulationSpeed: e.target.value as AdminSettings['simulationSpeed']})} className="select select-bordered w-full bg-base-100"><option>Slow</option><option>Normal</option><option>Fast</option></select></div><div className="group relative"><label htmlFor="commission" className="block text-sm font-medium text-base-content/80 mb-1">Commission Fee (%)</label><InfoIcon className="w-4 h-4 text-base-content/50 absolute top-0 right-0 cursor-help" title="A percentage-based fee applied to every trade execution."/><input id="commission" type="number" step="0.01" min="0" max="5" value={formSettings.commissionFee * 100} onChange={e => setFormSettings({...formSettings, commissionFee: parseFloat(e.target.value) / 100})} className="input input-bordered w-full bg-base-100" /></div></div></Accordion>
                 <Accordion title="Risk Management"><div className="space-y-4"><div><label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-medium text-base-content/80">Enable Circuit Breakers</span><input type="checkbox" className="toggle toggle-primary" checked={formSettings.circuitBreakerEnabled} onChange={e => setFormSettings({...formSettings, circuitBreakerEnabled: e.target.checked})} /></label></div>{formSettings.circuitBreakerEnabled && (<><div><label htmlFor="breaker-threshold" className="block text-sm font-medium text-base-content/80 mb-1">Breaker Threshold (%)</label><input id="breaker-threshold" type="number" value={formSettings.circuitBreakerThreshold * 100} onChange={e => setFormSettings({...formSettings, circuitBreakerThreshold: parseFloat(e.target.value) / 100})} className="input input-bordered w-full bg-base-100" /></div><div><label htmlFor="breaker-halt" className="block text-sm font-medium text-base-content/80 mb-1">Halt Duration (seconds)</label><input id="breaker-halt" type="number" value={formSettings.circuitBreakerHaltSeconds} onChange={e => setFormSettings({...formSettings, circuitBreakerHaltSeconds: parseInt(e.target.value, 10)})} className="input input-bordered w-full bg-base-100" /></div></>)}</div></Accordion>
            </div>
        </div>
        <div className="flex justify-end mt-6"><Button onClick={handleSettingsSave} disabled={!isDirty}>Save Changes</Button></div>
        <Card className="border-error/50 mt-6"><h3 className="text-lg font-bold text-error mb-2">Danger Zone</h3><div className="flex items-center justify-between"><div><p className="font-semibold text-text-strong">Reset All Trader Data</p><p className="text-sm text-base-content/70">Permanently delete all user profiles, portfolios, teams, and order history.</p></div><Button variant="error" onClick={() => setIsResetModalOpen(true)}>Reset Simulation</Button></div></Card>
        <ConfirmationModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetAllData} title="Confirm Full Simulation Reset" confirmText="Permanently Reset" confirmVariant="error" isConfirmDisabled={resetConfirmationText !== 'RESET'}><p className="mb-4">This action is irreversible. To proceed, please type <strong className="text-error font-mono">RESET</strong> in the box below.</p><input type="text" className="input input-bordered w-full" value={resetConfirmationText} onChange={(e) => setResetConfirmationText(e.target.value)}/></ConfirmationModal>
        </div>);
    }

    const renderContent = () => {
        switch(activeTab) { case 'Dashboard': return renderDashboard(); case 'Traders': return renderTradersView(); case 'Teams': return renderTeamsView(); case 'Academy': return renderAcademyManagementView(); case 'Settings': return renderSettingsView(); default: return null; }
    }
    const tabs: ('Dashboard' |'Traders' | 'Teams' | 'Academy' | 'Settings')[] = ['Dashboard', 'Traders', 'Teams', 'Academy', 'Settings'];
    return (<div className="space-y-6"><h2 className="text-3xl font-bold text-text-strong">Admin Control Center</h2><div className="flex items-center border-b border-base-300 overflow-x-auto">
        {tabs.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 font-semibold text-sm transition-colors duration-200 border-b-2 shrink-0 ${activeTab === tab ? 'text-primary border-primary' : 'text-base-content/70 border-transparent hover:text-text-strong'}`}>{tab}</button>))}
        </div><div key={activeTab} className="animate-fade-in">{renderContent()}</div>
        <ManageUserModal isOpen={isManageUserModalOpen} onClose={() => setIsManageUserModalOpen(false)} profileData={selectedUser} onResetProfile={handleResetProfile} onAdjustCash={handleAdjustCash} />
        <ConfirmationModal
                isOpen={isCloseMarketConfirmOpen}
                onClose={() => setIsCloseMarketConfirmOpen(false)}
                onConfirm={() => {
                    closeMarketAdmin();
                    setIsCloseMarketConfirmOpen(false);
                }}
                title="Confirm Market Closure"
                confirmText="Yes, Close Market"
                confirmVariant="error"
             >
                <p>Are you sure you want to close the market? This will end the current trading session for all users and expire any pending orders.</p>
             </ConfirmationModal>
        </div>);
};

export default AdminView;
