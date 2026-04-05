


import React, { useState } from 'react';
import type { Stock, Message, OHLC, MarketStatus } from '../types.ts';
import Card from './ui/Card.tsx';
import AIAnalystTerminal from './AIAnalystTerminal.tsx';

interface AnalystSession {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

interface StockChartViewProps {
    stock: Stock | null;
    analystSession: AnalystSession;
    onStartAnalysis: (stock: Stock) => void;
    onSendMessage: (symbol: string, message: string) => void;
    marketStatus?: MarketStatus;
}

interface TooltipData {
    ohlc: OHLC;
    x: number;
    y: number;
}

const ChartLineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12a2.25 2.25 0 01-2.25-2.25V3.75m16.5 0v16.5M3.75 14.25v2.25" />
    </svg>
);


const StockChartView: React.FC<StockChartViewProps> = ({ stock, analystSession, onStartAnalysis, onSendMessage, marketStatus = 'OPEN' }) => {
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    if (!stock) {
        return (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] p-12 shadow-2xl flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700/50 shadow-inner">
                    <ChartLineIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-text-strong tracking-tighter uppercase">Stock Chart</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto leading-relaxed">Select a stock from the Trade panel to view its chart and AI analysis.</p>
                </div>
            </div>
        );
    }

    const { priceHistory = [], price, lastPrice = price } = stock;
    const priceChange = price - lastPrice;
    const percentChange = lastPrice > 0 ? (priceChange / lastPrice) * 100 : 0;
    const isPositive = priceChange >= 0;

    const colorClass = isPositive ? 'text-emerald-500' : 'text-rose-500';
    const bgColorClass = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10';
    const strokeColor = isPositive ? '#10b981' : '#f43f5e';

    // Chart dimensions
    const width = 600;
    const height = 240;
    const padding = 30;

    const allPrices = priceHistory.length > 0 ? priceHistory.flatMap(p => [p.high, p.low]) : [price, price];
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = (width - 2 * padding) / Math.max(priceHistory.length, 1);

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;

        const index = Math.floor((x - padding) / (candleWidth || 1));

        if (index >= 0 && index < priceHistory.length) {
            const ohlc = priceHistory[index];
            const candleX = padding + index * candleWidth + candleWidth / 2;
            const y = event.clientY - rect.top;
            setTooltipData({ ohlc, x: candleX, y: y });
        } else {
            setTooltipData(null);
        }
    };

    const handleMouseLeave = () => {
        setTooltipData(null);
    };

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] p-1 shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="p-8 pb-4">
                <div className="flex flex-wrap justify-between items-start mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-lg bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest leading-none">Stock Chart</span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${marketStatus === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{marketStatus}</span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-text-strong tracking-tighter leading-none">{stock.name} <span className="text-slate-400 font-bold ml-2">({stock.symbol})</span></h3>
                    </div>
                    <div className="text-right">
                        <p className={`text-4xl font-black font-mono tracking-tighter leading-none ${colorClass}`}>{price.toFixed(2)}</p>
                        <p className={`text-sm font-black font-mono mt-3 ${colorClass}`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
                        </p>
                    </div>
                </div>

                <div className="w-full h-auto mb-8 relative group/chart bg-slate-50/30 dark:bg-slate-900/30 rounded-[2rem] p-6 border border-slate-100/50 dark:border-slate-800/50 shadow-inner">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <filter id="candle-glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="glow" />
                                <feComposite in="glow" in2="SourceGraphic" operator="over" />
                            </filter>
                        </defs>
                        
                        {/* Grid Lines */}
                        {[0, 1, 2, 3, 4].map(i => (
                            <line 
                              key={i}
                              x1={padding} y1={padding + (height - 2 * padding) * (i / 4)}
                              x2={width - padding} y2={padding + (height - 2 * padding) * (i / 4)}
                              stroke="currentColor" className="text-slate-200 dark:text-slate-800 opacity-30"
                              strokeWidth="1"
                            />
                        ))}

                        {priceHistory.map((ohlc, i) => {
                            const x = padding + i * candleWidth;
                            const yOpen = height - padding - ((ohlc.open - minPrice) / priceRange * (height - 2 * padding));
                            const yClose = height - padding - ((ohlc.close - minPrice) / priceRange * (height - 2 * padding));
                            const yHigh = height - padding - ((ohlc.high - minPrice) / priceRange * (height - 2 * padding));
                            const yLow = height - padding - ((ohlc.low - minPrice) / priceRange * (height - 2 * padding));

                            const isGain = ohlc.close >= ohlc.open;
                            const candleColor = isGain ? '#10b981' : '#f43f5e';

                            return (
                                <g key={i} className="transition-all duration-300 hover:opacity-80 cursor-crosshair group/candle">
                                    <line 
                                      x1={x + candleWidth / 2} y1={yHigh} 
                                      x2={x + candleWidth / 2} y2={yLow} 
                                      stroke={candleColor} strokeWidth="1.5" 
                                    />
                                    <rect
                                        x={x + (candleWidth * 0.15)}
                                        y={Math.min(yOpen, yClose)}
                                        width={candleWidth * 0.7}
                                        height={Math.max(1, Math.abs(yOpen - yClose))}
                                        fill={candleColor}
                                        className="group-hover/candle:filter group-hover/candle:brightness-125"
                                        rx="2"
                                    />
                                </g>
                            );
                        })}

                        {tooltipData && (
                            <g className="pointer-events-none transition-all duration-100 ease-out">
                                <line
                                    x1={tooltipData.x} y1={padding}
                                    x2={tooltipData.x} y2={height - padding}
                                    stroke="currentColor" className="text-blue-500/30"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                                <circle cx={tooltipData.x} cy={tooltipData.y} r="4" fill="#3b82f6" className="shadow-lg" />
                            </g>
                        )}

                        <rect
                            x="0" y="0" width={width} height={height}
                            fill="transparent"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        />
                    </svg>

                    {tooltipData && (
                        <div
                            className="absolute p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-blue-500/20 shadow-2xl pointer-events-none transition-all duration-100 ease-out z-50"
                            style={{
                                left: tooltipData.x + 20,
                                top: 20,
                                transform: `translateX(${tooltipData.x > width / 2 ? 'calc(-100% - 40px)' : '0'})`,
                            }}
                        >
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-text-strong font-black">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Open:</span> <span className="text-right text-sm">{tooltipData.ohlc.open.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">High:</span> <span className="text-right text-sm text-emerald-500">{tooltipData.ohlc.high.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Low:</span> <span className="text-right text-sm text-rose-500">{tooltipData.ohlc.low.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Close:</span> <span className="text-right text-sm text-blue-600">{tooltipData.ohlc.close.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div id="ai-analyst-view" className="mt-auto border-t border-slate-100 dark:border-slate-800/50">
                <AIAnalystTerminal
                    stock={stock}
                    session={analystSession}
                    onStartAnalysis={onStartAnalysis}
                    onSendMessage={onSendMessage}
                />
            </div>
        </div>
    );
};

export default StockChartView;