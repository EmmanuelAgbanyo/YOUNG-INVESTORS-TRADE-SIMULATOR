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
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-8">
                <EmptyState
                    icon={<ListBulletIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />}
                    title="No orders yet"
                    message="Active and filled orders for this session will appear here."
                />
            </div>
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
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl max-h-[40vh] flex flex-col overflow-hidden">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 tracking-tight">Working Orders ({activeOrders.length})</h3>
                    {activeOrders.length > 0 ? (
                        <div className="overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {activeOrders.map((order, index) => (
                                        <tr key={order.id} className={`border-b border-slate-200/50 dark:border-slate-700/50 last:border-b-0 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors ${index % 2 === 0 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full text-white shadow-sm ${order.tradeType === TradeType.BUY ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
                                                        {order.tradeType}
                                                    </span>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white tracking-wide">{order.symbol}</div>
                                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{order.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-bold font-mono text-slate-800 dark:text-white">{order.quantity.toLocaleString()} Shares</div>
                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{order.orderType.replace('_', ' ')}</div>
                                            </td>
                                            <td className="text-right font-mono p-4 align-middle text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {order.limitPrice && <div>Limit: {formatter.format(order.limitPrice)}</div>}
                                                {order.triggerPrice && <div className="text-rose-500 dark:text-rose-400 font-bold mt-0.5">Trigger: {formatter.format(order.triggerPrice)}</div>}
                                                {!order.limitPrice && !order.triggerPrice && <div className="flex justify-end">{getStatusChip(order.status)}</div>}
                                            </td>
                                            <td className="text-center p-4 align-middle w-24">
                                                <button
                                                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                                    onClick={() => handleCancelClick(order)}
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="p-6 text-sm font-medium text-slate-500 dark:text-slate-400 text-center">No pending orders.</p>}
                </div>

                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl max-h-[40vh] flex flex-col overflow-hidden">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 tracking-tight">Filled Orders ({filledOrders.length})</h3>
                    {filledOrders.length > 0 ? (
                        <div className="overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {filledOrders.map((item, index) => (
                                        <tr key={item.id} className={`border-b border-slate-200/50 dark:border-slate-700/50 last:border-b-0 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors ${index % 2 === 0 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full text-white shadow-sm ${item.tradeType === TradeType.BUY ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
                                                        {item.tradeType}
                                                    </span>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white tracking-wide">{item.symbol}</div>
                                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-bold font-mono text-slate-800 dark:text-white">{item.quantity.toLocaleString()} Shares</div>
                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{item.orderType.replace('_', ' ')}</div>
                                            </td>
                                            <td className="text-right p-4 align-middle">
                                                <div className="font-black font-mono text-slate-800 dark:text-white text-base">{item.total ? formatter.format(item.total) : 'N/A'}</div>
                                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono mt-0.5">@{item.price ? formatter.format(item.price) : 'N/A'}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="p-6 text-sm font-medium text-slate-500 dark:text-slate-400 text-center">No orders filled in this session yet.</p>}
                </div>
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