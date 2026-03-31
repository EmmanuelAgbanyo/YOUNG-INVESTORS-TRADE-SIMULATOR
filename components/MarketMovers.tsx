
import React, { useMemo } from 'react';
import type { Stock } from '../types.ts';

interface MarketMoversProps {
  stocks: Stock[];
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
  const colorClass = isGainer ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const bgClass = isGainer
    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
    : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
  const barColor = isGainer ? 'bg-emerald-500' : 'bg-rose-500';
  const absChange = Math.abs(changeVal);
  // Scale bar to max 10% change for visual width
  const barWidth = Math.min((absChange / 10) * 100, 100);

  return (
    <div className={`p-3 rounded-2xl border ${bgClass} transition-all hover:scale-[1.02] hover:-translate-y-0.5 duration-300 shadow-sm relative overflow-hidden group`}>
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-30 ${isGainer ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${isGainer ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'}`}>
            {rank}
          </div>
          <div>
            <div className={`font-black text-sm tracking-tight ${isGainer ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
              {stock.symbol}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">GHS {stock.price.toFixed(2)}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 font-black font-mono text-base ${colorClass}`}>
          {isGainer ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {isGainer ? '+' : ''}{changeVal.toFixed(2)}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden relative z-10">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-600/50">
    <svg className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">{label}</p>
  </div>
);

const MarketMovers: React.FC<MarketMoversProps> = ({ stocks }) => {
  const { gainers, losers, lastUpdated } = useMemo(() => {
    // Use the raw `change` field from the Firebase scraper data (daily % change from GSE).
    // Fall back to computing from lastPrice if change is 0 (in case of mock data).
    const withChange = stocks.map(stock => {
      let changeVal = typeof stock.change === 'number' ? stock.change : 0;
      // If the scraper's change is 0 but we have a lastPrice, compute it ourselves
      if (changeVal === 0 && stock.lastPrice && stock.lastPrice !== stock.price) {
        changeVal = ((stock.price - stock.lastPrice) / stock.lastPrice) * 100;
      }
      return { ...stock, changeVal };
    });

    const nonZero = withChange.filter(s => s.changeVal !== 0);
    const sorted = [...nonZero].sort((a, b) => b.changeVal - a.changeVal);

    // If we have no real changes yet (all zeros — market data just loaded),
    // show ALL stocks ranked by raw `change` field including zeros so the
    // widget is never fully empty.
    const sourceArr = nonZero.length > 0 ? sorted : [...withChange].sort((a, b) => b.changeVal - a.changeVal);

    return {
      gainers: sourceArr.filter(s => s.changeVal >= 0).slice(0, 3),
      losers: sourceArr.filter(s => s.changeVal < 0).slice(0, 3).reverse().slice(0, 3),
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  }, [stocks]);

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <TrendingUpIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none">Market Movers</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Updated {lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Top Gainers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-emerald-500">
              <FlameIcon />
            </div>
            <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Top Gainers</h4>
          </div>
          <div className="space-y-2">
            {gainers.length > 0
              ? gainers.map((stock, i) => <MoverItem key={stock.symbol} stock={stock} changeVal={stock.changeVal} rank={i + 1} />)
              : <EmptyState label="No gainers yet today" />}
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Top Losers</h4>
          </div>
          <div className="space-y-2">
            {losers.length > 0
              ? losers.map((stock, i) => <MoverItem key={stock.symbol} stock={stock} changeVal={stock.changeVal} rank={i + 1} />)
              : <EmptyState label="No losers yet today" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMovers;