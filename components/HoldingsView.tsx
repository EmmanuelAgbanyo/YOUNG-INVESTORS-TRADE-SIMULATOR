


import React from 'react';
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

const Sparkline: React.FC<{ history: OHLC[]; color: string; width?: number; height?: number }> = ({ history, color, width = 100, height = 40 }) => {
    const prices = history.map(p => p.close);
    if (prices.length < 2) return <div style={{ width, height }} className="flex items-center justify-center text-xs text-base-content/50">...</div>;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const points = prices.map((price, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((price - minPrice) / priceRange) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};


interface HoldingCardProps {
    holdingData: any;
    onTradeAction: (stock: Stock, type: TradeType) => void;
}

const HoldingCard: React.FC<HoldingCardProps> = ({ holdingData, onTradeAction }) => {
    const { stock, quantity, value, avgCost, totalPnl, totalPnlPercent, todayPnl, todayPnlPercent } = holdingData;
    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

    if (!stock) return null;

    const isTodayPositive = todayPnl >= 0;
    const isTotalPositive = totalPnl >= 0;
    const todayColorClass = isTodayPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    const totalColorClass = isTotalPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

    return (
        <div className={`flex flex-col justify-between p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group ${isTotalPositive ? 'hover:shadow-[0_12px_40px_rgba(16,185,129,0.2)]' : 'hover:shadow-[0_12px_40px_rgba(244,63,94,0.2)]'}`}>
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${isTotalPositive ? 'from-emerald-400 to-transparent' : 'from-rose-400 to-transparent'}`}></div>
            {/* Top section: Symbol, Name, Sparkline */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <div className="font-black text-xl text-slate-800 dark:text-white tracking-tight">{stock.symbol}</div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{stock.name}</div>
                </div>
                <div className="w-24 h-10 opacity-80 mix-blend-multiply dark:mix-blend-screen">
                    <Sparkline history={stock.priceHistory} color={stock.price >= (stock.lastPrice ?? stock.price) ? '#10b981' : '#f43f5e'} />
                </div>
            </div>

            {/* Middle section: Market Value, Today's P&L */}
            <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Market Value</div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight">{formatter.format(value)}</div>
                    <div className="text-xs font-semibold font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-0.5 rounded-md mt-1">{quantity.toLocaleString()} shares @ {formatter.format(avgCost)}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's P&L</div>
                    <div className={`text-lg font-black font-mono tracking-tight ${todayColorClass}`}>{isTodayPositive ? '+' : ''}{formatter.format(todayPnl)}</div>
                    <div className={`text-sm font-bold font-mono ${todayColorClass}`}>({todayPnlPercent.toFixed(2)}%)</div>
                </div>
            </div>

            {/* Bottom section: Total P&L, Actions */}
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 relative z-10">
                <div className="flex justify-between items-center text-sm mb-4">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Total P&L</span>
                    <span className={`font-black font-mono text-base ${totalColorClass}`}>{isTotalPositive ? '+' : ''}{formatter.format(totalPnl)} ({(totalPnlPercent).toFixed(2)}%)</span>
                </div>
                <div className="flex space-x-3">
                    <button
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.03] active:scale-95"
                        onClick={() => onTradeAction(stock, TradeType.BUY)}
                    >
                        Buy More
                    </button>
                    <button
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all duration-300 hover:scale-[1.03] active:scale-95"
                        onClick={() => onTradeAction(stock, TradeType.SELL)}
                    >
                        Sell
                    </button>
                </div>
            </div>
        </div>
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

    return (
        <div id="holdings-view" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {holdingsWithMarketData.map((holdingData) => (
                <HoldingCard
                    key={holdingData.symbol}
                    holdingData={holdingData}
                    onTradeAction={onTradeAction}
                />
            ))}
        </div>
    );
};

export default HoldingsView;