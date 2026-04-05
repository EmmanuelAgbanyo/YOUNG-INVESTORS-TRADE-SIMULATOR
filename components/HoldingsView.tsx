


import React from 'react';
import { motion } from 'framer-motion';
import type { Holding, Stock, OHLC } from '../types.ts';
import { TradeType } from '../types.ts';
import Button from './ui/Button.tsx';
import Card from './ui/Card.tsx';
import EmptyState from './ui/EmptyState.tsx';

const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.07a2.25 2.25 0 01-2.25 2.25H5.92a2.25 2.25 0 01-2.25-2.25v-4.07a2.25 2.25 0 01.92-1.784l7.08-4.425a2.25 2.25 0 012.66 0l7.08 4.425a2.25 2.25 0 01.92 1.784z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.393V18a2.25 2.25 0 00-2.25-2.25h-4.5A2.25 2.25 0 009 18v.393m6.338-6.338l-4.5-3.375-4.5 3.375" />
    </svg>
);

const Sparkline: React.FC<{ history: OHLC[]; color: string; width?: number; height?: number }> = ({ history, color, width = 120, height = 48 }) => {
    const prices = history.map(p => p.close);
    if (prices.length < 2) return <div style={{ width, height }} className="flex items-center justify-center text-[10px] text-slate-400">...</div>;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const points = prices.map((price, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((price - minPrice) / priceRange) * height - 2; // Offset for stroke
        return `${x},${y}`;
    }).join(' ');

    const fillPoints = `${points} ${width},${height} 0,${height}`;

    const gradientId = `gradient-${color.replace('#', '')}`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                fill={`url(#${gradientId})`}
                points={fillPoints}
            />
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};


interface HoldingCardProps {
    holdingData: any;
    totalPortfolioValue: number;
    onTradeAction: (stock: Stock, type: TradeType) => void;
}

const HoldingCard: React.FC<HoldingCardProps> = ({ holdingData, totalPortfolioValue, onTradeAction }) => {
    const { stock, quantity, value, avgCost, totalPnl, totalPnlPercent, todayPnl, todayPnlPercent } = holdingData;
    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 });
    
    if (!stock) return null;

    const portfolioShare = (value / totalPortfolioValue) * 100;
    const isTodayPositive = todayPnl >= 0;
    const isTotalPositive = totalPnl >= 0;
    const todayColor = isTodayPositive ? 'text-emerald-500' : 'text-rose-500';
    const totalColor = isTotalPositive ? 'text-emerald-500' : 'text-rose-500';
    const chartColor = isTodayPositive ? '#10b981' : '#f43f5e';

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/40 dark:border-slate-800/40 p-5 rounded-[2rem] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
        >
            {/* Glossy top-left highlight */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/20 dark:bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Identity and Momentum */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-black text-xl text-text-strong shadow-inner">
                        {stock.symbol[0]}
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-text-strong tracking-tighter leading-none">{stock.symbol}</h3>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">{stock.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <Sparkline history={stock.priceHistory} color={chartColor} />
                </div>
            </div>

            {/* Main Stats: Market Value and Shares */}
            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-white/40 dark:bg-slate-800/30 p-4 rounded-2xl border border-white/20 dark:border-slate-700/20">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Market Value</p>
                    <div className="text-xl font-black text-text-strong tracking-tighter">{formatter.format(value)}</div>
                    <div className="mt-2 flex items-center text-[10px] space-x-1.5 font-bold text-slate-400 dark:text-slate-500 uppercase">
                        <span>{quantity.toLocaleString()} Shares</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>@{formatter.format(avgCost)}</span>
                    </div>
                </div>
                <div className="bg-white/40 dark:bg-slate-800/30 p-4 rounded-2xl border border-white/20 dark:border-slate-700/20">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Profit / Loss</p>
                    <div className={`text-xl font-black tracking-tighter ${totalColor}`}>
                        {isTotalPositive ? '+' : ''}{totalPnlPercent.toFixed(2)}%
                    </div>
                    <div className="mt-2 flex items-center">
                        <div className="flex-grow h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${portfolioShare}%` }}
                                className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full`}
                            />
                        </div>
                        <span className="ml-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">{portfolioShare.toFixed(1)}% Share</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Today's performance and Quick Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/40 dark:border-slate-800/40 relative z-10">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${isTodayPositive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${todayColor} ${isTodayPositive ? '' : 'rotate-180'}`}>
                            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Change</p>
                        <p className={`text-xs font-black ${todayColor}`}>{isTodayPositive ? '+' : ''}{formatter.format(todayPnl)} ({todayPnlPercent.toFixed(2)}%)</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => onTradeAction(stock, TradeType.SELL)}
                        className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                    >
                        Sell
                    </button>
                    <button
                        onClick={() => onTradeAction(stock, TradeType.BUY)}
                        className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                        Buy More
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

interface HoldingsViewProps {
    holdings: Holding[];
    stocks: Stock[];
    onTradeAction: (stock: Stock, type: TradeType) => void;
}

const HoldingsView: React.FC<HoldingsViewProps> = ({ holdings, stocks, onTradeAction }) => {
    if (holdings.length === 0) {
        return (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-8">
                <EmptyState
                    icon={<BriefcaseIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />}
                    title="Your portfolio is empty"
                    message="Start by purchasing stocks in the 'Trade' tab to build your portfolio."
                />
            </div>
        );
    }

    const holdingsWithMarketData = holdings.map(holding => {
        const stock = stocks.find(s => s.symbol === holding.symbol);
        const price = stock?.price || 0;
        const lastPrice = stock?.lastPrice || price;

        const value = holding.quantity * price;
        const costBasis = holding.avgCost * holding.quantity;

        const totalPnl = value - costBasis;
        const totalPnlPercent = costBasis > 0 ? (totalPnl / costBasis) * 100 : 0;

        const todayPnl = (price - lastPrice) * holding.quantity;
        const lastValue = lastPrice * holding.quantity;
        const todayPnlPercent = lastValue > 0 ? (todayPnl / lastValue) * 100 : 0;

        return { ...holding, stock, price, value, totalPnl, totalPnlPercent, todayPnl, todayPnlPercent };
    }).sort((a, b) => b.value - a.value);

    const totalPortfolioValue = holdingsWithMarketData.reduce((sum, h) => sum + h.value, 0);

    return (
        <div id="holdings-view" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
            {holdingsWithMarketData.map((holdingData) => (
                <HoldingCard
                    key={holdingData.symbol}
                    holdingData={holdingData}
                    totalPortfolioValue={totalPortfolioValue}
                    onTradeAction={onTradeAction}
                />
            ))}
        </div>
    );
};

export default HoldingsView;