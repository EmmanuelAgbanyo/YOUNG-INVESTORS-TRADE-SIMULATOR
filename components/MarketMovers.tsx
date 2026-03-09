


import React, { useMemo } from 'react';
import type { Stock } from '../types.ts';
import Card from './ui/Card.tsx';

interface MarketMoversProps {
  stocks: Stock[];
}

const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const MoverItem: React.FC<{ stock: Stock, change: number }> = ({ stock, change }) => {
  const isGainer = change >= 0;
  const colorClass = isGainer ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const bgClass = isGainer ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
  const iconBase = isGainer
    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;

  return (
    <div className={`flex justify-between items-center p-3 rounded-2xl border ${bgClass} transition-all hover:scale-[1.02] hover:-translate-y-1 duration-300 shadow-sm relative overflow-hidden group`}>
      {/* Dynamic ambient background glow */}
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40 ${isGainer ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

      <div className="flex items-center space-x-3 relative z-10">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
          {iconBase}
        </div>
        <div>
          <div className="font-black text-slate-800 dark:text-white tracking-tight">{stock.symbol}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5 font-mono">GHS {stock.price.toFixed(2)}</div>
        </div>
      </div>
      <div className={`font-black font-mono text-right text-lg ${colorClass} tracking-tight drop-shadow-sm relative z-10`}>
        {isGainer ? '+' : ''}{(change * 100).toFixed(2)}%
      </div>
    </div>
  )
};


const MarketMovers: React.FC<MarketMoversProps> = ({ stocks }) => {
  const { gainers, losers } = useMemo(() => {
    const stocksWithChange = stocks
      .map(stock => ({
        ...stock,
        change: stock.lastPrice ? (stock.price - stock.lastPrice) / stock.lastPrice : 0,
      }))
      .filter(s => s.change !== 0);

    stocksWithChange.sort((a, b) => b.change - a.change);

    const topGainers = stocksWithChange.slice(0, 3);
    const topLosers = stocksWithChange.slice(-3).reverse();

    return { gainers: topGainers, losers: topLosers };
  }, [stocks]);

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-6">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
          <TrendingUpIcon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Market Movers</h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Top Gainers</h4>
          <div className="space-y-3">
            {gainers.length > 0 ? gainers.map(stock => (
              <MoverItem key={stock.symbol} stock={stock} change={stock.change} />
            )) : <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">No market gainers currently.</p>}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3">Top Losers</h4>
          <div className="space-y-3">
            {losers.length > 0 ? losers.map(stock => (
              <MoverItem key={stock.symbol} stock={stock} change={stock.change} />
            )) : <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">No market losers currently.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMovers;