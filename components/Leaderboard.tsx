import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../hooks/useAPI.ts';
import type { UserProfile, Stock } from '../types.ts';

interface LeaderboardProps {
    stocks: Stock[];
    currentUserProfile?: UserProfile | null;
    isAdmin?: boolean;
}

interface TraderStats {
    profileId: string;
    name: string;
    totalValue: number;
    plPercentage: number;
    tradesCount: number;
    isCurrentUser: boolean;
    isDisqualified: boolean;
    rank?: number;
}

const STARTING_CAPITAL = 100000;

const Leaderboard: React.FC<LeaderboardProps> = ({ stocks, currentUserProfile, isAdmin }) => {
    const [traderStats, setTraderStats] = useState<TraderStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Live data sources
    const [profiles, setProfiles] = useState<any[]>([]);
    const [portfolios, setPortfolios] = useState<any>({});
    const [holdings, setHoldings] = useState<any>({});
    const [history, setHistory] = useState<any>({});
    const [orders, setOrders] = useState<any>({});

    // 1. Subscribe to all data nodes on mount
    useEffect(() => {
        setIsLoading(true);
        const unsubProfiles = apiClient.subscribeProfiles((data) => { setProfiles(data); setIsLoading(false); });
        const unsubPortfolios = apiClient.subscribePortfolios(setPortfolios);
        const unsubHoldings = apiClient.subscribeHoldings(setHoldings);
        const unsubHistory = apiClient.subscribeHistory(setHistory);
        const unsubOrders = apiClient.subscribeOrders(setOrders);

        return () => {
            unsubProfiles();
            unsubPortfolios();
            unsubHoldings();
            unsubHistory();
            unsubOrders();
        };
    }, []);

    // 2. Recompute rankings whenever any source data OR stocks change
    useEffect(() => {
        if (profiles.length === 0 && !isLoading) return;

        const stats: TraderStats[] = profiles
            .filter(p => isAdmin || !p.isDisqualified) // Admins see ALL, users see only active
            .map(profile => {
                const portfolio = portfolios[profile.id] || { cash: STARTING_CAPITAL };
                const userHoldings = holdings[profile.id] || {};
                const userHistory = history[profile.id] || [];
                const userActiveOrders = orders[profile.id] || {};
                
                // Calculate market value
                let marketValue = 0;
                Object.entries(userHoldings).forEach(([symbol, holding]: [string, any]) => {
                    const currentStock = stocks.find(s => s.symbol === symbol);
                    marketValue += currentStock ? currentStock.price * holding.quantity : (holding.avg_cost || 0) * holding.quantity;
                });

                const totalValue = (portfolio.cash || 0) + marketValue;
                const plPercentage = ((totalValue - STARTING_CAPITAL) / STARTING_CAPITAL) * 100;
                
                // Logic: history (executed/cancelled) + activeOrders (pending/working)
                const historyCount = Array.isArray(userHistory) ? userHistory.length : Object.keys(userHistory).length;
                const activeCount = Array.isArray(userActiveOrders) ? userActiveOrders.length : Object.keys(userActiveOrders).length;
                const tradesCount = historyCount + activeCount;

                return {
                    profileId: profile.id,
                    name: profile.name,
                    totalValue,
                    plPercentage,
                    tradesCount,
                    isCurrentUser: currentUserProfile?.id === profile.id,
                    isDisqualified: !!profile.isDisqualified
                };
            });

        // SORTING: Active traders first (by P/L), then Disqualified traders (by P/L)
        stats.sort((a, b) => {
            if (a.isDisqualified === b.isDisqualified) {
                return b.plPercentage - a.plPercentage;
            }
            return a.isDisqualified ? 1 : -1;
        });

        // Assign ranks
        const rankedStats = stats.map((s, index) => ({ ...s, rank: index + 1 }));
        setTraderStats(rankedStats);
    }, [profiles, portfolios, holdings, history, orders, stocks, currentUserProfile, isAdmin, isLoading]);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val);

    const currentUserRank = useMemo(() => 
        traderStats.find(s => s.isCurrentUser), 
    [traderStats]);

    const topThree = useMemo(() => 
        traderStats.filter(s => !s.isDisqualified).slice(0, 3), 
    [traderStats]);

    const restOfTraders = useMemo(() => 
        traderStats.slice(3), 
    [traderStats]);

    return (
        <div className="w-full flex flex-col gap-10">
            {/* --- Personal Rank Banner (Imperial Elevation) --- */}
            {currentUserRank && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden group bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-[2rem] blur-2xl opacity-20 animate-pulse"></div>
                                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20 border border-white/20">
                                    #{currentUserRank.rank}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-text-strong tracking-tighter leading-none">Your Position</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">{currentUserRank.name} • Rank #{currentUserRank.rank}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="px-6 py-4 rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/40 shadow-sm">
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1.5">Portfolio Value</p>
                                <p className="text-2xl font-black text-text-strong tracking-tighter">{formatCurrency(currentUserRank.totalValue)}</p>
                            </div>
                            <div className={`px-6 py-4 rounded-3xl border shadow-sm ${currentUserRank.plPercentage >= 0 ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/30'}`}>
                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1.5">Profit / Loss</p>
                                <div className={`flex items-center gap-2 text-2xl font-black tracking-tighter ${currentUserRank.plPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {currentUserRank.plPercentage >= 0 ? '+' : ''}{currentUserRank.plPercentage.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- Elite Podium (Imperial Command) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                {topThree.map((trader, idx) => {
                    const isFirst = idx === 0;
                    const orderClasses = isFirst ? 'md:order-2 md:h-[420px]' : idx === 1 ? 'md:order-1 md:h-[360px]' : 'md:order-3 md:h-[320px]';
                    const gradientClasses = isFirst 
                        ? 'from-amber-400 via-yellow-500 to-amber-600 shadow-amber-500/20' 
                        : idx === 1 
                        ? 'from-slate-300 via-slate-400 to-slate-500 shadow-slate-400/20'
                        : 'from-orange-400 via-orange-500 to-orange-700 shadow-orange-500/20';

                    return (
                        <motion.div
                            key={trader.profileId}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.15, duration: 0.6 }}
                            whileHover={{ y: -12 }}
                            className={`${orderClasses} relative rounded-[3rem] p-8 overflow-hidden border border-white/20 dark:border-slate-800/30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl flex flex-col items-center text-center group`}
                        >
                            {/* Visual Decorations */}
                            <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${gradientClasses}`}></div>
                            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${gradientClasses} rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700`}></div>
                            
                            <div className="relative mt-4 mb-6">
                                <div className={`w-28 h-28 rounded-[2.5rem] bg-gradient-to-br ${gradientClasses} flex items-center justify-center text-4xl font-black text-white shadow-2xl border-4 border-white/20 relative z-10`}>
                                     {trader.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-text-strong shadow-xl border-2 border-slate-100 dark:border-slate-700 z-20">
                                    {trader.rank}
                                </div>
                            </div>

                            <h4 className="text-2xl font-black text-text-strong tracking-tighter mb-1">{trader.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Student Trader</p>

                            <div className="w-full space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</span>
                                    <span className="text-sm font-black text-text-strong tracking-tight">{formatCurrency(trader.totalValue)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance</span>
                                    <span className={`text-sm font-black ${trader.plPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {trader.plPercentage >= 0 ? '+' : ''}{trader.plPercentage.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trades</span>
                                    <span className="text-sm font-black text-text-strong">{trader.tradesCount} Ex.</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* --- Global Performance Board --- */}
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/20 dark:border-slate-800/20 shadow-2xl overflow-hidden">
                <header className="p-10 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-text-strong tracking-tighter leading-none">Scoreboard</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Live Rankings • Updated Every Tick</p>
                        </div>
                    </div>
                </header>

                <div className="overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-32 space-y-6">
                            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading scores...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trader</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Trades</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Portfolio Value</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Gain / Loss</th>
                                    {isAdmin && <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                <AnimatePresence>
                                    {restOfTraders.map((trader, index) => (
                                        <motion.tr 
                                            key={trader.profileId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`${trader.isCurrentUser ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${trader.isDisqualified ? 'opacity-40 grayscale' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default`}
                                        >
                                            <td className="px-10 py-7">
                                                <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm ${
                                                    trader.isCurrentUser ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                    {trader.rank}
                                                </span>
                                            </td>
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                                                        trader.isCurrentUser 
                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-text-strong'
                                                    }`}>
                                                        {trader.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-text-strong tracking-tight">{trader.name}</span>
                                                        {trader.isCurrentUser && <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Self</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <span className="text-sm font-black text-text-strong font-mono">{trader.tradesCount}</span>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <span className="text-base font-black text-text-strong font-mono tracking-tighter">
                                                    {formatCurrency(trader.totalValue)}
                                                </span>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black ${
                                                    trader.plPercentage >= 0 
                                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
                                                    : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
                                                }`}>
                                                    {trader.plPercentage >= 0 ? '+' : ''}{trader.plPercentage.toFixed(2)}%
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-10 py-7 text-center">
                                                    <button 
                                                        onClick={() => apiClient.updateProfileStatus(trader.profileId, !trader.isDisqualified)}
                                                        className={`p-3 rounded-2xl transition-all ${
                                                            trader.isDisqualified 
                                                            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                                            : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
                                                        } hover:scale-110`}
                                                    >
                                                        {trader.isDisqualified ? '✓' : '✗'}
                                                    </button>
                                                </td>
                                            )}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- Terminal Activity Pulse --- */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Recent Trades</h4>
                    </div>
                    <span className="text-[9px] font-black px-3 py-1 bg-white/10 rounded-full uppercase tracking-widest text-slate-400">Live</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {(() => {
                        const allTrades: any[] = [];
                        Object.entries(history || {}).forEach(([userId, userTrades]: [string, any]) => {
                            if (Array.isArray(userTrades)) {
                                userTrades.forEach(t => {
                                    if (t && typeof t === 'object' && !Array.isArray(t)) {
                                        allTrades.push({ ...(t as object), traderId: userId });
                                    }
                                });
                            } else if (userTrades && typeof userTrades === 'object') {
                                Object.values(userTrades).forEach(t => {
                                    if (t && typeof t === 'object' && !Array.isArray(t)) {
                                        allTrades.push({ ...(t as object), traderId: userId });
                                    }
                                });
                            }
                        });
                        
                        const sortedTrades = allTrades.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 6);
                        
                        if (sortedTrades.length === 0) {
                            return <p className="col-span-full text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-[11px]">No trades have been made yet</p>;
                        }

                        return sortedTrades.map((trade, idx) => (
                            <motion.div 
                                key={`${trade.id || idx}-${trade.traderId}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/5 border border-white/5 rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                                         trade.tradeType === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                     }`}>
                                         {trade.tradeType === 'BUY' ? 'B' : 'S'}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-xs font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{trade.traderName || 'Redacted'}</span>
                                         <div className="flex gap-2 items-center text-[10px] text-slate-500 font-bold mt-1">
                                             <span>{trade.quantity}U • {trade.symbol}</span>
                                         </div>
                                     </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 font-mono">
                                    {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
