
import React, { useState } from 'react';
import Button from './ui/Button.tsx';

interface GuideModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TABS = ["Welcome", "Trading Basics", "Order Types", "Platform Features"];

const WelcomeContent: React.FC = () => (
    <div className="space-y-4">
        <h3 className="text-2xl font-bold text-primary">Welcome to the YIN Trade Simulator</h3>
        <p>This simulator is a powerful tool designed to help you learn the ropes of stock trading in a realistic, risk-free environment. Practice your strategies, understand market dynamics, and build confidence before you invest real capital.</p>
        <p>The market is simulated with real Ghanaian stocks but uses fictional price movements. You start with **GHS 100,000** in virtual cash. Your goal is to grow your portfolio by making smart trading decisions.</p>
        <div className="p-4 bg-base-300/50 rounded-lg">
            <p className="font-semibold text-text-strong">Key Principle: Learning by Doing</p>
            <p className="text-sm">The best way to learn is to trade. Don't be afraid to experiment with different order types and strategies. Every trade, profitable or not, is a valuable lesson.</p>
        </div>
    </div>
);

const TradingBasicsContent: React.FC = () => (
    <div className="space-y-4">
        <h3 className="text-2xl font-bold text-primary">Core Trading Concepts</h3>
        <div>
            <h4 className="font-bold text-text-strong">Understanding Your Portfolio</h4>
            <ul className="list-disc list-inside space-y-2 mt-2 text-base-content">
                <li><strong>Available Cash:</strong> The money you can use to place new buy orders immediately.</li>
                <li><strong>Unsettled Cash:</strong> Proceeds from stock sales. This simulates the real-world **T+2 Settlement** system, where cash from a sale takes two business days to become available for withdrawal or trading. In our simulator, this happens gradually over time.</li>
                <li><strong>Holdings Value:</strong> The total current market value of all the stocks you own.</li>
                <li><strong>Total Portfolio Value:</strong> The sum of your cash (both available and unsettled) and your holdings value. This is the ultimate measure of your performance.</li>
            </ul>
        </div>
        <div>
            <h4 className="font-bold text-text-strong">Market Sentiment</h4>
            <p>The market sentiment (Bullish, Neutral, Bearish) influences the general direction of stock prices in the simulation. A Bullish market will see a slight upward trend on average, while a Bearish market will see a slight downward trend.</p>
        </div>
    </div>
);

const OrderTypesContent: React.FC = () => (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold text-primary">Mastering Order Types</h3>
        <div className="p-4 border-l-4 border-info rounded-r-lg bg-info/10">
            <h4 className="font-bold text-text-strong">Market Order</h4>
            <p>This is the most basic order type. It executes a trade immediately at the best available current price. It's fast and guarantees execution, but the final price might be slightly different from what you saw when you placed the order (this is called "slippage").</p>
            <p className="text-sm mt-2"><strong>Best for:</strong> When you want to get in or out of a stock quickly and are willing to accept the current market price.</p>
        </div>
        <div className="p-4 border-l-4 border-secondary rounded-r-lg bg-secondary/10">
            <h4 className="font-bold text-text-strong">Limit Order</h4>
            <p>A Limit Order gives you price control. You set a specific price at which you are willing to buy or sell.</p>
            <ul className="list-disc list-inside text-sm mt-2">
                <li>A **Buy Limit Order** will only execute at your limit price or lower.</li>
                <li>A **Sell Limit Order** will only execute at your limit price or higher.</li>
            </ul>
            <p className="text-sm mt-2"><strong>Best for:</strong> When you have a specific target price in mind and are not in a hurry to trade. It protects you from paying more than you want or selling for less.</p>
        </div>
        <div className="p-4 border-l-4 border-accent rounded-r-lg bg-accent/10">
            <h4 className="font-bold text-text-strong">Trailing Stop Order (for Sells)</h4>
            <p>This is an advanced order to protect profits. You set a "trail percentage" below the market price. The order creates a moving "trigger price" that follows the stock up.</p>
            <p className="text-sm mt-2">If the stock price drops and hits your trigger price, it automatically becomes a Market Order to sell your shares. This helps you lock in gains if the stock reverses, while still allowing for further upside.</p>
            <p className="text-sm mt-2"><strong>Best for:</strong> Protecting profits on a stock that has performed well, without having to watch it constantly.</p>
        </div>
    </div>
);

const PlatformFeaturesContent: React.FC = () => (
     <div className="space-y-4">
        <h3 className="text-2xl font-bold text-primary">Platform Features</h3>
        <div>
            <h4 className="font-bold text-text-strong">AI Analyst</h4>
            <p>Use the AI Analyst in the 'Trade' tab to get instant insights on any stock. It provides a concise analysis, a recommendation (Buy, Sell, or Hold), and a risk assessment based on the simulated data. You can also ask follow-up questions to dig deeper.</p>
        </div>
         <div>
            <h4 className="font-bold text-text-strong">Active Orders vs. History</h4>
            <p>The **'Orders' tab** shows all your pending orders that have not yet been executed (e.g., a Limit order waiting for its price target). You can cancel these orders at any time. The **'History' tab** is a permanent log of all your completed, cancelled, or expired orders.</p>
        </div>
        <div>
            <h4 className="font-bold text-text-strong">Market Movers & News</h4>
            <p>The dashboard provides a quick look at the top gaining and losing stocks for the current session, along with a feed of fictional news headlines that can influence market sentiment and stock trends.</p>
        </div>
    </div>
);

const GuideModal: React.FC<GuideModalProps> = ({ isVisible, onClose }) => {
    const [activeTab, setActiveTab] = useState(TABS[0]);

    if (!isVisible) return null;
    
    const renderContent = () => {
        switch (activeTab) {
            case "Welcome": return <WelcomeContent />;
            case "Trading Basics": return <TradingBasicsContent />;
            case "Order Types": return <OrderTypesContent />;
            case "Platform Features": return <PlatformFeaturesContent />;
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-base-100 rounded-2xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col shadow-2xl border border-base-300/50">
                <header className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
                    <h2 className="text-xl font-bold text-text-strong">Simulator Guide</h2>
                    <Button variant="ghost" className="!p-2" onClick={onClose} aria-label="Close guide">
                        <XMarkIcon className="w-6 h-6"/>
                    </Button>
                </header>
                <div className="flex-grow flex flex-col md:flex-row min-h-0">
                    <nav className="flex md:flex-col p-4 border-b md:border-b-0 md:border-r border-base-300 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-y-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full text-left text-sm font-semibold p-2 rounded-md transition-colors duration-200 shrink-0 md:shrink ${activeTab === tab ? 'bg-primary text-white' : 'hover:bg-base-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                    <main className="flex-grow p-6 overflow-y-auto">
                        <div key={activeTab} className="animate-fade-in">
                             {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default GuideModal;