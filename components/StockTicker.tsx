
import React from 'react';
import { motion } from 'framer-motion';
import type { Stock } from '../types.ts';

interface StockTickerProps {
  stocks: Stock[];
}

const StockTicker: React.FC<StockTickerProps> = React.memo(({ stocks }) => {
  const TickerItem: React.FC<{ stock: Stock }> = ({ stock }) => {
    const priceChange = stock.price - (stock.lastPrice ?? stock.price);
    const isPositive = priceChange >= 0;
    const priceColor = isPositive ? 'text-success' : 'text-error';
    
    return (
      <div className="flex items-center space-x-3 px-8 border-r border-slate-200 dark:border-slate-800">
        <span className="font-black text-xs tracking-tighter text-slate-400 dark:text-slate-500 uppercase">{stock.symbol}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-text-strong tracking-tight">
            {stock.price.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })}
          </span>
          <span className={`text-[10px] font-bold ${priceColor} flex items-center`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ml-0.5 ${isPositive ? '' : 'rotate-180'}`}>
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 w-full overflow-hidden h-14 flex items-center shadow-sm relative z-20">
      <motion.div 
        className="flex whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ 
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear"
          }
        }}
      >
        {/* Triple the items for a smooth and long-lasting loop */}
        {[...stocks, ...stocks, ...stocks].map((stock, idx) => (
          <TickerItem key={`${stock.symbol}-${idx}`} stock={stock} />
        ))}
      </motion.div>
      
      {/* Glossy overlay on the edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-base-100 to-transparent pointer-events-none z-30" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-base-100 to-transparent pointer-events-none z-30" />
    </div>
  );
});

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