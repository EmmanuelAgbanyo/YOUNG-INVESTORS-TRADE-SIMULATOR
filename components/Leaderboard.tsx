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

    // 1. Subscribe to all data nodes on mount
    useEffect(() => {
        setIsLoading(true);
        const unsubProfiles = apiClient.subscribeProfiles((data) => { setProfiles(data); setIsLoading(false); });
        const unsubPortfolios = apiClient.subscribePortfolios(setPortfolios);
        const unsubHoldings = apiClient.subscribeHoldings(setHoldings);
        const unsubHistory = apiClient.subscribeHistory(setHistory);

        return () => {
            unsubProfiles();
            unsubPortfolios();
            unsubHoldings();
            unsubHistory();
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
                
                let marketValue = 0;
                Object.entries(userHoldings).forEach(([symbol, holding]: [string, any]) => {
                    const currentStock = stocks.find(s => s.symbol === symbol);
                    marketValue += currentStock ? currentStock.price * holding.quantity : (holding.avg_cost || 0) * holding.quantity;
                });

                const totalValue = (portfolio.cash || 0) + marketValue;
                const plPercentage = ((totalValue - STARTING_CAPITAL) / STARTING_CAPITAL) * 100;
                const tradesCount = Array.isArray(userHistory) ? userHistory.length : 0;

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

        setTraderStats(stats);
    }, [profiles, portfolios, holdings, history, stocks, currentUserProfile, isAdmin]);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val);

    return (
        <div className="w-full bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Global Leaderboard</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Competitive performance tracking</p>
                    </div>
                </div>
                <div className="hidden sm:block text-right">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-600/10 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Live Active Sync
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Calculating rankings...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-gray-900 dark:text-white font-bold">Failed to load leaderboard</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{error}</p>
                        <button 
                            onClick={() => fetchLeaderboardData()}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Rank</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Trader</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Trades</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Portfolio Value</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Performance</th>
                                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/10 dark:divide-gray-800/50">
                            <AnimatePresence initial={false}>
                                {traderStats.length > 0 ? (
                                    traderStats.map((trader, index) => (
                                        <motion.tr 
                                            key={trader.profileId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`${trader.isCurrentUser ? 'bg-blue-600/5' : ''} ${trader.isDisqualified ? 'opacity-50 grayscale-[0.5]' : ''} hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black ${
                                                        trader.isDisqualified ? 'bg-gray-200 text-gray-400' :
                                                        index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.4)]' :
                                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                                        index === 2 ? 'bg-orange-400 text-orange-950' :
                                                        'text-gray-400 dark:text-gray-500'
                                                    }`}>
                                                        {trader.isDisqualified ? 'DQ' : (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                                                        trader.isDisqualified ? 'bg-gray-400' :
                                                        trader.isCurrentUser ? 'bg-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'
                                                    }`}>
                                                        {trader.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold ${trader.isDisqualified ? 'text-gray-400 line-through' : trader.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                                            {trader.name}
                                                            {trader.isCurrentUser && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">You</span>}
                                                            {trader.isDisqualified && <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Disqualified</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm font-bold text-gray-600 dark:text-gray-400">
                                                    {trader.tradesCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-gray-200">
                                                {formatCurrency(trader.totalValue)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-sm ${
                                                    trader.isDisqualified ? 'text-gray-400 bg-gray-100' :
                                                    trader.plPercentage >= 0 
                                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-600/10' 
                                                    : 'text-rose-600 dark:text-rose-400 bg-rose-600/10'
                                                }`}>
                                                    <svg className={`w-3 h-3 ${trader.plPercentage < 0 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                    {trader.plPercentage.toFixed(2)}%
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => apiClient.updateProfileStatus(trader.profileId, !trader.isDisqualified)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            trader.isDisqualified 
                                                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                                                            : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                                        }`}
                                                        title={trader.isDisqualified ? "Re-activate Trader" : "Disqualify Trader"}
                                                    >
                                                        {trader.isDisqualified ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </td>
                                            )}
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No traders synced to the cloud yet.</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[300px] mx-auto">Toggle between tabs or perform a trade to trigger synchronization.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>

            {/* Live Global Activity Ticker */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Live Global Activity</h4>
                    </div>
                </div>
                
                <div className="relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-2 border border-gray-100 dark:border-gray-800/50">
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto no-scrollbar scroll-smooth">
                        {(() => {
                            const allTrades: any[] = [];
                            Object.entries(history).forEach(([userId, userTrades]: [string, any]) => {
                                if (Array.isArray(userTrades)) {
                                    userTrades.forEach(t => allTrades.push({ ...t, traderId: userId }));
                                }
                            });
                            
                            const sortedTrades = allTrades.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 10);
                            
                            if (sortedTrades.length === 0) {
                                return (
                                    <div className="py-8 text-center">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 italic font-medium">Waiting for market activity...</p>
                                    </div>
                                );
                            }

                            return sortedTrades.map((trade, idx) => (
                                <div 
                                    key={`${trade.id || idx}-${trade.traderId}`} 
                                    className="flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-white dark:hover:bg-gray-800/50 shadow-sm transition-all border border-transparent hover:border-blue-500/20 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                            {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-900 dark:text-gray-200 group-hover:text-blue-500 transition-colors">
                                                {trade.traderName || 'Anonymous Trader'}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                                    trade.tradeType === 'BUY' 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                }`}>
                                                    {trade.tradeType}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                                                    {trade.quantity.toLocaleString()} {trade.symbol}
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    @ {formatCurrency(trade.price || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                            {trade.finalStatus || 'SUCCESS'}
                                        </span>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
