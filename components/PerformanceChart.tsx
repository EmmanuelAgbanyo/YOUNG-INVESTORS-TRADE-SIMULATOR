import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PerformanceHistoryEntry } from '../types.ts';

interface PerformanceChartProps {
    history: PerformanceHistoryEntry[];
    startingCapital: number;
}

interface TooltipState {
    x: number;
    y: number;
    value: number;
    pnl: number;
    pnlPct: number;
    timestamp: number;
    svgX: number;
}

const RANGES = ['All', '1H', '30M', '15M'] as const;
type Range = typeof RANGES[number];

const GHS = (v: number) =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const GHS2 = (v: number) =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const PerformanceChart: React.FC<PerformanceChartProps> = ({ history, startingCapital }) => {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [activeRange, setActiveRange] = useState<Range>('All');
    const svgRef = useRef<SVGSVGElement>(null);

    // ── filter history by range ──
    const filteredHistory = useMemo(() => {
        if (!history.length) return [];
        const now = Date.now();
        const cutoffs: Record<Range, number> = {
            All: 0,
            '1H': now - 60 * 60 * 1000,
            '30M': now - 30 * 60 * 1000,
            '15M': now - 15 * 60 * 1000,
        };
        const cut = cutoffs[activeRange];
        const filtered = cut ? history.filter(h => h.timestamp >= cut) : history;
        return filtered.length >= 2 ? filtered : history;
    }, [history, activeRange]);

    // ── KPI stats ──
    const stats = useMemo(() => {
        if (filteredHistory.length < 2) return null;
        const first = filteredHistory[0].portfolioValue;
        const last = filteredHistory[filteredHistory.length - 1].portfolioValue;
        const peak = Math.max(...filteredHistory.map(h => h.portfolioValue));
        const trough = Math.min(...filteredHistory.map(h => h.portfolioValue));
        const pnl = last - startingCapital;
        const pnlPct = (pnl / startingCapital) * 100;
        const rangePnl = last - first;
        const rangePnlPct = ((last - first) / first) * 100;
        const isUp = last >= startingCapital;
        return { first, last, peak, trough, pnl, pnlPct, rangePnl, rangePnlPct, isUp };
    }, [filteredHistory, startingCapital]);

    // ── SVG geometry ──
    const W = 800, H = 280;
    const PAD = { top: 24, right: 24, bottom: 40, left: 72 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    const { linePath, areaPath, yLines, xLabels, dataPoints, breakY } = useMemo(() => {
        const empty = { linePath: '', areaPath: '', yLines: [], xLabels: [], dataPoints: [], breakY: PAD.top + cH / 2 };
        if (filteredHistory.length < 2) return empty;

        const vals = filteredHistory.map(h => h.portfolioValue);
        const allVals = [...vals, startingCapital];
        const minV = Math.min(...allVals) * 0.985;
        const maxV = Math.max(...allVals) * 1.015;
        const vRange = maxV - minV || 1;
        const n = filteredHistory.length;

        const xS = (i: number) => PAD.left + (i / (n - 1)) * cW;
        const yS = (v: number) => PAD.top + cH - ((v - minV) / vRange) * cH;

        // smooth bezier path
        const pts = filteredHistory.map((h, i) => ({ x: xS(i), y: yS(h.portfolioValue) }));
        const d = pts.reduce((acc, p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = pts[i - 1];
            const cpx = (prev.x + p.x) / 2;
            return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
        }, '');

        const bottom = PAD.top + cH;
        const areaD = `${d} L ${xS(n - 1)} ${bottom} L ${xS(0)} ${bottom} Z`;

        // y-grid — 6 levels
        const numY = 6;
        const yLines = Array.from({ length: numY }, (_, i) => {
            const v = minV + (vRange / (numY - 1)) * i;
            return { v, y: yS(v) };
        });

        // x time labels — up to 6
        const numX = Math.min(6, n);
        const step = Math.floor((n - 1) / (numX - 1)) || 1;
        const xLabels = Array.from({ length: numX }, (_, i) => {
            const idx = Math.min(i * step, n - 1);
            return { x: xS(idx), t: filteredHistory[idx].timestamp };
        });

        const dataPoints = filteredHistory.map((h, i) => ({ x: xS(i), y: yS(h.portfolioValue), portfolioValue: h.portfolioValue, timestamp: h.timestamp }));
        const breakY = yS(startingCapital);
        const breakOffset = Math.max(0, Math.min(1, (breakY - PAD.top) / cH));

        return { linePath: d, areaPath: areaD, yLines, xLabels, dataPoints, breakY, breakOffset };
    }, [filteredHistory, startingCapital]);

    // ── crosshair mouse handling ──
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!dataPoints.length || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = W / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;

        let closest = dataPoints[0];
        let minDist = Math.abs(dataPoints[0].x - mouseX);
        for (const p of dataPoints) {
            const d = Math.abs(p.x - mouseX);
            if (d < minDist) { minDist = d; closest = p; }
        }

        const pnl = closest.portfolioValue - startingCapital;
        const pnlPct = (pnl / startingCapital) * 100;
        setTooltip({
            x: closest.x, y: closest.y, value: closest.portfolioValue,
            pnl, pnlPct, timestamp: closest.timestamp, svgX: closest.x / W,
        });
    }, [dataPoints, startingCapital]);

    const isUp = stats?.isUp ?? true;
    const lineColor = isUp ? '#10b981' : '#f43f5e';
    const gradStartColor = isUp ? '#10b981' : '#f43f5e';
    const gradEndColor = isUp ? '#6ee7b7' : '#fca5a5';

    // ── empty state ──
    if (!stats) {
        return (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] shadow-2xl p-10 flex flex-col items-center justify-center min-h-[340px] text-center space-y-6">
                <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20"
                >
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                </motion.div>
                <div>
                    <h3 className="text-xl font-black text-text-strong tracking-tighter">Performance Chart</h3>
                    <p className="text-sm text-slate-400 mt-2 max-w-xs">Start trading to see your portfolio performance charted in real-time.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
            {/* ── Header ── */}
            <div className="px-8 pt-8 pb-0">
                <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shadow-lg ${isUp ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/20'}`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-text-strong tracking-tighter leading-none">Performance Trend</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1.5">Portfolio Value Over Time</p>
                        </div>
                    </div>

                    {/* Range pills */}
                    <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50">
                        {RANGES.map(r => (
                            <button
                                key={r}
                                onClick={() => setActiveRange(r)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeRange === r
                                    ? 'bg-white dark:bg-slate-700 text-text-strong shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI Bar ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Net Worth', value: GHS2(stats.last), color: 'text-text-strong' },
                        {
                            label: 'Total Return',
                            value: `${stats.pnl >= 0 ? '+' : ''}${stats.pnlPct.toFixed(2)}%`,
                            sub: `${stats.pnl >= 0 ? '+' : ''}${GHS2(stats.pnl)}`,
                            color: stats.isUp ? 'text-emerald-500' : 'text-rose-500',
                        },
                        { label: 'Session High', value: GHS(stats.peak), color: 'text-emerald-500' },
                        { label: 'Session Low', value: GHS(stats.trough), color: 'text-rose-500' },
                    ].map(({ label, value, sub, color }) => (
                        <div key={label} className="px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/40">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                            <p className={`text-base font-black tracking-tighter leading-none ${color}`}>{value}</p>
                            {sub && <p className={`text-[10px] font-bold mt-1 ${color} opacity-70`}>{sub}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── SVG Chart ── */}
            <div className="relative px-0 pb-0">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'crosshair' }}
                >
                    <defs>
                        {/* Area gradient */}
                        <linearGradient id="perfAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradStartColor} stopOpacity={0.35} />
                            <stop offset="60%" stopColor={gradStartColor} stopOpacity={0.08} />
                            <stop offset="100%" stopColor={gradEndColor} stopOpacity={0.01} />
                        </linearGradient>
                        {/* Line glow */}
                        <filter id="lineGlow" x="-20%" y="-100%" width="140%" height="300%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Dot glow */}
                        <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Clip chart area */}
                        <clipPath id="chartClip">
                            <rect x={PAD.left} y={PAD.top} width={cW} height={cH} />
                        </clipPath>
                    </defs>

                    {/* Y-axis grid + labels */}
                    {yLines.map(({ v, y }, i) => (
                        <g key={i}>
                            <line
                                x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                                stroke="currentColor" className="text-slate-200 dark:text-slate-800"
                                strokeWidth={i === 0 ? 0.5 : 0.5} strokeDasharray={i === 0 ? '0' : '3 6'}
                            />
                            <text x={PAD.left - 10} y={y + 4} textAnchor="end" fontSize="10" className="fill-slate-400 dark:fill-slate-500 font-mono font-bold">
                                {GHS(v).replace('GH₵', '').replace('GHS', '').trim()}
                            </text>
                        </g>
                    ))}

                    {/* X-axis time labels */}
                    {xLabels.map(({ x, t }, i) => (
                        <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="10" className="fill-slate-400 dark:fill-slate-500 font-mono">
                            {new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </text>
                    ))}

                    {/* Break-even dashed line */}
                    {breakY > PAD.top && breakY < PAD.top + cH && (
                        <g>
                            <line
                                x1={PAD.left} y1={breakY} x2={W - PAD.right} y2={breakY}
                                stroke="#94a3b8" strokeWidth={1} strokeDasharray="6 5" opacity={0.6}
                            />
                            <text x={PAD.left + 6} y={breakY - 5} fontSize="9" className="fill-slate-400 dark:fill-slate-500 font-bold uppercase tracking-widest">
                                Break-even
                            </text>
                        </g>
                    )}

                    {/* Gradient area fill (clipped) */}
                    <g clipPath="url(#chartClip)">
                        <motion.path
                            d={areaPath}
                            fill="url(#perfAreaGrad)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                        />
                    </g>

                    {/* Main trend line — animated draw */}
                    <g clipPath="url(#chartClip)">
                        <motion.path
                            d={linePath}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#lineGlow)"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.4, ease: 'easeOut' }}
                        />
                    </g>

                    {/* Crosshair + dot */}
                    <AnimatePresence>
                        {tooltip && (
                            <g className="pointer-events-none">
                                {/* Vertical line */}
                                <motion.line
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + cH}
                                    stroke={lineColor} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7}
                                />
                                {/* Horizontal line */}
                                <motion.line
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    x1={PAD.left} y1={tooltip.y} x2={W - PAD.right} y2={tooltip.y}
                                    stroke={lineColor} strokeWidth={1} strokeDasharray="4 4" opacity={0.4}
                                />
                                {/* Glow dot */}
                                <motion.circle
                                    initial={{ r: 0, opacity: 0 }} animate={{ r: 8, opacity: 0.25 }} exit={{ r: 0, opacity: 0 }}
                                    cx={tooltip.x} cy={tooltip.y} fill={lineColor}
                                    filter="url(#dotGlow)"
                                />
                                {/* Hard dot */}
                                <motion.circle
                                    initial={{ r: 0 }} animate={{ r: 5 }} exit={{ r: 0 }}
                                    cx={tooltip.x} cy={tooltip.y} fill={lineColor}
                                    stroke="white" strokeWidth={2.5}
                                />
                                {/* Price tag on Y axis */}
                                <rect x={0} y={tooltip.y - 10} width={PAD.left - 4} height={20} rx={6} fill={lineColor} opacity={0.9} />
                                <text x={PAD.left - 10} y={tooltip.y + 4} textAnchor="end" fontSize="9" fill="white" fontWeight="800">
                                    {GHS(tooltip.value).replace('GH₵', '').replace('GHS', '').trim()}
                                </text>
                            </g>
                        )}
                    </AnimatePresence>
                </svg>

                {/* Floating tooltip card */}
                <AnimatePresence>
                    {tooltip && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-4 pointer-events-none z-50"
                            style={{ left: tooltip.svgX > 0.55 ? undefined : '54%', right: tooltip.svgX > 0.55 ? '4%' : undefined }}
                        >
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-slate-700/60 rounded-2xl shadow-2xl p-5 min-w-[180px]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">
                                    {new Date(tooltip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                                <p className="text-2xl font-black text-text-strong tracking-tighter leading-none mb-3">{GHS2(tooltip.value)}</p>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${tooltip.pnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                                    <svg className={`w-3 h-3 ${tooltip.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500 rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                                    </svg>
                                    <span className={`text-xs font-black ${tooltip.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tooltip.pnl >= 0 ? '+' : ''}{GHS2(tooltip.pnl)} ({tooltip.pnlPct >= 0 ? '+' : ''}{tooltip.pnlPct.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default PerformanceChart;