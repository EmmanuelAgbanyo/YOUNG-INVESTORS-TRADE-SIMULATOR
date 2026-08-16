
import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuthRole, Permission, Stock, Portfolio, OrderHistoryItem, TradeOrder, NewsHeadline, ActiveOrder, UserProfile, ToastMessage, MarketEvent, MarketStatus, Holding, AdminSettings, PerformanceHistoryEntry } from '../types.ts';
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
import TeamView from './TeamView.tsx';
import MarketEventDisplay from './MarketEventDisplay.tsx';
import TradeConfirmationModal from './TradeConfirmationModal.tsx';
import Leaderboard from './Leaderboard.tsx';
import SupportCenter from './SupportCenter.tsx';
import CompetitionsView from './CompetitionsView.tsx';

// Lazy-load heavy tabs — only parsed & executed when first visited
const AdminView = lazy(() => import('./AdminView.tsx'));
const AcademyView = lazy(() => import('./AcademyView.tsx'));

const TabFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

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
  authRole: AuthRole | null;
  permissions: Permission[];
  setToast: (toast: ToastMessage | null) => void;
  adminSettings: AdminSettings;
  marketControlMode: 'AUTO' | 'MANUAL';
  onUpdateMarketControlMode: (mode: 'AUTO' | 'MANUAL') => void;
  openMarketAdmin: () => void;
  closeMarketAdmin: () => void;
}

type Tab = 'Dashboard' | 'Trade' | 'Academy' | 'Orders' | 'History' | 'Support' | 'Competitions' | 'Team' | 'Admin';

