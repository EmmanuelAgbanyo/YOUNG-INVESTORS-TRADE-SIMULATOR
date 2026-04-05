


import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import Card from './ui/Card.tsx';
import type { UnsettledCashItem } from '../types.ts';

interface PortfolioSummaryProps {
  cash: number;
  unsettledCash: number;
  holdingsValue: number;
  totalValue: number;
  totalPnL: number;
}

const CashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);
const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.07a2.25 2.25 0 01-2.25 2.25H5.92a2.25 2.25 0 01-2.25-2.25v-4.07a2.25 2.25 0 01.92-1.784l7.08-4.425a2.25 2.25 0 012.66 0l7.08 4.425a2.25 2.25 0 01.92 1.784z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.393V18a2.25 2.25 0 00-2.25-2.25h-4.5A2.25 2.25 0 009 18v.393m6.338-6.338l-4.5-3.375-4.5 3.375" />
  </svg>
);
const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);
const ChartPieIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);

const CountUp: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = 'GH₵' }) => {
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.01,
  });
  
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [springValue]);

  const formatter = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const safeValue = isNaN(displayValue) ? 0 : displayValue;

  return <span>{prefix}{formatter.format(safeValue)}</span>;
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; subValue?: string; accentGradient?: string; textColorClass?: string }> = ({ icon, label, value, subValue, accentGradient = 'from-blue-500 to-indigo-600', textColorClass = 'text-slate-800 dark:text-white' }) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.02 }}
    className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 shadow-xl rounded-3xl p-5 sm:p-7 transition-all duration-500 group"
  >
    {/* Subtle glow effect */}
    <div className={`absolute -inset-1 bg-gradient-to-r ${accentGradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`} />
    
    {/* Artistic growing orb */}
    <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br ${accentGradient} rounded-full blur-[80px] opacity-[0.08] group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`} />

    <div className="flex flex-col space-y-5 relative z-10">
      <div className="flex items-center justify-between">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${accentGradient} text-white shadow-lg shadow-blue-500/20`}>
          {icon}
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
           <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Live</span>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</div>
        <div className={`text-2xl sm:text-3xl font-black mt-1.5 ${textColorClass} tracking-tight`}>
          <CountUp value={value} />
        </div>

        {subValue && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{subValue}</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ cash, unsettledCash, holdingsValue, totalValue, totalPnL }) => {
  const formatter = new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const pnlColor = totalPnL >= 0 ? 'text-success' : 'text-error';

  return (
    <div id="portfolio-summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <StatCard
          icon={<ChartPieIcon className="w-8 h-8" />}
          label="Net Worth"
          value={totalValue}
          subValue={totalPnL !== 0 ? `Total PnL: GH₵${totalPnL.toFixed(2)}` : undefined}
          accentGradient="from-blue-600 via-indigo-600 to-violet-600"
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <StatCard
          icon={<BriefcaseIcon className="w-8 h-8" />}
          label="Market Value"
          value={holdingsValue}
          accentGradient="from-violet-500 to-fuchsia-600"
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <StatCard
          icon={<CashIcon className="w-8 h-8" />}
          label="Buying Power"
          value={cash}
          accentGradient="from-emerald-500 to-teal-600"
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <StatCard
          icon={<TrendingUpIcon className="w-8 h-8" />}
          label="Pending Settlements"
          value={unsettledCash}
          accentGradient="from-orange-500 to-rose-500"
        />
      </div>
    </div>
  );
};

export default PortfolioSummary;