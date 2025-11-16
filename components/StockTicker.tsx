
import React from 'react';
import type { Stock } from '../types.ts';

interface StockTickerProps {
  stocks: Stock[];
}

const StockTicker: React.FC<StockTickerProps> = ({ stocks }) => {
  const TickerItem: React.FC<{ stock: Stock }> = ({ stock }) => {
    const priceChange = stock.price - (stock.lastPrice ?? stock.price);
    const priceColor = priceChange < 0 ? 'text-error' : 'text-success';
    const PriceIcon = priceChange < 0 ? 
      () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" transform="rotate(180 10 10)" /></svg> :
      () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l4.22-4.22a.75.75 0 111.06 1.06l-5.25 5.25a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 111.06-1.06l4.22 4.22V3.75A.75.75 0 0110 3z" clipRule="evenodd" transform="rotate(180 10 10)" /></svg>;
      
    return (
      <div className="flex items-center space-x-4 px-6">
        <span className="font-bold text-text-strong">{stock.symbol}</span>
        <div className={`flex items-center font-mono ${priceColor}`}>
          <PriceIcon />
          <span>{stock.price.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-base-200 border-b border-t border-base-300/70 w-full overflow-hidden">
      <div className="ticker-wrap h-12 flex items-center">
        <div className="ticker-move">
          {stocks.map(stock => <TickerItem key={`${stock.symbol}-1`} stock={stock} />)}
          {/* Duplicate for seamless scroll */}
          {stocks.map(stock => <TickerItem key={`${stock.symbol}-2`} stock={stock} />)}
        </div>
      </div>
    </div>
  );
};

const styleId = 'stock-ticker-animation';
if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ticker-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .ticker-wrap .ticker-move {
      display: inline-flex;
      animation: ticker-scroll 40s linear infinite;
      white-space: nowrap;
    }
  `;
  document.head.append(style);
}

export default StockTicker;