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
        <div className="w-full flex flex-col gap-8">
            {/* --- Personal Rank Banner --- */}
            {currentUserRank && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-2xl shadow-blue-500/20"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                                <div className="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-black border border-white/30">
                                    #{currentUserRank.rank}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{currentUserRank.name}, You're at the top!</h3>
                                <p className="text-blue-100 text-sm font-medium opacity-90">Keep trading to climb higher in the global standings.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest font-black text-blue-100/70 mb-1">Portfolio Value</p>
                                <p className="text-2xl font-black font-mono">{formatCurrency(currentUserRank.totalValue)}</p>
                            </div>
                            <div className={`flex flex-col items-end px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20`}>
                                <p className="text-[10px] uppercase tracking-widest font-black text-blue-100/70 mb-1">Performance</p>
                                <div className={`flex items-center gap-1.5 text-lg font-black ${currentUserRank.plPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {currentUserRank.plPercentage >= 0 ? '+' : ''}{currentUserRank.plPercentage.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- Top 3 Podium Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topThree.map((trader, idx) => (
                    <motion.div
                        key={trader.profileId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -10 }}
                        className={`relative rounded-[2.5rem] p-8 overflow-hidden border ${
                            idx === 0 
                            ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 border-amber-300/50 text-amber-950 shadow-amber-500/30' 
                            : idx === 1 
                            ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 border-gray-100/50 text-gray-900 shadow-gray-400/30'
                            : 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 border-orange-300/50 text-orange-950 shadow-orange-500/30'
                        } shadow-2xl flex flex-col items-center text-center`}
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center text-2xl">
                            {idx === 0 ? '🏆' : idx === 1 ? '🥈' : '🥉'}
                        </div>

                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl border-4 border-white/30 flex items-center justify-center text-4xl font-black shadow-inner mb-6 relative">
                             {trader.name.charAt(0).toUpperCase()}
                             {/* Floating Rank Badge */}
                             <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg font-black text-gray-900 border-2 border-inherit shadow-lg">
                                {trader.rank}
                             </div>
                        </div>

                        <h4 className="text-2xl font-black tracking-tight mb-1">{trader.name}</h4>
                        <div className="px-4 py-1 rounded-full bg-black/10 text-[10px] font-black uppercase tracking-widest mb-6">
                            Elite Trader
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                <span className="text-[10px] font-bold uppercase opacity-60">Total Trades</span>
                                <span className="font-mono font-black">{trader.tradesCount}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                <span className="text-[10px] font-bold uppercase opacity-60">Portfolio</span>
                                <span className="font-mono font-black">{formatCurrency(trader.totalValue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase opacity-60">P/L %</span>
                                <span className={`font-mono font-black ${trader.plPercentage >= 0 ? 'text-black' : 'text-rose-900'}`}>
                                    {trader.plPercentage >= 0 ? '+' : ''}{trader.plPercentage.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- Main Leaderboard Table --- */}
            <div className="bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="p-8 flex items-center justify-between border-b border-white/10 decoration-wavy">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Active Rankings</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase text-[10px]">Real-time synchronization engine enabled</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-32 gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full"></div>
                                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] text-[11px]">Syncing with exchange data...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-900/40 border-b border-white/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Rank</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Trader Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">Trade Activity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-right">Liquidity Value</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-right">Performance Index</th>
                                    {isAdmin && <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">Governance</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/10 dark:divide-gray-800/20">
                                <AnimatePresence>
                                    {restOfTraders.map((trader, index) => (
                                        <motion.tr 
                                            key={trader.profileId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`${trader.isCurrentUser ? 'bg-blue-600/10 dark:bg-blue-600/10' : ''} ${trader.isDisqualified ? 'opacity-40 grayscale' : ''} hover:bg-white/50 dark:hover:bg-white/5 transition-all group`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm border ${
                                                        trader.isCurrentUser ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent dark:text-gray-400'
                                                    }`}>
                                                        {trader.rank}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shadow-black/5 ${
                                                        trader.isCurrentUser 
                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white translate-z-10' 
                                                        : 'bg-gradient-to-br from-gray-700 to-gray-900 text-gray-100 dark:from-gray-100 dark:to-gray-300 dark:text-gray-900'
                                                    }`}>
                                                        {trader.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-base font-black tracking-tight ${trader.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                            {trader.name}
                                                        </span>
                                                        <div className="flex gap-2 items-center mt-1">
                                                            {trader.isCurrentUser && <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                                                            {trader.isDisqualified && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">DQD</span>}
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Level 1 Investor</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-sm font-black font-mono text-gray-900 dark:text-gray-100">{trader.tradesCount}</span>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Trades</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-base font-black font-mono text-gray-900 dark:text-gray-100 tracking-tighter">
                                                    {formatCurrency(trader.totalValue)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-black shadow-lg shadow-black/5 ${
                                                    trader.plPercentage >= 0 
                                                    ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20' 
                                                    : 'text-rose-600 bg-rose-500/10 dark:text-rose-400 border border-rose-500/20'
                                                }`}>
                                                    <svg className={`w-3 h-3 ${trader.plPercentage < 0 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                    {trader.plPercentage >= 0 ? '+' : ''}{trader.plPercentage.toFixed(2)}%
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-8 py-6 text-center">
                                                    <button 
                                                        onClick={async (e) => {
                                                            const btn = e.currentTarget;
                                                            btn.disabled = true;
                                                            try {
                                                                await apiClient.updateProfileStatus(trader.profileId, !trader.isDisqualified);
                                                            } finally {
                                                                btn.disabled = false;
                                                            }
                                                        }}
                                                        className={`p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 ${
                                                            trader.isDisqualified 
                                                            ? 'text-emerald-600 bg-emerald-500/10' 
                                                            : 'text-rose-600 bg-rose-500/10'
                                                        }`}
                                                    >
                                                        {trader.isDisqualified ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                        )}
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

            {/* --- Live Market Pulse Ticker --- */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <svg className="w-32 h-32 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3h-2v10h2V3zm4 8h-2v4h2v-4zm4-4h-2v10h2V7zm-8 10h-2v4h2v-4zm-4-8H5v12h2V9zm-4 4H1v8h2v-8z"/></svg>
                </div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Live Global Activity Pulse</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                    {(() => {
                        const allTrades: any[] = [];
                        Object.entries(history).forEach(([userId, userTrades]: [string, any]) => {
                            if (Array.isArray(userTrades)) {
                                userTrades.forEach(t => allTrades.push({ ...t, traderId: userId }));
                            } else if (userTrades && typeof userTrades === 'object') {
                                Object.values(userTrades).forEach(t => allTrades.push({ ...t, traderId: userId }));
                            }
                        });
                        
                        const sortedTrades = allTrades.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 6);
                        
                        if (sortedTrades.length === 0) {
                            return <p className="col-span-2 text-center py-8 text-gray-500 text-[11px] font-black uppercase tracking-widest italic font-medium">Scanning for market executions...</p>;
                        }

                        return sortedTrades.map((trade, idx) => (
                            <motion.div 
                                key={`${trade.id || idx}-${trade.traderId}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                         trade.tradeType === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                     }`}>
                                         {trade.tradeType === 'BUY' ? 'B' : 'S'}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-xs font-black group-hover:text-blue-400 transition-colors uppercase tracking-tighter">{trade.traderName || 'Anonymous'}</span>
                                         <div className="flex gap-2 items-center text-[10px] text-gray-400 font-bold">
                                             <span>{trade.quantity} {trade.symbol}</span>
                                             <span>•</span>
                                             <span className="font-mono">{formatCurrency(trade.price || 0)}</span>
                                         </div>
                                     </div>
                                </div>
                                <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md">
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
