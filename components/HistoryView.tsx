


import React, { useState, useMemo } from 'react';
import type { OrderHistoryItem } from '../types.ts';
import { TradeType, OrderStatus } from '../types.ts';
import EmptyState from './ui/EmptyState.tsx';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';

interface HistoryViewProps {
    history: OrderHistoryItem[];
}

const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);


const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const handleResetFilters = () => {
        setStatusFilter('ALL');
        setTypeFilter('ALL');
        setStartDate('');
        setEndDate('');
    };

    const filteredAndSortedHistory = useMemo(() => {
        return history
            .filter(item => {
                if (statusFilter !== 'ALL' && item.finalStatus !== statusFilter) {
                    return false;
                }
                if (typeFilter !== 'ALL' && item.tradeType !== typeFilter) {
                    return false;
                }
                const itemDate = new Date(item.timestamp);
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0); // Consider the whole day
                    if (itemDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999); // Consider the whole day
                    if (itemDate > end) return false;
                }
                return true;
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [history, statusFilter, typeFilter, startDate, endDate]);


    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

    const getStatusChip = (status: OrderHistoryItem['finalStatus']) => {
        const config = {
            [OrderStatus.EXECUTED]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10',
            [OrderStatus.CANCELLED]: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/10',
            [OrderStatus.EXPIRED]: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 shadow-sm shadow-slate-500/10',
        }
        return <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${config[status]}`}>{status}</span>;
    }

    const renderContent = () => {
        if (history.length === 0) {
            return (
                <EmptyState
                    icon={<ClockIcon className="w-12 h-12" />}
                    title="No order history"
                    message="Your completed, cancelled, or expired orders will appear here."
                />
            );
        }

        if (filteredAndSortedHistory.length === 0) {
            return (
                <EmptyState
                    icon={<FilterIcon className="w-12 h-12" />}
                    title="No orders match your filters"
                    message="Try adjusting or resetting your filter criteria to see more results."
                />
            );
        }

        return (
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md z-10 shadow-sm">
                        <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                            <th className="text-left text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 p-5">Order Details</th>
                            <th className="text-left text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 p-5">Trader</th>
                            <th className="text-right text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 p-5">Quantity</th>
                            <th className="text-right text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 p-5">Avg. Price</th>
                            <th className="text-right text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 p-5">Total</th>
                            <th className="text-center text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 p-5">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedHistory.map((item, index) => (
                            <tr key={item.id} className={`border-b border-slate-200/50 dark:border-slate-700/50 last:border-b-0 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors ${index % 2 === 0 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                                <td className="p-5 align-middle">
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full text-white shadow-sm flex-shrink-0 ${item.tradeType === TradeType.BUY ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
                                            {item.tradeType}
                                        </span>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-white tracking-wide">{item.symbol}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">{item.orderType.replace('_', ' ')} Order</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 align-middle font-bold text-slate-800 dark:text-white">{item.traderName}</td>
                                <td className="text-right font-bold font-mono p-5 align-middle text-slate-800 dark:text-white">{item.quantity.toLocaleString()}</td>
                                <td className="text-right font-medium font-mono p-5 align-middle text-slate-600 dark:text-slate-300">{item.price ? formatter.format(item.price) : 'N/A'}</td>
                                <td className="text-right font-black font-mono text-slate-800 dark:text-white p-5 align-middle text-base">{item.total ? formatter.format(item.total) : 'N/A'}</td>
                                <td className="text-center p-5 align-middle">{getStatusChip(item.finalStatus)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-end gap-5 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm">
                            <option value="ALL">All Statuses</option>
                            <option value={OrderStatus.EXECUTED}>Executed</option>
                            <option value={OrderStatus.CANCELLED}>Cancelled</option>
                            <option value={OrderStatus.EXPIRED}>Expired</option>
                        </select>
                    </div>
                    {/* Type Filter */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Type</label>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm">
                            <option value="ALL">All Types</option>
                            <option value={TradeType.BUY}>Buy</option>
                            <option value={TradeType.SELL}>Sell</option>
                        </select>
                    </div>
                    {/* Start Date */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm" />
                    </div>
                    {/* End Date */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow shadow-sm" />
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={handleResetFilters}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto max-h-[calc(60vh-80px)] custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
};

export default HistoryView;