


import React, { useState, useEffect, useMemo } from 'react';
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
  const availableShares = portfolio.holdings[symbol]?.quantity || 0;

  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    if (numQuantity > 0) {
      if (currentTradeType === TradeType.BUY) {
        if (totalCost > portfolio.cash) {
          newErrors.quantity = 'Total cost exceeds available cash.';
        }
      } else { // SELL
        if (numQuantity > availableShares) {
          newErrors.quantity = 'Quantity exceeds available shares.';
        }
      }
    }

    if (orderType === OrderType.LIMIT && limitPrice !== '' && numLimitPrice <= 0) {
      newErrors.limitPrice = 'Limit price must be positive.';
    }

    if (orderType === OrderType.TRAILING_STOP) {
      const numTrail = parseFloat(trailPercent);
      if (isNaN(numTrail) || numTrail <= 0 || numTrail >= 100) {
        newErrors.trailPercent = 'Trail % must be between 0 and 100.';
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

  const getButtonText = () => {
    if (marketStatus === 'CLOSED') return 'Market Closed';
    if (marketStatus === 'HALTED') return 'Market Halted';
    if (marketStatus === 'PRE_MARKET') return 'Pre-Market';
    return `Place ${currentTradeType} Order`;
  }

  const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
  const orderTypes: OrderType[] = [OrderType.MARKET, OrderType.LIMIT, OrderType.TRAILING_STOP];

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 rounded-3xl h-full flex flex-col">
      <h3 className="text-2xl font-black mb-6 text-slate-800 dark:text-white tracking-tight">Trade Submission</h3>
      <form onSubmit={handleSubmit} className="space-y-5 flex-grow flex flex-col">
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50">
          <button type="button" onClick={() => setCurrentTradeType(TradeType.BUY)} className={`py-2 px-4 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-300 ${currentTradeType === TradeType.BUY ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Buy</button>
          <button type="button" onClick={() => setCurrentTradeType(TradeType.SELL)} className={`py-2 px-4 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-300 ${currentTradeType === TradeType.SELL ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Sell</button>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Order Type</label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50">
            {orderTypes.map(ot => {
              if (ot === OrderType.TRAILING_STOP && currentTradeType === TradeType.BUY) return null;
              return (<button key={ot} type="button" onClick={() => setOrderType(ot)} className={`py-2 px-1 text-[11px] rounded-lg font-black uppercase tracking-wider transition-all duration-300 ${orderType === ot ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>{ot.replace('_', ' ')}</button>)
            })}
          </div>
        </div>

        <div>
          <label htmlFor="equity" className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Equity</label>
          <select id="equity" value={symbol} onChange={handleSymbolChange} className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white transition-all shadow-inner" required>
            <option value="" disabled>Select a stock</option>
            {stocks.map(stock => <option key={stock.symbol} value={stock.symbol}>{stock.name} ({stock.symbol})</option>)}
          </select>
        </div>

        {currentTradeType === TradeType.SELL && symbol && <div className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">You own <span className="text-blue-600 dark:text-blue-400 font-black">{availableShares.toLocaleString()}</span> shares.</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shares" className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Shares</label>
            <input id="shares" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-lg font-black font-mono text-slate-800 dark:text-white transition-all shadow-inner" placeholder="0" min="1" required />
            {errors.quantity && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.quantity}</p>}
          </div>

          {orderType === OrderType.LIMIT ? (
            <div>
              <label htmlFor="limitPrice" className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Limit Price</label>
              <input id="limitPrice" type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-lg font-black font-mono text-slate-800 dark:text-white transition-all shadow-inner" placeholder="0.00" step="0.01" min="0.01" required />
              {errors.limitPrice && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.limitPrice}</p>}
            </div>
          ) : orderType === OrderType.TRAILING_STOP ? (
            <div>
              <label htmlFor="trailPercent" className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Trail %</label>
              <input id="trailPercent" type="number" value={trailPercent} onChange={(e) => setTrailPercent(e.target.value)} className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-lg font-black font-mono text-slate-800 dark:text-white transition-all shadow-inner" placeholder="5" step="0.1" required />
              {errors.trailPercent && <p className="text-rose-500 text-xs font-bold mt-1.5">{errors.trailPercent}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Market Price</label>
              <input type="text" value={formatter.format(currentStock?.price || 0)} className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-3 text-lg font-black font-mono text-slate-500 dark:text-slate-400 transition-all shadow-inner cursor-not-allowed" readOnly />
            </div>
          )}
        </div>

        <div className="pt-auto mt-auto flex-grow flex flex-col justify-end">
          <div className="flex justify-between items-center bg-slate-100/80 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mb-4 shadow-inner">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Est. {currentTradeType === TradeType.BUY ? 'Cost' : 'Proceeds'}:</span>
            <span className={`text-2xl font-black font-mono tracking-tight ${currentTradeType === TradeType.BUY ? 'text-slate-800 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatter.format(totalCost)}</span>
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest text-white transition-all duration-300 active:scale-[0.98] ${Object.keys(errors).length > 0 || !symbol || !quantity || numQuantity <= 0 || marketStatus !== 'OPEN'
                ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-50'
                : currentTradeType === TradeType.BUY
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/30 hover:shadow-rose-500/40'
              }`}
            disabled={Object.keys(errors).length > 0 || !symbol || !quantity || numQuantity <= 0 || marketStatus !== 'OPEN'}
          >
            {getButtonText()}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;