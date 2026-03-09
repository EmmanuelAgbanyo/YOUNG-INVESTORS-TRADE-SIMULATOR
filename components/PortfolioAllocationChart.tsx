



import React from 'react';
import type { Holding, Stock } from '../types.ts';
import Card from './ui/Card.tsx';
import EmptyState from './ui/EmptyState.tsx';

interface PortfolioAllocationChartProps {
  holdings: { [symbol: string]: Holding };
  stocks: Stock[];
}

const COLORS = [
  '#3b82f6', // primary (blue)
  '#8b5cf6', // secondary (violet)
  '#10b981', // accent (emerald)
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#f97316', // orange
  '#ec4899', // pink
  '#a855f7', // purple
];

const ChartPieIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);


const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

const createDonutSlicePath = (cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string => {
  if (endAngle - startAngle >= 359.999) {
    endAngle = startAngle + 359.999;
  }

  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");

  return d;
}

const PortfolioAllocationChart: React.FC<PortfolioAllocationChartProps> = ({ holdings, stocks }) => {
  const holdingList = Object.values(holdings);

  // FIX: Explicitly type the 'holding' parameter to resolve 'unknown' type error.
  const portfolioData = holdingList.map((holding: Holding) => {
    const stock = stocks.find(s => s.symbol === holding.symbol);
    if (!stock) return null;
    return {
      symbol: holding.symbol,
      name: stock.name,
      value: holding.quantity * stock.price,
    };
  }).filter((item): item is { symbol: string; name: string; value: number } => item !== null)
    .sort((a, b) => b.value - a.value);

  const totalHoldingsValue = portfolioData.reduce((acc, curr) => acc + curr.value, 0);

  if (portfolioData.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 rounded-3xl h-full min-h-[400px] flex items-center justify-center transition-all duration-300">
        <EmptyState
          icon={<ChartPieIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />}
          title="No holdings to display"
          message="Your portfolio allocation will appear here once you own stocks."
        />
      </div>
    );
  }

  let cumulativeAngle = 0;
  const chartData = portfolioData.map(item => {
    const percentage = totalHoldingsValue > 0 ? (item.value / totalHoldingsValue) * 100 : 0;
    const angle = totalHoldingsValue > 0 ? (item.value / totalHoldingsValue) * 360 : 0;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const endAngle = cumulativeAngle;
    return { ...item, percentage, angle, startAngle, endAngle };
  });

  const formatter = new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  });


  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 sm:p-8 rounded-3xl h-full flex flex-col transition-all duration-300">
      <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-8">Portfolio Allocation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-grow">
        <div className="relative w-full aspect-square max-h-72 flex flex-col items-center justify-center mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl overflow-visible">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {chartData.map((slice, index) => (
              <path
                key={slice.symbol}
                d={createDonutSlicePath(50, 50, 36, 48, slice.startAngle, slice.endAngle)}
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-500 hover:opacity-80 stroke-white/20 dark:stroke-slate-900/50 stroke-[0.5]"
                filter="url(#glow)"
              >
                <title>{`${slice.symbol}: ${slice.percentage.toFixed(2)}%`}</title>
              </path>
            ))}
          </svg>
          {/* Floating Centered Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Value</span>
            <span className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter drop-shadow-sm">{formatter.format(totalHoldingsValue)}</span>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-3">
          {chartData.map((item, index) => (
            <div key={item.symbol} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 border border-transparent hover:border-white/50 dark:hover:border-slate-600 shadow-sm hover:shadow-md cursor-pointer group hover:-translate-y-0.5">
              <div className="flex items-center min-w-0 flex-1 mr-4">
                <div className="w-4 h-4 rounded-full mr-3 shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.2)] border border-white/30 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <div className="truncate">
                  <div className="font-bold text-slate-800 dark:text-white tracking-wide">{item.symbol}</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black font-mono text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-right text-sm">{item.percentage.toFixed(2)}%</div>
                <div className="font-semibold font-mono text-xs text-slate-500 dark:text-slate-400">{formatter.format(item.value)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAllocationChart;