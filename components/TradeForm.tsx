


import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Stock, Portfolio, TradeOrder, MarketStatus } from '../types.ts';
import { TradeType, OrderType } from '../types.ts';
import Button from './ui/Button.tsx';

interface TradeFormProps {
  stocks: Stock[];
  portfolio: Portfolio;
  onPlaceOrder: (order: TradeOrder) => void;
  selectedStock: Stock | null;
  tradeType: TradeType;
  onSymbolChange: (symbol: string) => void;
  marketStatus: MarketStatus;
}

const TradeForm: React.FC<TradeFormProps> = ({ stocks, portfolio, onPlaceOrder, selectedStock, tradeType, onSymbolChange, marketStatus }) => {
  const [currentTradeType, setCurrentTradeType] = useState<TradeType>(TradeType.BUY);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [symbol, setSymbol] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [trailPercent, setTrailPercent] = useState<string>('5');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (selectedStock) {
      setSymbol(selectedStock.symbol);
      setCurrentTradeType(tradeType);
      setQuantity('');
      setErrors({});
    }
  }, [selectedStock, tradeType]);

  const currentStock = useMemo(() => stocks.find(s => s.symbol === symbol), [stocks, symbol]);

  useEffect(() => {
    if (currentStock && orderType !== OrderType.LIMIT) {
      setLimitPrice(currentStock.price.toFixed(2));
    }
  }, [currentStock, orderType]);

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSymbol = e.target.value;
    setSymbol(newSymbol);
    onSymbolChange(newSymbol);
  };

  const numQuantity = parseInt(quantity, 10) || 0;
  const numLimitPrice = parseFloat(limitPrice) || 0;
  const estimatedPrice = orderType === OrderType.LIMIT ? numLimitPrice : (currentStock?.price || 0);
  const totalCost = numQuantity * estimatedPrice;
  const holdings = portfolio?.holdings || {};
  const availableShares = holdings[symbol]?.quantity || 0;

  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    if (numQuantity > 0) {
      if (currentTradeType === TradeType.BUY) {
        if (totalCost > portfolio.cash) {
          newErrors.quantity = 'Not enough cash';
        }
      } else { // SELL
        if (numQuantity > availableShares) {
          newErrors.quantity = 'Not enough shares';
        }
      }
    }

    if (orderType === OrderType.LIMIT && limitPrice !== '' && numLimitPrice <= 0) {
      newErrors.limitPrice = 'Enter a valid price';
    }

    if (orderType === OrderType.TRAILING_STOP) {
      const numTrail = parseFloat(trailPercent);
      if (isNaN(numTrail) || numTrail <= 0 || numTrail >= 100) {
        newErrors.trailPercent = 'Enter a valid %';
      }
    }

    setErrors(newErrors);
  }, [quantity, limitPrice, trailPercent, currentTradeType, orderType, totalCost, portfolio.cash, availableShares, symbol, stocks, portfolio.holdings]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0 || !symbol || numQuantity <= 0 || marketStatus !== 'OPEN') return;
    onPlaceOrder({
      symbol,
      quantity: numQuantity,
      tradeType: currentTradeType,
      orderType,
      limitPrice: orderType === OrderType.LIMIT ? numLimitPrice : undefined,
      trailPercent: orderType === OrderType.TRAILING_STOP ? parseFloat(trailPercent) / 100 : undefined,
    });
    setQuantity('');
  };

  const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
  const orderTypes: OrderType[] = [OrderType.MARKET, OrderType.LIMIT, OrderType.TRAILING_STOP];

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col group/form">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-text-strong tracking-tighter leading-none">Place a Trade</h3>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
           <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${marketStatus === 'OPEN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{marketStatus}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <button 
            type="button" 
            onClick={() => setCurrentTradeType(TradeType.BUY)} 
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              currentTradeType === TradeType.BUY 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/50' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Buy
          </button>
          <button 
            type="button" 
            onClick={() => setCurrentTradeType(TradeType.SELL)} 
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              currentTradeType === TradeType.SELL 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 border border-rose-400/50' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Order Type Selection */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-400 px-1">Order Type</label>
          <div className="grid grid-cols-3 gap-2 px-1">
            {orderTypes.map(ot => {
                if (ot === OrderType.TRAILING_STOP && currentTradeType === TradeType.BUY) return null;
                return (
                  <button 
                    key={ot} 
                    type="button" 
                    onClick={() => setOrderType(ot)} 
                    className={`py-2 text-[10px] rounded-xl font-black uppercase tracking-wider transition-all duration-300 border ${
                      orderType === ot 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {ot.replace('_', ' ')}
                  </button>
                )
            })}
          </div>
        </div>

        {/* Equity Selection */}
        <div>
          <label htmlFor="equity" className="block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-400 px-1">Choose a Stock</label>
          <div className="relative group/select">
            <select 
                id="equity" 
                value={symbol} 
                onChange={handleSymbolChange} 
                className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[1.25rem] px-5 py-4 text-sm font-black text-text-strong transition-all appearance-none outline-none shadow-sm" 
                required
            >
              <option value="" disabled>Select a stock...</option>
              {stocks.map(stock => <option key={stock.symbol} value={stock.symbol}>{stock.symbol} — {stock.name}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Quantity and Price */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label htmlFor="shares" className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">No. of Shares</label>
            <div className="relative">
                <input 
                    id="shares" 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[1.25rem] px-5 py-4 text-2xl font-black font-mono text-text-strong transition-all outline-none placeholder:text-slate-300" 
                    placeholder="000" 
                    min="1" 
                    required 
                />
            </div>
            {errors.quantity && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest px-1 animate-pulse">{errors.quantity}</p>}
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">
                {orderType === OrderType.LIMIT ? 'Limit Price' : orderType === OrderType.TRAILING_STOP ? 'Trail %' : 'Current Price'}
            </label>
            {orderType === OrderType.LIMIT ? (
                <input 
                    type="number" 
                    value={limitPrice} 
                    onChange={(e) => setLimitPrice(e.target.value)} 
                    className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[1.25rem] px-5 py-4 text-2xl font-black font-mono text-text-strong transition-all outline-none" 
                    placeholder="0.00" 
                    step="0.01" 
                    required 
                />
            ) : orderType === OrderType.TRAILING_STOP ? (
                <div className="relative">
                    <input 
                        type="number" 
                        value={trailPercent} 
                        onChange={(e) => setTrailPercent(e.target.value)} 
                        className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[1.25rem] px-5 py-4 text-2xl font-black font-mono text-text-strong transition-all outline-none" 
                        placeholder="5.0" 
                        step="0.1" 
                        required 
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                </div>
            ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] px-5 py-4 text-2xl font-black font-mono text-slate-400">
                    {currentStock ? currentStock.price.toFixed(2) : '---'}
                </div>
            )}
          </div>
        </div>

        {/* Order Intelligence Reveal */}
        <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800/50">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] p-6 mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Cost</span>
              <span className={`text-sm font-black font-mono ${currentTradeType === TradeType.BUY ? 'text-text-strong' : 'text-emerald-500'}`}>
                {currentTradeType === TradeType.BUY ? '-' : '+'}{formatter.format(totalCost)}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalCost / (portfolio.cash || 1)) * 100)}%` }}
                    className={`h-full ${currentTradeType === TradeType.BUY ? (totalCost > portfolio.cash ? 'bg-rose-500' : 'bg-blue-600') : 'bg-emerald-500'}`}
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={Object.keys(errors).length > 0 || !symbol || !quantity || numQuantity <= 0 || marketStatus !== 'OPEN'}
            className={`w-full py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.3em] text-white transition-all duration-500 shadow-2xl relative overflow-hidden group ${
              Object.keys(errors).length > 0 || !symbol || !quantity || numQuantity <= 0 || marketStatus !== 'OPEN'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              : currentTradeType === TradeType.BUY
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <span className="relative z-10">
                {marketStatus === 'OPEN' ? `Place ${currentTradeType} Order` : `Market ${marketStatus}`}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;