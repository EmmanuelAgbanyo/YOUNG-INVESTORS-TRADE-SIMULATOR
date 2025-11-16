import React, { useState, useEffect } from 'react';
import type { TradeOrder, Stock } from '../types.ts';
import { OrderType } from '../types.ts';
import Button from './ui/Button.tsx';

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: TradeOrder | null;
  stock: Stock | undefined;
  onConfirmOrder: (order: TradeOrder) => boolean;
  onGoToOrders: () => void;
}

type Stage = 'review' | 'submitted' | 'failure';

const Checkmark: React.FC = () => (
    <svg className="w-16 h-16 text-success" viewBox="0 0 52 52">
        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" strokeWidth="4" />
        <path className="checkmark-check" fill="none" d="M14 27l5 5 15-15" strokeWidth="5" />
    </svg>
);

const ErrorCross: React.FC = () => (
    <svg className="w-16 h-16 text-error" viewBox="0 0 52 52">
         <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" strokeWidth="4" />
         <path className="checkmark-check" strokeLinecap="round" fill="none" d="M16 16 36 36 M36 16 16 36" strokeWidth="5" />
    </svg>
)

const TradeConfirmationModal: React.FC<TradeConfirmationModalProps> = ({ isOpen, onClose, order, stock, onConfirmOrder, onGoToOrders }) => {
  const [stage, setStage] = useState<Stage>('review');
  
  useEffect(() => {
    if (isOpen) {
      setStage('review');
    }
  }, [isOpen]);

  if (!isOpen || !order || !stock) return null;

  const handleConfirm = () => {
    const success = onConfirmOrder(order);
    if (success) {
      setStage('submitted');
    } else {
      setStage('failure');
    }
  };
  
  const handleClose = () => {
    onClose();
  };

  const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });
  const isBuy = order.tradeType === 'BUY';
  const estimatedValue = (order.limitPrice || stock.price) * order.quantity;

  const renderContent = () => {
    switch (stage) {
      case 'review':
        return (
          <>
            <h2 className="text-2xl font-bold text-text-strong text-center mb-4">Confirm Your Order</h2>
            <div className="bg-base-100 p-4 rounded-lg space-y-2 border border-base-300">
                <div className="flex justify-between items-center text-lg">
                    <span className={`font-bold ${isBuy ? 'text-success' : 'text-error'}`}>{order.tradeType} {order.quantity.toLocaleString()}</span>
                    <span className="font-bold text-text-strong">{order.symbol}</span>
                </div>
                <div className="text-sm space-y-1 text-base-content/80">
                    <div className="flex justify-between"><span>Order Type:</span><span className="font-semibold text-text-strong">{order.orderType.replace('_',' ')}</span></div>
                    {order.orderType === 'LIMIT' && <div className="flex justify-between"><span>Limit Price:</span><span className="font-semibold text-text-strong font-mono">{formatter.format(order.limitPrice!)}</span></div>}
                    {order.orderType === 'TRAILING_STOP' && <div className="flex justify-between"><span>Trail Percent:</span><span className="font-semibold text-text-strong font-mono">{order.trailPercent! * 100}%</span></div>}
                    <div className="flex justify-between"><span>Est. {isBuy ? 'Cost' : 'Proceeds'}:</span><span className="font-semibold text-text-strong font-mono">{formatter.format(estimatedValue)}</span></div>
                </div>
            </div>
             {order.orderType === OrderType.MARKET && (
                <p className="text-xs text-center text-info mt-3 p-2 bg-info/10 rounded-md">
                    Note: Market orders execute at the current best price, which may differ slightly from the estimate.
                </p>
            )}
            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button variant={isBuy ? 'success' : 'error'} onClick={handleConfirm}>Confirm {order.tradeType} Order</Button>
            </div>
          </>
        );
      case 'submitted':
        return (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Checkmark />
            <p className="mt-4 text-lg font-semibold text-success">Order Submitted</p>
            <p className="text-sm text-base-content/80 mt-1">
              Your order is now <strong>PENDING</strong> and will be placed on the market shortly.
            </p>
            <div className="flex w-full space-x-3 mt-6">
                <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
                <Button variant="primary" onClick={onGoToOrders} className="flex-1">View Orders</Button>
            </div>
          </div>
        );
      case 'failure':
        return (
             <div className="flex flex-col items-center justify-center h-48 text-center">
                <ErrorCross />
                <p className="mt-4 text-lg font-semibold text-error">Order Failed</p>
                <p className="text-sm text-base-content/80 text-center mt-1">This could be due to insufficient funds or shares. Please check your portfolio.</p>
                <Button variant="ghost" onClick={handleClose} className="mt-4">Close</Button>
            </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-base-200 p-6 rounded-2xl shadow-2xl border border-base-300/50 w-full max-w-sm animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default TradeConfirmationModal;