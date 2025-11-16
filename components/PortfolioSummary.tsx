


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

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue?: string }> = ({ icon, label, value, subValue }) => (
    <Card>
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-base-300 rounded-lg">{icon}</div>
                <div>
                    <div className="text-sm text-base-content/70">{label}</div>
                    <div className="text-2xl font-bold text-text-strong">{value}</div>
                </div>
            </div>
            {subValue && <div className="text-xs text-info font-semibold pt-1">{subValue}</div>}
        </div>
    </Card>
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
    <div id="portfolio-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <StatCard 
          icon={<ChartPieIcon className="w-6 h-6 text-primary" />}
          label="Total Portfolio Value"
          value={formatter.format(totalValue)}
          subValue={formatter.format(totalPnL)}
        />
       </div>
       <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <StatCard 
          icon={<BriefcaseIcon className="w-6 h-6 text-secondary" />}
          label="Holdings Value"
          value={formatter.format(holdingsValue)}
        />
       </div>
       <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <StatCard 
          icon={<CashIcon className="w-6 h-6 text-success" />}
          label="Available Cash"
          value={formatter.format(cash)}
        />
       </div>
       <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <StatCard 
          icon={<TrendingUpIcon className="w-6 h-6 text-info" />}
          label="Unsettled Cash"
          value={formatter.format(unsettledCash)}
        />
       </div>
    </div>
  );
};

export default PortfolioSummary;