


import React from 'react';
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

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue?: string; accentGradient?: string; textColorClass?: string }> = ({ icon, label, value, subValue, accentGradient = 'from-blue-500 to-indigo-600', textColorClass = 'text-slate-800 dark:text-white' }) => (
  <div className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-500 group hover:-translate-y-1 sm:hover:-translate-y-2">
    {/* Subtle top glow line */}
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>
    {/* Cinematic growing orb behind */}
    <div className={`absolute -top-10 -right-10 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br ${accentGradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`}></div>

    <div className="flex flex-col space-y-3 sm:space-y-4 relative z-10">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${accentGradient} text-white shadow-lg shadow-black/10`}>
          {icon}
        </div>
      </div>

      <div>
        <div className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</div>
        <div className={`text-lg sm:text-2xl lg:text-3xl font-black mt-0.5 sm:mt-1 ${textColorClass} drop-shadow-sm leading-tight`}>{value}</div>

        {subValue && (
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-sm font-bold bg-white/50 dark:bg-slate-800/50 inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/20 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
            {subValue}
          </div>
        )}
      </div>
    </div>
  </div>
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
    <div id="portfolio-summary" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <StatCard
          icon={<ChartPieIcon className="w-7 h-7" />}
          label="Total Portfolio Value"
          value={formatter.format(totalValue)}
          subValue={totalPnL !== 0 ? `Total PnL: ${formatter.format(totalPnL)}` : undefined}
          accentGradient="from-blue-500 to-indigo-600"
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <StatCard
          icon={<BriefcaseIcon className="w-7 h-7" />}
          label="Holdings Value"
          value={formatter.format(holdingsValue)}
          accentGradient="from-indigo-400 to-purple-600"
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <StatCard
          icon={<CashIcon className="w-7 h-7" />}
          label="Available Cash"
          value={formatter.format(cash)}
          accentGradient="from-emerald-400 to-emerald-600"
        />
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <StatCard
          icon={<TrendingUpIcon className="w-7 h-7" />}
          label="Unsettled Funds"
          value={formatter.format(unsettledCash)}
          accentGradient="from-amber-400 to-orange-500"
        />
      </div>
    </div>
  );
};

export default PortfolioSummary;