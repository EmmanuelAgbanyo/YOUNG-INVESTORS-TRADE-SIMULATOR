


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
            <Card className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-base-content/70">
                    <ChartLineIcon className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-strong">Stock Analysis</h3>
                    <p>Select a stock in the trade form to view its chart and AI analysis.</p>
                </div>
            </Card>
        );
    }

    const { priceHistory, price, lastPrice = price } = stock;
    const priceChange = price - lastPrice;
    const percentChange = lastPrice > 0 ? (priceChange / lastPrice) * 100 : 0;
    const isPositive = priceChange >= 0;

    const successColorRGB = 'var(--success)';
    const errorColorRGB = 'var(--error)';
    const color = isPositive ? successColorRGB : errorColorRGB;

    // Chart dimensions
    const width = 500;
    const height = 200;
    const padding = 20;

    const allPrices = priceHistory.flatMap(p => [p.high, p.low]);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = (width - 2 * padding) / (priceHistory.length || 1);

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;

        const index = Math.floor((x - padding) / candleWidth);

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

    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

    return (
        <Card>
            <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-text-strong">{stock.name} ({stock.symbol})</h3>
                    <p className={`font-semibold text-sm ${marketStatus === 'OPEN' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {marketStatus === 'OPEN' ? 'Live Price Chart' : 'Closing Price Chart'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-mono font-bold" style={{ color: `rgb(${color})` }}>{price.toFixed(2)}</p>
                    <p className="font-mono font-semibold" style={{ color: `rgb(${color})` }}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
                    </p>
                </div>
            </div>

            <div className="w-full h-auto mb-6 relative group/chart">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-lg" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <filter id="candle-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {priceHistory.map((ohlc, i) => {
                        const x = padding + i * candleWidth;
                        const yOpen = height - padding - ((ohlc.open - minPrice) / priceRange * (height - 2 * padding));
                        const yClose = height - padding - ((ohlc.close - minPrice) / priceRange * (height - 2 * padding));
                        const yHigh = height - padding - ((ohlc.high - minPrice) / priceRange * (height - 2 * padding));
                        const yLow = height - padding - ((ohlc.low - minPrice) / priceRange * (height - 2 * padding));

                        const isGain = ohlc.close >= ohlc.open;

                        return (
                            <g key={i} filter="url(#candle-glow)" className="transition-all duration-300 hover:opacity-80 cursor-crosshair">
                                <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={isGain ? `rgb(${successColorRGB})` : `rgb(${errorColorRGB})`} strokeWidth="1.5" />
                                <rect
                                    x={x + 2}
                                    y={Math.min(yOpen, yClose)}
                                    width={candleWidth - 4}
                                    height={Math.abs(yOpen - yClose) || 0.5}
                                    fill={isGain ? `rgb(${successColorRGB})` : `rgb(${errorColorRGB})`}
                                    rx="1"
                                />
                            </g>
                        );
                    })}

                    {tooltipData && (
                        <g className="pointer-events-none transition-all duration-100 ease-out">
                            <line
                                x1={tooltipData.x} y1={padding}
                                x2={tooltipData.x} y2={height - padding}
                                stroke="currentColor" className="text-slate-400 dark:text-slate-500"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
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
                        className="absolute p-3 text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl pointer-events-none transition-all duration-100 ease-out z-50"
                        style={{
                            left: tooltipData.x + 10,
                            top: tooltipData.y - 40,
                            transform: `translateX(${tooltipData.x > width / 2 ? '-110%' : '10%'})`,
                        }}
                    >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-slate-800 dark:text-white font-bold">
                            <span className="text-slate-500 uppercase text-xs">Open:</span> <span className="text-right">{tooltipData.ohlc.open.toFixed(2)}</span>
                            <span className="text-slate-500 uppercase text-xs">High:</span> <span className="text-right text-emerald-500">{tooltipData.ohlc.high.toFixed(2)}</span>
                            <span className="text-slate-500 uppercase text-xs">Low:</span> <span className="text-right text-rose-500">{tooltipData.ohlc.low.toFixed(2)}</span>
                            <span className="text-slate-500 uppercase text-xs">Close:</span> <span className="text-right font-black">{tooltipData.ohlc.close.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div id="ai-analyst-view">
                <AIAnalystTerminal
                    stock={stock}
                    session={analystSession}
                    onStartAnalysis={onStartAnalysis}
                    onSendMessage={onSendMessage}
                />
            </div>
        </Card>
    );
};

export default StockChartView;