


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

const MoverItem: React.FC<{stock: Stock, change: number}> = ({ stock, change }) => {
    const isGainer = change >= 0;
    const colorClass = isGainer ? 'text-success' : 'text-error';
    const bgClass = isGainer ? 'bg-success/10' : 'bg-error/10';

    return (
        <div className={`flex justify-between items-center p-2 rounded-lg ${bgClass}`}>
            <div>
                <div className="font-bold text-text-strong">{stock.symbol}</div>
                <div className="text-xs text-base-content/80 font-mono">GHS {stock.price.toFixed(2)}</div>
            </div>
            <div className={`font-semibold font-mono text-right ${colorClass}`}>
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
    <Card>
      <div className="flex items-center space-x-3 mb-4">
        <TrendingUpIcon className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold text-text-strong">Market Movers</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
            <h4 className="font-semibold text-success mb-2">Top Gainers</h4>
            <div className="space-y-2">
                {gainers.length > 0 ? gainers.map(stock => (
                    <MoverItem key={stock.symbol} stock={stock} change={stock.change} />
                )) : <p className="text-sm text-base-content/60 text-center p-2">No market gainers.</p>}
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-error mb-2">Top Losers</h4>
            <div className="space-y-2">
                {losers.length > 0 ? losers.map(stock => (
                    <MoverItem key={stock.symbol} stock={stock} change={stock.change} />
                )) : <p className="text-sm text-base-content/60 text-center p-2">No market losers.</p>}
            </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketMovers;