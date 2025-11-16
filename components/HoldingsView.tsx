


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
    if (prices.length < 2) return <div style={{width, height}} className="flex items-center justify-center text-xs text-base-content/50">...</div>;
  
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

    return (
        <Card className="flex flex-col justify-between !p-4 transition-all duration-300">
            {/* Top section: Symbol, Name, Sparkline */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="font-bold text-lg text-text-strong">{stock.symbol}</div>
                    <div className="text-sm opacity-70 truncate max-w-[150px]">{stock.name}</div>
                </div>
                <div className="w-24 h-10">
                    <Sparkline history={stock.priceHistory} color={stock.price >= (stock.lastPrice ?? stock.price) ? 'rgb(var(--success))' : 'rgb(var(--error))'} />
                </div>
            </div>

            {/* Middle section: Market Value, Today's P&L */}
             <div className="flex justify-between items-end mb-3">
                <div>
                    <div className="text-xs text-base-content/70">Market Value</div>
                    <div className="text-xl font-bold text-text-strong font-mono">{formatter.format(value)}</div>
                    <div className="text-xs font-mono text-base-content">{quantity.toLocaleString()} shares @ {formatter.format(avgCost)}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-base-content/70">Today's P&L</div>
                    <div className={`text-base font-semibold font-mono ${todayPnl >= 0 ? 'text-success' : 'text-error'}`}>{todayPnl >= 0 ? '+' : ''}{formatter.format(todayPnl)}</div>
                    <div className={`text-xs font-mono ${todayPnl >= 0 ? 'text-success/80' : 'text-error/80'}`}>({todayPnlPercent.toFixed(2)}%)</div>
                </div>
            </div>

            {/* Bottom section: Total P&L, Actions */}
             <div className="border-t border-base-300 pt-3">
                <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-base-content/70">Total P&L</span>
                    <span className={`font-semibold font-mono ${totalPnl >= 0 ? 'text-success' : 'text-error'}`}>{totalPnl >= 0 ? '+' : ''}{formatter.format(totalPnl)} ({(totalPnlPercent).toFixed(2)}%)</span>
                </div>
                <div className="flex space-x-2">
                    <Button size="sm" variant="success" className="flex-1" onClick={() => onTradeAction(stock, TradeType.BUY)}>Buy More</Button>
                    <Button size="sm" variant="error" className="flex-1" onClick={() => onTradeAction(stock, TradeType.SELL)}>Sell</Button>
                </div>
            </div>
        </Card>
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
        <Card>
            <EmptyState 
                icon={<BriefcaseIcon className="w-12 h-12" />}
                title="Your portfolio is empty"
                message="Start by purchasing stocks in the 'Trade' tab to build your portfolio."
            />
      </Card>
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
  }).sort((a,b) => b.value - a.value);

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