import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stock, Message, OHLC, MarketStatus } from '../types.ts';
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

interface CrosshairState {
    x: number;
    y: number;
    price: number;
    ohlc: OHLC;
    idx: number;
    svgFrac: number;
}

type ChartMode = 'LINE' | 'CANDLE';

// ── helpers ──────────────────────────────────────────────────────────────
const fmt2 = (v: number) => v.toFixed(2);
const fmtGHS = (v: number) => `GH₵${v.toFixed(2)}`;

// ── empty state ───────────────────────────────────────────────────────────
const EmptyChart: React.FC = () => (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] p-12 shadow-2xl flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
        <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20"
        >
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
        </motion.div>
        <div className="space-y-2">
            <h3 className="text-2xl font-black text-text-strong tracking-tighter">Stock Chart</h3>
            <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto leading-relaxed">
                Select a stock from the Trade panel to view its live trend chart and AI analysis.
            </p>
        </div>
    </div>
);

// ── main component ────────────────────────────────────────────────────────
const StockChartView: React.FC<StockChartViewProps> = ({
    stock, analystSession, onStartAnalysis, onSendMessage, marketStatus = 'OPEN',
}) => {
    const [crosshair, setCrosshair] = useState<CrosshairState | null>(null);
    const [mode, setMode] = useState<ChartMode>('LINE');
    const svgRef = useRef<SVGSVGElement>(null);

    // ── price data ──
    const { priceHistory = [], price, lastPrice = price } = stock ?? { price: 0, lastPrice: 0, priceHistory: [] };
    const priceChange = price - lastPrice;
    const pctChange = lastPrice > 0 ? (priceChange / lastPrice) * 100 : 0;
    const isUp = priceChange >= 0;
    const lineColor = isUp ? '#10b981' : '#f43f5e';
    const gradId = isUp ? 'upGrad' : 'downGrad';

    // ── compute all close-price points for line chart ──
    const closePrices = useMemo(() => {
        if (!priceHistory.length) return [price];
        return [...priceHistory.map(h => h.close), price];
    }, [priceHistory, price]);

    // ── SVG layout ──
    const W = 700, H = 260;
    const PAD = { top: 20, right: 20, bottom: 42, left: 70 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    const { linePath, areaPath, yLines, xLabels, pointMap, minP, maxP, candleSlots } = useMemo(() => {
        const empty = { linePath: '', areaPath: '', yLines: [], xLabels: [], pointMap: [], minP: 0, maxP: 0, candleSlots: [] as any[] };
        if (closePrices.length < 2) return empty;

        const n = closePrices.length;
        const allLow = priceHistory.length ? Math.min(...priceHistory.map(h => h.low), ...closePrices) : Math.min(...closePrices);
        const allHigh = priceHistory.length ? Math.max(...priceHistory.map(h => h.high), ...closePrices) : Math.max(...closePrices);
        const pad = (allHigh - allLow) * 0.08 || allLow * 0.02;
        const minP = allLow - pad;
        const maxP = allHigh + pad;
        const vRange = maxP - minP || 1;

        const xS = (i: number) => PAD.left + (i / (n - 1)) * cW;
        const yS = (v: number) => PAD.top + cH - ((v - minP) / vRange) * cH;

        // smooth bezier
        const pts = closePrices.map((v, i) => ({ x: xS(i), y: yS(v), v }));
        let d = '';
        pts.forEach((p, i) => {
            if (i === 0) { d = `M ${p.x} ${p.y}`; return; }
            const prev = pts[i - 1];
            const cpx = (prev.x + p.x) / 2;
            d += ` C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
        });

        const bot = PAD.top + cH;
        const areaPath = `${d} L ${xS(n - 1)} ${bot} L ${xS(0)} ${bot} Z`;

        // y grid
        const numY = 5;
        const yLines = Array.from({ length: numY }, (_, i) => {
            const v = minP + (vRange / (numY - 1)) * i;
            return { v, y: yS(v) };
        });

        // x labels (max 6, from priceHistory ticks)
        const numX = Math.min(6, priceHistory.length);
        const step = Math.max(1, Math.floor(priceHistory.length / numX));
        const xLabels = priceHistory
            .filter((_, i) => i % step === 0)
            .slice(0, numX)
            .map((_, i) => ({ x: xS(i * step), label: `T-${priceHistory.length - i * step}` }));

        // point map for crosshair
        const pointMap = pts.map((p, i) => ({
            x: p.x, y: p.y, price: p.v,
            ohlc: priceHistory[i] ?? { open: p.v, high: p.v, low: p.v, close: p.v },
        }));

        // candle slots
        const cn = priceHistory.length;
        const slotW = cn > 0 ? cW / cn : cW;
        const candleSlots = priceHistory.map((h, i) => {
            const cx = PAD.left + (i / cn) * cW + slotW / 2;
            const yO = yS(h.open), yC = yS(h.close), yH = yS(h.high), yL = yS(h.low);
            const isBull = h.close >= h.open;
            return { cx, yO, yC, yH, yL, isBull, w: slotW * 0.65 };
        });

        return { linePath: d, areaPath, yLines, xLabels, pointMap, minP, maxP, candleSlots };
    }, [closePrices, priceHistory]);

    // ── crosshair handler ──
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!pointMap.length || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = W / rect.width;
        const mx = (e.clientX - rect.left) * scaleX;

        let best = pointMap[0], bestDist = Math.abs(pointMap[0].x - mx), bestIdx = 0;
        pointMap.forEach((p, i) => {
            const d = Math.abs(p.x - mx);
            if (d < bestDist) { bestDist = d; best = p; bestIdx = i; }
        });

        setCrosshair({ x: best.x, y: best.y, price: best.price, ohlc: best.ohlc, idx: bestIdx, svgFrac: best.x / W });
    }, [pointMap]);

    // ── Session OHLC — must be computed unconditionally (hooks rules) ────────────
    // open  = earliest recorded open (price when market opened)
    // high  = session max across all ticks
    // low   = session min across all ticks
    // close = current live streaming price
    const sessionOHLC = useMemo(() => {
        if (!priceHistory.length) {
            return { open: price, high: price, low: price, close: price, change: 0, changePct: 0 };
        }
        const open  = priceHistory[0].open;
        const high  = Math.max(...priceHistory.map(h => h.high), price);
        const low   = Math.min(...priceHistory.map(h => h.low),  price);
        const close = price;
        const change = close - open;
        const changePct = open > 0 ? (change / open) * 100 : 0;
        return { open, high, low, close, change, changePct };
    }, [priceHistory, price]);

    if (!stock) return <EmptyChart />;

    const statusCfg = {
        OPEN: { label: 'Live', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        CLOSED: { label: 'Closed', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
        PRE_MARKET: { label: 'Pre-Market', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-500', bg: 'bg-amber-500/10' },
        HALTED: { label: 'Halted', dot: 'bg-rose-500 animate-pulse', text: 'text-rose-500', bg: 'bg-rose-500/10' },
    }[marketStatus] ?? { label: 'Unknown', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' };

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] shadow-2xl flex flex-col h-full overflow-hidden">

            {/* ── Header ── */}
            <div className="px-8 pt-8 pb-0">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-xl bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest">
                                {stock.symbol}
                            </span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl ${statusCfg.bg}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${statusCfg.text}`}>{statusCfg.label}</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-text-strong tracking-tighter leading-none">{stock.name}</h3>
                    </div>
                    <div className="text-right">
                        <p className={`text-4xl font-black font-mono tracking-tighter leading-none ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {fmt2(price)}
                        </p>
                        <p className={`text-sm font-black font-mono mt-2 flex items-center gap-1.5 justify-end ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <svg className={`w-3.5 h-3.5 ${isUp ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                            </svg>
                            {priceChange >= 0 ? '+' : ''}{fmt2(priceChange)} ({pctChange >= 0 ? '+' : ''}{fmt2(pctChange)}%)
                        </p>
                    </div>
                </div>

                {/* OHLC mini bar — REAL session-wide figures */}
                <div className="grid grid-cols-5 gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800/50">
                    {[
                        { l: 'Open',  v: fmt2(sessionOHLC.open),  c: 'text-text-strong' },
                        { l: 'High',  v: fmt2(sessionOHLC.high),  c: 'text-emerald-500' },
                        { l: 'Low',   v: fmt2(sessionOHLC.low),   c: 'text-rose-500'    },
                        { l: 'Close', v: fmt2(sessionOHLC.close), c: 'text-blue-500'    },
                        {
                            l: 'Change',
                            v: `${sessionOHLC.change >= 0 ? '+' : ''}${fmt2(sessionOHLC.change)} (${sessionOHLC.changePct >= 0 ? '+' : ''}${fmt2(sessionOHLC.changePct)}%)`,
                            c: sessionOHLC.change >= 0 ? 'text-emerald-500' : 'text-rose-500',
                        },
                    ].map(({ l, v, c }) => (
                        <div key={l} className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{l}</p>
                            <p className={`text-xs font-black font-mono leading-tight ${c}`}>{v}</p>
                        </div>
                    ))}
                </div>

                {/* Chart mode toggle */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                        {priceHistory.length} ticks recorded
                    </p>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50">
                        {(['LINE', 'CANDLE'] as ChartMode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === m ? 'bg-white dark:bg-slate-700 text-text-strong shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                {m === 'LINE' ? '📈 Line' : '🕯 Candle'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SVG Chart ── */}
            <div className="relative mx-6 mb-4 bg-slate-50/30 dark:bg-slate-900/30 rounded-[1.5rem] border border-slate-100/50 dark:border-slate-800/50 overflow-hidden">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto"
                    style={{ cursor: 'crosshair' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setCrosshair(null)}
                >
                    <defs>
                        <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="70%" stopColor="#10b981" stopOpacity={0.04} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="70%" stopColor="#f43f5e" stopOpacity={0.04} />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <filter id="stockLineGlow" x="-20%" y="-100%" width="140%" height="300%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="stockDotGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <clipPath id="stockClip">
                            <rect x={PAD.left} y={PAD.top} width={cW} height={cH} />
                        </clipPath>
                    </defs>

                    {/* Y axis grid */}
                    {yLines.map(({ v, y }, i) => (
                        <g key={i}>
                            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                                stroke="currentColor" className="text-slate-200 dark:text-slate-800"
                                strokeWidth={0.5} strokeDasharray={i === 0 ? '0' : '3 5'} />
                            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" className="fill-slate-400 dark:fill-slate-500 font-mono font-bold">
                                {fmt2(v)}
                            </text>
                        </g>
                    ))}

                    {/* X axis labels */}
                    {xLabels.map(({ x, label }, i) => (
                        <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" className="fill-slate-400 dark:fill-slate-500 font-mono">
                            {label}
                        </text>
                    ))}

                    {/* ── LINE MODE ── */}
                    {mode === 'LINE' && (
                        <g clipPath="url(#stockClip)">
                            {/* Area */}
                            <motion.path d={areaPath} fill={`url(#${gradId})`}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
                            {/* Line */}
                            <motion.path
                                d={linePath} fill="none"
                                stroke={lineColor} strokeWidth={2.5}
                                strokeLinecap="round" strokeLinejoin="round"
                                filter="url(#stockLineGlow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                            />
                            {/* Endpoint dot — always visible */}
                            {pointMap.length > 0 && (
                                <g>
                                    <circle
                                        cx={pointMap[pointMap.length - 1].x}
                                        cy={pointMap[pointMap.length - 1].y}
                                        r={10} fill={lineColor} opacity={0.2}
                                        filter="url(#stockDotGlow)"
                                    />
                                    <circle
                                        cx={pointMap[pointMap.length - 1].x}
                                        cy={pointMap[pointMap.length - 1].y}
                                        r={4.5} fill={lineColor}
                                        stroke="white" strokeWidth={2}
                                    />
                                </g>
                            )}
                        </g>
                    )}

                    {/* ── CANDLE MODE ── */}
                    {mode === 'CANDLE' && (
                        <g clipPath="url(#stockClip)">
                            {candleSlots.map((c, i) => {
                                const color = c.isBull ? '#10b981' : '#f43f5e';
                                const bodyTop = Math.min(c.yO, c.yC);
                                const bodyH = Math.max(1.5, Math.abs(c.yO - c.yC));
                                return (
                                    <g key={i} className="transition-opacity duration-200 hover:opacity-80">
                                        {/* Wick */}
                                        <line x1={c.cx} y1={c.yH} x2={c.cx} y2={c.yL} stroke={color} strokeWidth={1.5} opacity={0.8} />
                                        {/* Body */}
                                        <rect x={c.cx - c.w / 2} y={bodyTop} width={c.w} height={bodyH} fill={color} rx={2} />
                                    </g>
                                );
                            })}
                        </g>
                    )}

                    {/* ── Crosshair ── */}
                    <AnimatePresence>
                        {crosshair && (
                            <g className="pointer-events-none">
                                <motion.line
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    x1={crosshair.x} y1={PAD.top} x2={crosshair.x} y2={PAD.top + cH}
                                    stroke={lineColor} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7}
                                />
                                <motion.line
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    x1={PAD.left} y1={crosshair.y} x2={W - PAD.right} y2={crosshair.y}
                                    stroke={lineColor} strokeWidth={1} strokeDasharray="4 4" opacity={0.4}
                                />
                                <motion.circle
                                    initial={{ r: 0, opacity: 0 }} animate={{ r: 9, opacity: 0.2 }} exit={{ r: 0, opacity: 0 }}
                                    cx={crosshair.x} cy={crosshair.y} fill={lineColor} filter="url(#stockDotGlow)"
                                />
                                <motion.circle
                                    initial={{ r: 0 }} animate={{ r: 5 }} exit={{ r: 0 }}
                                    cx={crosshair.x} cy={crosshair.y} fill={lineColor}
                                    stroke="white" strokeWidth={2.5}
                                />
                                {/* Price tag on y-axis */}
                                <rect x={0} y={crosshair.y - 10} width={PAD.left - 4} height={20} rx={6} fill={lineColor} opacity={0.9} />
                                <text x={PAD.left - 9} y={crosshair.y + 4} textAnchor="end" fontSize="9" fill="white" fontWeight="800">
                                    {fmt2(crosshair.price)}
                                </text>
                            </g>
                        )}
                    </AnimatePresence>
                </svg>

                {/* Floating OHLC tooltip */}
                <AnimatePresence>
                    {crosshair && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-3 pointer-events-none z-50"
                            style={{
                                left: crosshair.svgFrac > 0.55 ? undefined : '52%',
                                right: crosshair.svgFrac > 0.55 ? '2%' : undefined,
                            }}
                        >
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-slate-700/60 rounded-2xl shadow-2xl p-4 min-w-[160px]">
                                <p className={`text-base font-black font-mono tracking-tighter mb-3 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {fmtGHS(crosshair.price)}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Open</span>
                                    <span className="text-right font-black text-text-strong">{fmt2(crosshair.ohlc.open)}</span>
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">High</span>
                                    <span className="text-right font-black text-emerald-500">{fmt2(crosshair.ohlc.high)}</span>
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Low</span>
                                    <span className="text-right font-black text-rose-500">{fmt2(crosshair.ohlc.low)}</span>
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Close</span>
                                    <span className="text-right font-black text-blue-500">{fmt2(crosshair.ohlc.close)}</span>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tick #{crosshair.idx + 1}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── AI Terminal ── */}
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