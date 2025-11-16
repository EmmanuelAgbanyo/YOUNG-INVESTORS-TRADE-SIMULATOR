import React, { useState, useMemo } from 'react';
import Card from './ui/Card.tsx';
import EmptyState from './ui/EmptyState.tsx';
import type { PerformanceHistoryEntry } from '../types.ts';

const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

interface PerformanceChartProps {
  history: PerformanceHistoryEntry[];
  startingCapital: number;
}

interface TooltipData {
    x: number;
    y: number;
    value: number;
    pnl: number;
    timestamp: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ history, startingCapital }) => {
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const chartConfig = {
        width: 500,
        height: 250,
        padding: { top: 10, right: 10, bottom: 20, left: 50 },
    };

    // FIX: Calculated 'startingCapitalY' inside the memoized callback and returned it to resolve the scope issue.
    const { linePath, areaPath, minVal, maxVal, breakEvenOffset, yAxisLabels, dataPoints, startingCapitalY } = useMemo(() => {
        const { width, height, padding } = chartConfig;
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        if (history.length < 2) return { linePath: '', areaPath: '', minVal: 0, maxVal: 0, breakEvenOffset: 0.5, yAxisLabels: [], dataPoints: [], startingCapitalY: chartHeight / 2 };
        
        const values = history.map(h => h.portfolioValue);
        const minDataVal = Math.min(...values, startingCapital) * 0.98;
        const maxDataVal = Math.max(...values, startingCapital) * 1.02;
        const valRange = maxDataVal - minDataVal || 1;

        const xScale = (index: number) => padding.left + (index / (history.length - 1)) * chartWidth;
        const yScale = (value: number) => padding.top + chartHeight - ((value - minDataVal) / valRange) * chartHeight;

        const points = history.map((h, i) => `${xScale(i)},${yScale(h.portfolioValue)}`).join(' ');
        const linePath = `M${points.split(' ')[0]} L${points}`;

        const areaPoints = `${xScale(0)},${height - padding.bottom} ${points} ${xScale(history.length - 1)},${height - padding.bottom}`;
        const areaPath = `M${areaPoints}`;

        const calculatedStartingCapitalY = yScale(startingCapital);
        const breakEvenLineY = calculatedStartingCapitalY;
        const breakEvenOffset = (breakEvenLineY - padding.top) / chartHeight;
        
        const numLabels = 5;
        const yAxisLabels = Array.from({ length: numLabels }, (_, i) => {
            const value = minDataVal + (valRange / (numLabels - 1)) * i;
            return { value, y: yScale(value) };
        });

        const dataPoints = history.map((h, i) => ({
            ...h,
            x: xScale(i),
            y: yScale(h.portfolioValue),
        }));

        return { linePath, areaPath, minVal: minDataVal, maxVal: maxDataVal, breakEvenOffset, yAxisLabels, dataPoints, startingCapitalY: calculatedStartingCapitalY };
    }, [history, startingCapital, chartConfig]);


    // FIX: Replaced incorrect handler logic and updated the event type to 'SVGSVGElement' to match the element it's attached to.
    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!dataPoints.length) return;
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        
        const closestPoint = dataPoints.reduce((closest, point) => {
             const dist = Math.abs(point.x - mouseX);
             return dist < Math.abs(closest.x - mouseX) ? point : closest;
        });

        setTooltipData({
            x: closestPoint.x,
            y: closestPoint.y,
            value: closestPoint.portfolioValue,
            pnl: closestPoint.portfolioValue - startingCapital,
            timestamp: closestPoint.timestamp,
        });
    };

    if (history.length < 2) {
        return (
            <Card className="h-full">
                <EmptyState
                    icon={<ChartBarIcon className="w-12 h-12" />}
                    title="Performance History"
                    message="Your portfolio performance will be charted here as the market changes."
                />
            </Card>
        );
    }

    return (
        <Card>
            <h3 className="text-xl font-bold text-text-strong mb-4">Performance Over Time</h3>
            <div className="relative">
                <svg viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`} className="w-full h-auto" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltipData(null)}>
                    <defs>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(var(--success))" />
                            <stop offset={breakEvenOffset} stopColor="rgb(var(--success))" />
                            <stop offset={breakEvenOffset} stopColor="rgb(var(--error))" />
                            <stop offset="100%" stopColor="rgb(var(--error))" />
                        </linearGradient>
                         <mask id="areaMask">
                             <path d={areaPath} fill="white" />
                         </mask>
                    </defs>

                    {/* Y-Axis Grid Lines & Labels */}
                    {yAxisLabels.map((label, i) => (
                        <g key={i}>
                             <line x1={chartConfig.padding.left} y1={label.y} x2={chartConfig.width - chartConfig.padding.right} y2={label.y} stroke="rgb(var(--base-300))" strokeWidth="0.5" />
                             <text x={chartConfig.padding.left - 8} y={label.y + 4} textAnchor="end" fontSize="10" fill="rgb(var(--base-content))" className="font-mono">{formatter.format(label.value).replace('GHS', '')}</text>
                        </g>
                    ))}
                    
                    {/* Gradient Fill */}
                    <rect x={chartConfig.padding.left} y={chartConfig.padding.top} width={chartConfig.width - chartConfig.padding.left - chartConfig.padding.right} height={chartConfig.height - chartConfig.padding.top - chartConfig.padding.bottom} fill="url(#pnlGradient)" mask="url(#areaMask)" opacity={0.2} />

                    {/* Starting Capital Line */}
                    {/* FIX: Used 'startingCapitalY' from useMemo to prevent 'yScale' not defined error. */}
                    <line x1={chartConfig.padding.left} y1={startingCapitalY} x2={chartConfig.width - chartConfig.padding.right} y2={startingCapitalY} stroke="rgb(var(--base-content))" strokeWidth="1" strokeDasharray="3 3" opacity="0.7"/>

                    {/* Main Value Line */}
                    <path d={linePath} fill="none" stroke="rgb(var(--primary))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    
                    {/* Tooltip Indicator */}
                    {tooltipData && (
                        <g className="pointer-events-none">
                            <line x1={tooltipData.x} y1={chartConfig.padding.top} x2={tooltipData.x} y2={chartConfig.height - chartConfig.padding.bottom} stroke="rgb(var(--primary))" strokeWidth="1" />
                            <circle cx={tooltipData.x} cy={tooltipData.y} r="4" fill="rgb(var(--base-100))" stroke="rgb(var(--primary))" strokeWidth="2" />
                        </g>
                    )}
                </svg>
                {tooltipData && (
                    <div className="absolute p-2 text-xs rounded-md bg-base-300/80 backdrop-blur-sm border border-base-content/20 pointer-events-none transition-all" style={{ left: tooltipData.x, top: chartConfig.padding.top, transform: `translateX(${tooltipData.x > chartConfig.width / 2 ? '-110%' : '10%'})` }}>
                       <div className="font-mono text-center">
                            <p className="font-bold text-text-strong">{formatter.format(tooltipData.value)}</p>
                            <p className={tooltipData.pnl >= 0 ? 'text-success' : 'text-error'}>{formatter.format(tooltipData.pnl)}</p>
                            <p className="text-base-content/70">{new Date(tooltipData.timestamp).toLocaleTimeString()}</p>
                       </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default PerformanceChart;