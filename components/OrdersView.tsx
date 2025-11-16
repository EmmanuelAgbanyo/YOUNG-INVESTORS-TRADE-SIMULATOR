import React, { useState } from 'react';
import type { ActiveOrder, OrderHistoryItem } from '../types.ts';
import { TradeType, OrderStatus } from '../types.ts';
import EmptyState from './ui/EmptyState.tsx';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';

interface OrdersViewProps {
  activeOrders: ActiveOrder[];
  orderHistory: OrderHistoryItem[];
  onCancelOrder: (orderId: string) => void;
}

const ListBulletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);


const OrdersView: React.FC<OrdersViewProps> = ({ activeOrders, orderHistory, onCancelOrder }) => {
  const [orderToCancel, setOrderToCancel] = useState<ActiveOrder | null>(null);
  
  const handleCancelClick = (order: ActiveOrder) => {
    setOrderToCancel(order);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      onCancelOrder(orderToCancel.id);
    }
    setOrderToCancel(null);
  };

  const handleCloseModal = () => {
    setOrderToCancel(null);
  };
  
  const filledOrders = orderHistory.filter(o => o.finalStatus === OrderStatus.EXECUTED);

  if (activeOrders.length === 0 && filledOrders.length === 0) {
    return (
        <Card>
            <EmptyState
                icon={<ListBulletIcon className="w-12 h-12" />}
                title="No orders yet"
                message="Active and filled orders for this session will appear here."
            />
        </Card>
    );
  }
  
  const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

  const getStatusChip = (status: ActiveOrder['status']) => {
    const isPending = status === OrderStatus.PENDING;
    return (
        <div className="flex items-center space-x-2 justify-end">
             {isPending && <div className="w-2 h-2 bg-info rounded-full animate-pulse-dot"></div>}
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isPending ? 'text-info' : 'text-success'}`}>
                {status}
            </span>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="!p-0 max-h-[40vh] flex flex-col">
            <h3 className="text-xl font-bold text-text-strong p-4 border-b border-base-300">Working Orders ({activeOrders.length})</h3>
            {activeOrders.length > 0 ? (
                <div className="overflow-y-auto">
                    <table className="table w-full">
                        <tbody>
                        {activeOrders.map((order, index) => (
                            <tr key={order.id} className={`border-b border-base-300/50 last:border-b-0 ${index % 2 === 0 ? 'bg-base-200/30' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${order.tradeType === TradeType.BUY ? 'bg-success' : 'bg-error'}`}>
                                            {order.tradeType}
                                        </span>
                                        <div>
                                            <div className="font-bold text-text-strong">{order.symbol}</div>
                                            <div className="text-sm opacity-70">{order.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-mono text-text-strong">{order.quantity.toLocaleString()} Shares</div>
                                    <div className="text-sm opacity-70">{order.orderType.replace('_', ' ')} Order</div>
                                </td>
                                <td className="text-right font-mono p-4">
                                    {order.limitPrice && <div>Limit: {formatter.format(order.limitPrice)}</div>}
                                    {order.triggerPrice && <div className="text-sm text-info">Trigger: {formatter.format(order.triggerPrice)}</div>}
                                    {!order.limitPrice && !order.triggerPrice && <div className="text-right">{getStatusChip(order.status)}</div>}
                                </td>
                                <td className="text-center p-4">
                                    <Button variant="error" size="sm" onClick={() => handleCancelClick(order)}>Cancel</Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="p-4 text-base-content/70">No pending orders.</p>}
        </Card>

        <Card className="!p-0 max-h-[40vh] flex flex-col">
            <h3 className="text-xl font-bold text-text-strong p-4 border-b border-base-300">Filled Orders ({filledOrders.length})</h3>
            {filledOrders.length > 0 ? (
                <div className="overflow-y-auto">
                    <table className="table w-full">
                        <tbody>
                        {filledOrders.map((item, index) => (
                            <tr key={item.id} className={`border-b border-base-300/50 last:border-b-0 ${index % 2 === 0 ? 'bg-base-200/30' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${item.tradeType === TradeType.BUY ? 'bg-success' : 'bg-error'}`}>
                                            {item.tradeType}
                                        </span>
                                        <div>
                                            <div className="font-bold text-text-strong">{item.symbol}</div>
                                            <div className="text-sm opacity-70">{item.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-mono text-text-strong">{item.quantity.toLocaleString()} Shares</div>
                                    <div className="text-sm opacity-70">{item.orderType.replace('_', ' ')} Order</div>
                                </td>
                                <td className="text-right p-4">
                                    <div className="font-mono text-text-strong">{item.total ? formatter.format(item.total) : 'N/A'}</div>
                                    <div className="text-sm opacity-70 font-mono">@{item.price ? formatter.format(item.price) : 'N/A'}</div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="p-4 text-base-content/70">No orders filled in this session yet.</p>}
        </Card>
      </div>

      <ConfirmationModal
        isOpen={!!orderToCancel}
        onClose={handleCloseModal}
        onConfirm={handleConfirmCancel}
        title="Confirm Order Cancellation"
        confirmText="Confirm & Cancel Order"
        confirmVariant="error"
      >
        {orderToCancel && (
          <div className="text-base-content space-y-2">
            <p>You are about to cancel the following order. This action cannot be undone.</p>
            <div className="bg-base-200 p-4 rounded-lg border border-base-300 text-sm">
                <div className="flex justify-between"><span>Stock:</span> <span className="font-bold text-text-strong">{orderToCancel.symbol}</span></div>
                <div className="flex justify-between"><span>Type:</span> <span className="font-bold text-text-strong">{orderToCancel.tradeType} {orderToCancel.orderType.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span>Quantity:</span> <span className="font-bold text-text-strong">{orderToCancel.quantity.toLocaleString()} shares</span></div>
            </div>
             <p className="text-xs pt-2">If this is a BUY order, the reserved funds will be returned to your available cash balance.</p>
          </div>
        )}
      </ConfirmationModal>
    </>
  );
};

export default OrdersView;