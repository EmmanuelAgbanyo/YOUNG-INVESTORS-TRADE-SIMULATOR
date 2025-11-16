


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
          [OrderStatus.EXECUTED]: 'bg-success/20 text-success',
          [OrderStatus.CANCELLED]: 'bg-error/20 text-error',
          [OrderStatus.EXPIRED]: 'bg-info/20 text-info',
      }
      return <span className={`px-2 py-1 text-xs font-bold rounded-full ${config[status]}`}>{status}</span>;
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
        <div className="overflow-x-auto">
            <table className="table w-full">
            <thead className="sticky top-0 bg-base-200 z-10">
                <tr className="border-b border-base-300">
                <th className="text-left bg-transparent text-base-content font-semibold p-4">Order Details</th>
                <th className="text-left bg-transparent text-base-content font-semibold p-4">Trader</th>
                <th className="text-right bg-transparent text-base-content font-semibold p-4">Quantity</th>
                <th className="text-right bg-transparent text-base-content font-semibold p-4">Avg. Price</th>
                <th className="text-right bg-transparent text-base-content font-semibold p-4">Total</th>
                <th className="text-center bg-transparent text-base-content font-semibold p-4">Status</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndSortedHistory.map((item, index) => (
                <tr key={item.id} className={`border-b border-base-300/50 last:border-b-0 ${index % 2 === 0 ? 'bg-base-200/30' : ''}`}>
                    <td className="p-4">
                    <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${item.tradeType === TradeType.BUY ? 'bg-success' : 'bg-error'}`}>
                            {item.tradeType}
                        </span>
                        <div>
                            <div className="font-bold text-text-strong">{item.symbol}</div>
                            <div className="text-sm opacity-70">{item.orderType.replace('_', ' ')} Order</div>
                        </div>
                    </div>
                    </td>
                    <td className="p-4 font-semibold text-text-strong">{item.traderName}</td>
                    <td className="text-right font-mono p-4">{item.quantity.toLocaleString()}</td>
                    <td className="text-right font-mono p-4">{item.price ? formatter.format(item.price) : 'N/A'}</td>
                    <td className="text-right font-mono text-text-strong p-4">{item.total ? formatter.format(item.total) : 'N/A'}</td>
                    <td className="text-center p-4">{getStatusChip(item.finalStatus)}</td>
                </tr>
                ))}
            </tbody>
            </table>
      </div>
    );
  };

  return (
    <Card className="!p-0 flex flex-col">
        <div className="p-4 border-b border-base-300 flex flex-wrap items-center gap-4">
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-base-content/80">Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select select-bordered select-sm w-full bg-base-100 border-base-300 focus:ring-primary focus:border-primary">
                        <option value="ALL">All Statuses</option>
                        <option value={OrderStatus.EXECUTED}>Executed</option>
                        <option value={OrderStatus.CANCELLED}>Cancelled</option>
                        <option value={OrderStatus.EXPIRED}>Expired</option>
                    </select>
                </div>
                 {/* Type Filter */}
                 <div>
                    <label className="block text-xs font-medium mb-1 text-base-content/80">Type</label>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select select-bordered select-sm w-full bg-base-100 border-base-300 focus:ring-primary focus:border-primary">
                        <option value="ALL">All Types</option>
                        <option value={TradeType.BUY}>Buy</option>
                        <option value={TradeType.SELL}>Sell</option>
                    </select>
                </div>
                 {/* Start Date */}
                 <div>
                    <label className="block text-xs font-medium mb-1 text-base-content/80">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input input-bordered input-sm w-full bg-base-100 border-base-300" />
                 </div>
                 {/* End Date */}
                 <div>
                    <label className="block text-xs font-medium mb-1 text-base-content/80">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input input-bordered input-sm w-full bg-base-100 border-base-300" />
                 </div>
            </div>
            <div className="pt-5">
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>Reset</Button>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto max-h-[calc(60vh-80px)]">
            {renderContent()}
        </div>
    </Card>
  );
};

export default HistoryView;