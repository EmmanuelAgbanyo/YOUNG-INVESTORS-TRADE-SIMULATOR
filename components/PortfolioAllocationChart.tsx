



import React from 'react';
import type { Holding, Stock } from '../types.ts';
import Card from './ui/Card.tsx';
import EmptyState from './ui/EmptyState.tsx';

interface PortfolioAllocationChartProps {
  holdings: { [symbol:string]: Holding };
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
    const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
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
        <Card>
            <EmptyState 
                icon={<ChartPieIcon className="w-12 h-12" />}
                title="No holdings to display"
                message="Your portfolio allocation will appear here once you own stocks."
            />
        </Card>
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
    <Card>
        <h3 className="text-xl font-bold text-text-strong mb-4">Portfolio Allocation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative w-full h-64 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {chartData.map((slice, index) => (
                        <path
                            key={slice.symbol}
                            d={createDonutSlicePath(50, 50, 30, 48, slice.startAngle, slice.endAngle)}
                            fill={COLORS[index % COLORS.length]}
                        >
                            <title>{`${slice.symbol}: ${slice.percentage.toFixed(2)}%`}</title>
                        </path>
                     ))}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-sm text-base-content">Holdings Value</span>
                    <span className="text-2xl font-bold text-text-strong font-mono">{formatter.format(totalHoldingsValue)}</span>
                </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {chartData.map((item, index) => (
                    <div key={item.symbol} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-base-300/50">
                        <div className="flex items-center truncate">
                            <span className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <div className="truncate">
                                <span className="font-bold text-text-strong">{item.symbol}</span>
                                <span className="text-base-content ml-2 hidden sm:inline truncate">{item.name}</span>
                            </div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                           <div className="font-mono text-text-strong">{item.percentage.toFixed(2)}%</div>
                           <div className="font-mono text-xs text-base-content">{formatter.format(item.value)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </Card>
  );
};

export default PortfolioAllocationChart;