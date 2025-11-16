


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
    <div className="bg-base-200 p-6 rounded-2xl shadow-lg h-full border border-base-300">
      <h3 className="text-2xl font-bold mb-6 text-text-strong">Trade Submission</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-base-100">
          <button type="button" onClick={() => setCurrentTradeType(TradeType.BUY)} className={`py-2 px-4 rounded-md text-center font-semibold transition-colors duration-200 ${currentTradeType === TradeType.BUY ? 'bg-success text-white' : 'hover:bg-base-300'}`}>Buy</button>
          <button type="button" onClick={() => setCurrentTradeType(TradeType.SELL)} className={`py-2 px-4 rounded-md text-center font-semibold transition-colors duration-200 ${currentTradeType === TradeType.SELL ? 'bg-error text-white' : 'hover:bg-base-300'}`}>Sell</button>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-base-content/80">Order Type</label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-base-100">
             {orderTypes.map(ot => {
                if (ot === OrderType.TRAILING_STOP && currentTradeType === TradeType.BUY) return null;
                return (<button key={ot} type="button" onClick={() => setOrderType(ot)} className={`py-2 px-2 text-sm rounded-md text-center font-semibold transition-colors duration-200 ${orderType === ot ? 'bg-primary text-white' : 'hover:bg-base-300'}`}>{ot.replace('_', ' ')}</button>)
            })}
          </div>
        </div>

        <div>
          <label htmlFor="equity" className="block text-sm font-medium mb-1 text-base-content/80">Equity</label>
          <select id="equity" value={symbol} onChange={handleSymbolChange} className="select select-bordered w-full bg-base-100 border-base-300 focus:ring-primary focus:border-primary" required>
            <option value="" disabled>Select a stock</option>
            {stocks.map(stock => <option key={stock.symbol} value={stock.symbol}>{stock.name} ({stock.symbol})</option>)}
          </select>
        </div>
        
        {currentTradeType === TradeType.SELL && symbol && <div className="text-sm text-info">You own {availableShares.toLocaleString()} shares.</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shares" className="block text-sm font-medium mb-1 text-base-content/80">Shares</label>
            <input id="shares" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input input-bordered w-full bg-base-100 border-base-300" placeholder="e.g., 100" min="1" required />
            {errors.quantity && <p className="text-error text-xs mt-1">{errors.quantity}</p>}
          </div>
          
          {orderType === OrderType.LIMIT ? (
            <div>
              <label htmlFor="limitPrice" className="block text-sm font-medium mb-1 text-base-content/80">Limit Price</label>
              <input id="limitPrice" type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="input input-bordered w-full bg-base-100 border-base-300" placeholder="e.g., 1.60" step="0.01" min="0.01" required />
              {errors.limitPrice && <p className="text-error text-xs mt-1">{errors.limitPrice}</p>}
            </div>
          ) : orderType === OrderType.TRAILING_STOP ? (
            <div>
              <label htmlFor="trailPercent" className="block text-sm font-medium mb-1 text-base-content/80">Trail %</label>
              <input id="trailPercent" type="number" value={trailPercent} onChange={(e) => setTrailPercent(e.target.value)} className="input input-bordered w-full bg-base-100 border-base-300" placeholder="e.g., 5" step="0.1" required />
              {errors.trailPercent && <p className="text-error text-xs mt-1">{errors.trailPercent}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1 text-base-content/80">Market Price</label>
              <input type="text" value={formatter.format(currentStock?.price || 0)} className="input input-bordered w-full bg-base-100/50 border-base-300" readOnly />
            </div>
          )}
        </div>

        <div className="pt-2">
            <div className="flex justify-between items-center text-lg font-bold text-text-strong bg-base-100 p-4 rounded-lg">
                <span className="text-base-content">Est. {currentTradeType === 'BUY' ? 'Cost' : 'Proceeds'}:</span>
                <span className="font-mono">{formatter.format(totalCost)}</span>
            </div>
        </div>

        <Button type="submit" className="w-full" variant={currentTradeType === TradeType.BUY ? 'success' : 'error'} disabled={Object.keys(errors).length > 0 || !symbol || !quantity || numQuantity <= 0 || marketStatus !== 'OPEN'}>
          {getButtonText()}
        </Button>
      </form>
    </div>
  );
};

export default TradeForm;