const TAB_ICONS: Record<Tab, string> = {
  Dashboard: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  Trade: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  Academy: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  Orders: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
  History: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0',
  Support: 'M20.25 8.511c.884.284 1.5 1.132 1.5 2.109v4.63a2.25 2.25 0 01-2.25 2.25h-1.067a2.25 2.25 0 00-1.591.659l-2.61 2.61a.75.75 0 01-1.28-.53v-2.739a2.25 2.25 0 00-2.25-2.25H8.25a2.25 2.25 0 01-2.25-2.25v-4.63c0-.977.616-1.825 1.5-2.109m12.75 4.25a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z',
  Competitions: 'M8.25 4.5l7.5 0M8.25 4.5A2.25 2.25 0 016 6.75v8.5A2.25 2.25 0 018.25 17.5h7.5A2.25 2.25 0 0018 15.25v-8.5A2.25 2.25 0 0015.75 4.5M8.25 4.5v-1.125A1.125 1.125 0 019.375 2.25h5.25a1.125 1.125 0 011.125 1.125V4.5m-7.5 8.25h7.5m-5.25-3h3',
  Team: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  Admin: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

const TabNav: React.FC<{ activeTab: Tab; setActiveTab: (tab: Tab) => void; isAdmin: boolean, profile: UserProfile }> = ({ activeTab, setActiveTab, isAdmin, profile }) => {
  let baseTabs: Tab[] = ['Dashboard', 'Trade', 'Academy', 'Orders', 'History', 'Competitions', 'Support'];
  if (profile.teamId) baseTabs.push('Team');
  if (isAdmin) baseTabs.push('Admin');
  const activeIndex = baseTabs.indexOf(activeTab);
  const tabCount = baseTabs.length;

  return (
    <div className="relative mb-12">
      {/* MOBILE: horizontal scrollable icon+label tabs */}
      <div className="sm:hidden overflow-x-auto pb-4 custom-scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-2 p-2 min-w-max rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 shadow-xl">
          {baseTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-1.5 px-6 py-3.5 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 whitespace-nowrap min-w-[80px] ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.05] border border-blue-500'
                  : 'text-slate-400 dark:text-slate-500 hover:text-blue-500'
              }`}
              role="tab" aria-selected={activeTab === tab}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[tab]} />
              </svg>
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP: premium sliding pill tabs with "Imperial" glow */}
      <div className="hidden sm:flex relative items-center p-2 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 shadow-2xl overflow-hidden group/nav">
        <motion.div
          layoutId="tab-pill"
          className="absolute h-[calc(100%-1rem)] bg-blue-600 rounded-[1.75rem] shadow-xl shadow-blue-500/30"
          initial={false}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          style={{
            left: `calc(${(activeIndex / tabCount) * 100}% + 0.5rem)`,
            width: `calc(${100 / tabCount}% - 1rem)`,
            margin: '0.5rem 0',
          }}
        />
        {baseTabs.map(tab => (
          <button
            key={tab}
            className={`relative py-4 px-6 text-center font-black tracking-[0.1em] transition-all duration-500 flex-1 z-10 rounded-2xl text-xs uppercase flex items-center justify-center gap-3 ${
              activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab(tab)}
            role="tab" aria-selected={activeTab === tab}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[tab]} />
            </svg>
            <span className="truncate">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const MarketView: React.FC<MarketViewProps> = (props) => {
  const { stocks, profile, portfolio, activeOrders, orderHistory, placeOrder, cancelOrder, news, isNewsLoading, fetchNews, marketStatus, activeMarketEvent, isAdmin, authRole, permissions, setToast, adminSettings, performanceHistory, openMarketAdmin, closeMarketAdmin, marketControlMode, onUpdateMarketControlMode } = props;
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [selectedStockForTrade, setSelectedStockForTrade] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.BUY);
  const [activeSymbolForAnalysis, setActiveSymbolForAnalysis] = useState<string>(stocks[0]?.symbol || '');
  const [orderToConfirm, setOrderToConfirm] = useState<TradeOrder | null>(null);
  const { sessions, startAnalysis, sendMessage } = useAIAnalyst();

  const { holdingsValue, totalPnL, totalUnsettledCash } = useMemo(() => {
    let currentHoldingsValue = 0;
    let totalCostBasis = 0;
    
    const holdings = portfolio?.holdings || {};
    Object.values(holdings).forEach((holding: any) => {
      const stock = stocks.find(s => s.symbol === holding.symbol);
      currentHoldingsValue += (stock ? stock.price * holding.quantity : 0);
      totalCostBasis += (holding.avgCost || 0) * holding.quantity;
    });

    const unsettledCashArr = Array.isArray(portfolio?.unsettledCash) ? portfolio.unsettledCash : [];
    const currentUnsettledCash = unsettledCashArr.reduce((sum, item) => sum + (item?.amount || 0), 0);
    
    return { 
      holdingsValue: currentHoldingsValue, 
      totalPnL: currentHoldingsValue - totalCostBasis, 
      totalUnsettledCash: currentUnsettledCash 
    };
  }, [portfolio, stocks]);

  const totalValue = (portfolio?.cash || 0) + totalUnsettledCash + holdingsValue;

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
    // NOTE: selectedStockForTrade is cleared by TradeForm after it reads the prop
    // via its internal useEffect. Do NOT reset to null here synchronously.
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
          <motion.div 
            id="dashboard-view" 
            className="space-y-12 pb-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Primary Analysis Cluster */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
              <div className="xl:col-span-8 flex flex-col">
                <div className="flex-grow">
                   <PerformanceChart
                     history={performanceHistory || []}
                     startingCapital={adminSettings.startingCapital}
                   />
                </div>
              </div>
              <div className="xl:col-span-4 flex flex-col">
                <div className="flex-grow">
                   <PortfolioAllocationChart holdings={portfolio.holdings} stocks={stocks} />
                </div>
              </div>
            </div>

            {/* Execution & Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Data Grids */}
              <div className="lg:col-span-8 space-y-12">
                <div className="glass-perspective">
                   <HoldingsView
                     holdings={Object.values(portfolio.holdings)}
                     stocks={stocks}
                     onTradeAction={handleSelectStockForTrade}
                   />
                </div>
                <div className="glass-perspective">
                   <Leaderboard stocks={stocks} currentUserProfile={profile} isVisible={activeTab === 'Dashboard'} />
                </div>
              </div>

              {/* Right Column: Intelligence Hub */}
              <div className="lg:col-span-4 space-y-10">
                <div id="intelligence-hub" className="flex flex-col space-y-10 lg:sticky lg:top-8">
                   <div className="group/intel transform transition-all duration-500 hover:scale-[1.01]">
                      <MarketMovers stocks={stocks} marketStatus={marketStatus} />
                   </div>
                   <div className="group/intel transform transition-all duration-500 hover:scale-[1.01]">
                      <MarketNewsFeed
                        news={news}
                        isLoading={isNewsLoading}
                        onRefresh={fetchNews}
                      />
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'Trade':
        return (
          <motion.div 
            id="trade-view" 
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="lg:col-span-4 order-2 lg:order-1 sticky top-8">
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
            <div className="lg:col-span-8 order-1 lg:order-2">
              <StockChartView
                stock={activeStockForAnalysis}
                analystSession={currentAnalystSession}
                onStartAnalysis={startAnalysis}
                onSendMessage={sendMessage}
                marketStatus={marketStatus}
              />
            </div>
          </motion.div>
        );
      case 'Academy':
        return <Suspense fallback={<TabFallback />}><AcademyView profile={profile} /></Suspense>;
      case 'Orders':
        return <OrdersView activeOrders={activeOrders} orderHistory={orderHistory} onCancelOrder={cancelOrder} />;
      case 'History':
        return <HistoryView history={orderHistory} />;
      case 'Competitions':
        return <CompetitionsView profile={profile} setToast={setToast} />;
      case 'Support':
        return <SupportCenter profile={profile} setToast={setToast} />;
      case 'Team':
        return <TeamView profile={profile} orderHistory={orderHistory} />;
      case 'Admin':
        return isAdmin ? (
          <Suspense fallback={<TabFallback />}>
            <AdminView 
              stocks={stocks}
              isAdmin={isAdmin}
              authRole={authRole}
              permissions={permissions}
              setToast={setToast} 
              marketStatus={marketStatus} 
              openMarketAdmin={openMarketAdmin} 
              closeMarketAdmin={closeMarketAdmin} 
              adminSettings={adminSettings}
              marketControlMode={marketControlMode}
              onUpdateMarketControlMode={onUpdateMarketControlMode}
            />
          </Suspense>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Imperial Background Aesthetic */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-white/20 dark:bg-transparent">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-slow-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] animate-slow-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="space-y-8 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <MarketEventDisplay event={activeMarketEvent} />
        {activeTab !== 'Academy' && <PortfolioSummary cash={portfolio.cash} unsettledCash={totalUnsettledCash} holdingsValue={holdingsValue} totalValue={totalValue} totalPnL={totalPnL} />}

        <div className="space-y-0 relative">
          <TabNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} profile={profile} />
          <div className="mt-4">
            <AnimatePresence mode="wait">
              <div key={activeTab}>
                {renderContent()}
              </div>
            </AnimatePresence>
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
    </div>
  );
};

export default MarketView;
