
import React, { useState, useMemo } from 'react';
// FIX: Import PerformanceHistoryEntry type to use in component props.
import type { Stock, Portfolio, OrderHistoryItem, TradeOrder, NewsHeadline, ActiveOrder, UserProfile, ToastMessage, MarketEvent, MarketStatus, Holding, AdminSettings, PerformanceHistoryEntry } from '../types.ts';
import { TradeType } from '../types.ts';
import PortfolioSummary from './PortfolioSummary.tsx';
import HoldingsView from './HoldingsView.tsx';
import TradeForm from './TradeForm.tsx';
import HistoryView from './HistoryView.tsx';
import OrdersView from './OrdersView.tsx';
import MarketMovers from './MarketMovers.tsx';
import MarketNewsFeed from './MarketNewsFeed.tsx';
import StockChartView from './StockChartView.tsx';
import { useAIAnalyst } from '../hooks/useAIAnalyst.ts';
import PortfolioAllocationChart from './PortfolioAllocationChart.tsx';
import PerformanceChart from './PerformanceChart.tsx';
import AdminView from './AdminView.tsx';
import TeamView from './TeamView.tsx';
import AcademyView from './AcademyView.tsx';
import MarketEventDisplay from './MarketEventDisplay.tsx';
import TradeConfirmationModal from './TradeConfirmationModal.tsx';
import Leaderboard from './Leaderboard.tsx';

interface MarketViewProps {
  stocks: Stock[];
  profile: UserProfile;
  portfolio: Portfolio;
  activeOrders: ActiveOrder[];
  orderHistory: OrderHistoryItem[];
  // FIX: Added performanceHistory to the component's props interface.
  performanceHistory: PerformanceHistoryEntry[];
  placeOrder: (order: TradeOrder) => boolean;
  cancelOrder: (orderId: string) => void;
  news: NewsHeadline[];
  isNewsLoading: boolean;
  fetchNews: () => void;
  marketStatus: MarketStatus;
  activeMarketEvent: MarketEvent | null;
  isAdmin: boolean;
  setToast: (toast: ToastMessage | null) => void;
  adminSettings: AdminSettings;
  marketControlMode: 'AUTO' | 'MANUAL';
  onUpdateMarketControlMode: (mode: 'AUTO' | 'MANUAL') => void;
  openMarketAdmin: () => void;
  closeMarketAdmin: () => void;
}

type Tab = 'Dashboard' | 'Trade' | 'Academy' | 'Orders' | 'History' | 'Team' | 'Admin';

const TAB_ICONS: Record<Tab, string> = {
  Dashboard: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  Trade: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  Academy: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  Orders: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
  History: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  Team: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  Admin: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

const TabNav: React.FC<{ activeTab: Tab; setActiveTab: (tab: Tab) => void; isAdmin: boolean, profile: UserProfile }> = ({ activeTab, setActiveTab, isAdmin, profile }) => {
  let baseTabs: Tab[] = ['Dashboard', 'Trade', 'Academy', 'Orders', 'History'];
  if (profile.teamId) baseTabs.push('Team');
  if (isAdmin) baseTabs.push('Admin');
  const activeIndex = baseTabs.indexOf(activeTab);
  const tabCount = baseTabs.length;

  return (
    <>
      {/* MOBILE: horizontal scrollable icon+label tabs */}
      <div className="sm:hidden overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-1.5 p-1.5 min-w-max rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {baseTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap min-w-[60px] ${
                activeTab === tab
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.03]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-blue-600'
              }`}
              role="tab" aria-selected={activeTab === tab}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[tab]} />
              </svg>
              <span>{tab.slice(0, 5)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP: premium sliding pill tabs */}
      <div className="hidden sm:flex relative items-center justify-between p-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] pointer-events-none" />
        <div
          className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-lg shadow-blue-500/30"
          style={{
            left: '0.375rem',
            width: `calc((100% - ${(tabCount + 1) * 0.375}rem) / ${tabCount})`,
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.375}rem))`,
          }}
        />
        {baseTabs.map(tab => (
          <button
            key={tab}
            className={`relative py-2.5 px-2 md:px-4 text-center font-bold tracking-wide transition-all duration-300 flex-1 z-10 rounded-xl text-xs md:text-sm flex items-center justify-center gap-1.5 ${
              activeTab === tab ? 'text-white drop-shadow-md cursor-default' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/40 dark:hover:bg-slate-800/60'
            }`}
            onClick={() => setActiveTab(tab)}
            role="tab" aria-selected={activeTab === tab}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[tab]} />
            </svg>
            <span className="truncate">{tab}</span>
          </button>
        ))}
      </div>
    </>
  );
}

