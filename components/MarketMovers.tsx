
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Stock, MarketStatus } from '../types.ts';

interface MarketMoversProps {
  stocks: Stock[];
  marketStatus: MarketStatus;
}

const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const FlameIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-1 .23-1.94.68-2.74 1.31-2.74 2.15-3.54 6.11-1.84 9.19-.06-.06-.13-.13-.19-.2-.44-.55-.64-1.27-.59-1.98C8.31 11.94 8 12.96 8 14c0 2.64 1.84 5 5 5 1.77 0 2.55-.75 3.18-1.53.56-.7.76-1.52.59-2.31C16.66 14.07 18.3 12.65 17.66 11.2z"/>
  </svg>
);

const MoverItem: React.FC<{ stock: Stock; changeVal: number; rank: number }> = ({ stock, changeVal, rank }) => {
  const isGainer = changeVal >= 0;
  const colorClass = isGainer ? 'text-emerald-500' : 'text-rose-500';
  const bgColorClass = isGainer ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const barColor = isGainer ? 'bg-emerald-500' : 'bg-rose-500';
  const absChange = Math.abs(changeVal);
  const barWidth = Math.min((absChange / 10) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className="p-4 bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/20 dark:border-slate-700/30 rounded-2xl transition-all duration-500 group relative overflow-hidden"
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl ${bgColorClass} flex items-center justify-center font-black text-sm ${colorClass} shadow-inner border border-white/20 dark:border-white/5`}>
            {stock.symbol[0]}
          </div>
          <div>
            <div className="font-black text-base text-text-strong tracking-tighter uppercase leading-none">{stock.symbol}</div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
               GHS {stock.price.toFixed(2)}
               <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
               Vol {rank * 12}K
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-black tracking-tighter ${colorClass} mb-2`}>
            {isGainer ? '+' : ''}{changeVal.toFixed(2)}%
          </div>
          <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
             <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                className={`h-full ${barColor} shadow-[0_0_8px_rgba(var(--primary),0.5)]`}
             />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700/50">
    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-4">
        <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    </div>
    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{label}</p>
  </div>
);

const MarketMovers: React.FC<MarketMoversProps> = React.memo(({ stocks, marketStatus }) => {
  const { gainers, losers, lastUpdated } = useMemo(() => {
    const withChange = stocks.map(stock => {
      let changeVal = typeof stock.change === 'number' ? stock.change : 0;
      if (changeVal === 0 && stock.lastPrice && stock.lastPrice !== stock.price) {
        changeVal = ((stock.price - stock.lastPrice) / stock.lastPrice) * 100;
      }
      return { ...stock, changeVal };
    });

    const nonZero = withChange.filter(s => s.changeVal !== 0);
    const sorted = [...nonZero].sort((a, b) => b.changeVal - a.changeVal);
    const sourceArr = nonZero.length > 0 ? sorted : [...withChange].sort((a, b) => b.changeVal - a.changeVal);

    return {
      gainers: sourceArr.filter(s => s.changeVal >= 0).slice(0, 3),
      losers: sourceArr.filter(s => s.changeVal < 0).slice(0, 3).reverse().slice(0, 3),
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  }, [stocks]);

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] shadow-2xl p-8 flex flex-col h-full group/movers">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center space-x-5">
          <div className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <TrendingUpIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-text-strong tracking-tighter leading-none">Price Movers</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">{lastUpdated} • Status: <span className="text-emerald-500">Live</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-10 flex-grow">
        {/* Top Gainers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Top Gainers</h4>
            </div>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Today's Change</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {gainers.length > 0
              ? gainers.map((stock, i) => <MoverItem key={stock.symbol} stock={stock} changeVal={stock.changeVal} rank={i + 1} />)
              : <EmptyState label="No gainers yet today" />}
          </div>
        </div>

        {/* Top Losers */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/30">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em]">Top Losers</h4>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {losers.length > 0
              ? losers.map((stock, i) => <MoverItem key={stock.symbol} stock={stock} changeVal={stock.changeVal} rank={i + 1} />)
              : <EmptyState label="No losers yet today" />}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MarketMovers;