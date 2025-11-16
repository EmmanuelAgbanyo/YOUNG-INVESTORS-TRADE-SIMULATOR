
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
  openMarketAdmin: () => void;
  closeMarketAdmin: () => void;
}

type Tab = 'Dashboard' | 'Trade' | 'Academy' | 'Orders' | 'History' | 'Team' | 'Admin';

const TabNav: React.FC<{ activeTab: Tab; setActiveTab: (tab: Tab) => void; isAdmin: boolean, profile: UserProfile }> = ({ activeTab, setActiveTab, isAdmin, profile }) => {
    let baseTabs: Tab[] = ['Dashboard', 'Trade', 'Academy', 'Orders', 'History'];
    if (profile.teamId) {
      baseTabs.push('Team');
    }
    if (isAdmin) {
      baseTabs.push('Admin');
    }
    const activeIndex = baseTabs.indexOf(activeTab);
    const tabCount = baseTabs.length;

    return (
        <div className="relative flex items-center justify-between p-1 rounded-lg bg-base-200">
             <div
                className="absolute top-1 left-1 bottom-1 bg-primary rounded-md transition-all duration-300 ease-in-out"
                style={{
                    width: `calc((100% - ${(tabCount - 1) * 0.25}rem) / ${tabCount})`,
                    transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem))`,
                }}
            />
            {baseTabs.map(tab => (
              <button
                key={tab}
                className={`relative py-2 px-4 text-center font-semibold transition-colors duration-200 flex-1 z-10 rounded-md text-sm sm:text-base ${activeTab === tab ? 'text-white' : 'text-base-content hover:text-text-strong'}`}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab}
              </button>
            ))}
        </div>
    )
}

const MarketView: React.FC<MarketViewProps> = (props) => {
  // FIX: Destructured the new 'performanceHistory' prop.
  const { stocks, profile, portfolio, activeOrders, orderHistory, placeOrder, cancelOrder, news, isNewsLoading, fetchNews, marketStatus, activeMarketEvent, isAdmin, setToast, adminSettings, performanceHistory, openMarketAdmin, closeMarketAdmin } = props;
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
          <div id="dashboard-view" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
               <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <PortfolioAllocationChart holdings={portfolio.holdings} stocks={stocks} />
              </div>
               <div className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                  <PerformanceChart 
                      // FIX: Pass the 'performanceHistory' prop instead of incorrectly accessing it from 'portfolio'.
                      history={performanceHistory || []} 
                      startingCapital={adminSettings.startingCapital} 
                  />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <HoldingsView
                  holdings={Object.values(portfolio.holdings)}
                  stocks={stocks}
                  onTradeAction={handleSelectStockForTrade}
                />
              </div>
              <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <MarketMovers stocks={stocks} />
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
            <div id="trade-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1">
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
                <div className="lg:col-span-2">
                    <StockChartView
                        stock={activeStockForAnalysis}
                        analystSession={currentAnalystSession}
                        onStartAnalysis={startAnalysis}
                        onSendMessage={sendMessage}
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
            return isAdmin ? <AdminView stocks={stocks} setToast={setToast} marketStatus={marketStatus} openMarketAdmin={openMarketAdmin} closeMarketAdmin={closeMarketAdmin} /> : null;
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