const MarketView: React.FC<MarketViewProps> = (props) => {
  // FIX: Destructured the new 'performanceHistory' prop.
  const { stocks, profile, portfolio, activeOrders, orderHistory, placeOrder, cancelOrder, news, isNewsLoading, fetchNews, marketStatus, activeMarketEvent, isAdmin, setToast, adminSettings, performanceHistory, openMarketAdmin, closeMarketAdmin, marketControlMode, onUpdateMarketControlMode } = props;
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [selectedStockForTrade, setSelectedStockForTrade] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.BUY);
  const [activeSymbolForAnalysis, setActiveSymbolForAnalysis] = useState<string>(stocks[0]?.symbol || '');
  const [orderToConfirm, setOrderToConfirm] = useState<TradeOrder | null>(null);
  const { sessions, startAnalysis, sendMessage } = useAIAnalyst();

  const { holdingsValue, totalPnL, totalUnsettledCash } = useMemo(() => {
    let holdingsValue = 0;
    let totalCostBasis = 0;
    // FIX: Explicitly type the 'holding' parameter to resolve 'unknown' type error.
    Object.values(portfolio.holdings).forEach((holding: Holding) => {
      const stock = stocks.find(s => s.symbol === holding.symbol);
      holdingsValue += (stock ? stock.price * holding.quantity : 0);
      totalCostBasis += holding.avgCost * holding.quantity;
    });
    const totalUnsettledCash = portfolio.unsettledCash.reduce((sum, item) => sum + item.amount, 0);
    return { holdingsValue, totalPnL: holdingsValue - totalCostBasis, totalUnsettledCash };
  }, [portfolio.holdings, portfolio.unsettledCash, stocks]);

  const totalValue = portfolio.cash + totalUnsettledCash + holdingsValue;

  const activeStockForAnalysis = useMemo(() => {
    if (!activeSymbolForAnalysis) return stocks[0] || null;
    return stocks.find(s => s.symbol === activeSymbolForAnalysis) || stocks[0] || null;
  }, [stocks, activeSymbolForAnalysis]);

  const currentAnalystSession = sessions[activeSymbolForAnalysis] || {
    messages: [],
    isLoading: false,
    error: null,
  };

  const handleSelectStockForTrade = (stock: Stock, type: TradeType) => {
    setSelectedStockForTrade(stock);
    setTradeType(type);
    setActiveTab('Trade');
    setActiveSymbolForAnalysis(stock.symbol);
    setTimeout(() => setSelectedStockForTrade(null), 0);
  };

  const handleSymbolChange = (symbol: string) => {
    setActiveSymbolForAnalysis(symbol);
    setSelectedStockForTrade(null);
  };

  const handlePlaceOrder = (order: TradeOrder) => {
    setOrderToConfirm(order);
  }

  const handleGoToOrders = () => {
    setOrderToConfirm(null); // Close the modal
    setActiveTab('Orders');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div id="dashboard-view" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <PortfolioAllocationChart holdings={portfolio.holdings} stocks={stocks} />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                <PerformanceChart
                  history={performanceHistory || []}
                  startingCapital={adminSettings.startingCapital}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <HoldingsView
                  holdings={Object.values(portfolio.holdings)}
                  stocks={stocks}
                  onTradeAction={handleSelectStockForTrade}
                />
                <div className="pt-4 animate-fade-in-up" style={{ animationDelay: '650ms' }}>
                   <Leaderboard stocks={stocks} currentUserProfile={profile} />
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <MarketMovers stocks={stocks} marketStatus={marketStatus} />
                <MarketNewsFeed
                  news={news}
                  isLoading={isNewsLoading}
                  onRefresh={fetchNews}
                />
              </div>
            </div>
          </div>
        );
      case 'Trade':
        return (
          <div id="trade-view" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
            <div className="lg:col-span-1 order-1">
              <TradeForm
                stocks={stocks}
                portfolio={portfolio}
                onPlaceOrder={handlePlaceOrder}
                selectedStock={selectedStockForTrade}
                tradeType={tradeType}
                onSymbolChange={handleSymbolChange}
                marketStatus={marketStatus}
              />
            </div>
            <div className="lg:col-span-2 order-2">
              <StockChartView
                stock={activeStockForAnalysis}
                analystSession={currentAnalystSession}
                onStartAnalysis={startAnalysis}
                onSendMessage={sendMessage}
                marketStatus={marketStatus}
              />
            </div>
          </div>
        );
      case 'Academy':
        return <AcademyView profile={profile} />;
      case 'Orders':
        return <OrdersView activeOrders={activeOrders} orderHistory={orderHistory} onCancelOrder={cancelOrder} />;
      case 'History':
        return <HistoryView history={orderHistory} />;
      case 'Team':
        return <TeamView profile={profile} orderHistory={orderHistory} />;
      case 'Admin':
        return isAdmin ? (
          <AdminView 
            stocks={stocks} 
            setToast={setToast} 
            marketStatus={marketStatus} 
            openMarketAdmin={openMarketAdmin} 
            closeMarketAdmin={closeMarketAdmin} 
            adminSettings={adminSettings}
            marketControlMode={marketControlMode}
            onUpdateMarketControlMode={onUpdateMarketControlMode}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <MarketEventDisplay event={activeMarketEvent} />
        {activeTab !== 'Academy' && <PortfolioSummary cash={portfolio.cash} unsettledCash={totalUnsettledCash} holdingsValue={holdingsValue} totalValue={totalValue} totalPnL={totalPnL} />}

        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <TabNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} profile={profile} />
          <div className="mt-4">
            <div key={activeTab} className="animate-fade-in">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      <TradeConfirmationModal
        isOpen={!!orderToConfirm}
        onClose={() => setOrderToConfirm(null)}
        order={orderToConfirm}
        stock={stocks.find(s => s.symbol === orderToConfirm?.symbol)}
        onConfirmOrder={placeOrder}
        onGoToOrders={handleGoToOrders}
      />
    </>
  );
};

export default MarketView;
