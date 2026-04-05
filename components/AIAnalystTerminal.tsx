import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stock, Message } from '../types.ts';

interface AnalystSession {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

interface AIAnalystTerminalProps {
    stock: Stock;
    session: AnalystSession;
    onStartAnalysis: (stock: Stock) => void;
    onSendMessage: (symbol: string, message: string) => void;
}

// ── Suggested quick-ask chips ─────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
    'Is now a good time to buy?',
    'What are the risks?',
    'How does volatility affect me?',
    'Should I sell if it drops 5%?',
    'What would make this stock go up?',
];

// ── Markdown-to-JSX renderer ──────────────────────────────────────────────
const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { nodes.push(<div key={i} className="h-2" />); i++; continue; }

        // H3
        if (line.startsWith('### ')) {
            nodes.push(
                <h3 key={i} className="text-sm font-black text-text-strong mt-5 mb-2 tracking-tight flex items-center gap-2">
                    {line.slice(4)}
                </h3>
            );
            i++; continue;
        }
        // H2
        if (line.startsWith('## ')) {
            nodes.push(
                <h2 key={i} className="text-base font-black text-text-strong mt-5 mb-2 tracking-tighter">{line.slice(3)}</h2>
            );
            i++; continue;
        }

        // Recommendation line — highlight BUY / HOLD / SELL
        if (line.includes('✅') || line.includes('⏸') || line.includes('❌')) {
            const isBuy  = line.includes('✅') || line.toUpperCase().includes('BUY');
            const isSell = line.includes('❌') || line.toUpperCase().includes('SELL');
            const color  = isBuy ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                         : isSell ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                         : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
            nodes.push(
                <div key={i} className={`mt-4 p-4 rounded-2xl border ${color} font-black text-sm`}>
                    {renderInline(line)}
                </div>
            );
            i++; continue;
        }

        // Bullet
        if (line.startsWith('- ')) {
            const bullets: React.ReactNode[] = [];
            while (i < lines.length && lines[i].startsWith('- ')) {
                bullets.push(
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span>{renderInline(lines[i].slice(2))}</span>
                    </li>
                );
                i++;
            }
            nodes.push(<ul key={`ul-${i}`} className="space-y-2 my-2">{bullets}</ul>);
            continue;
        }

        // Regular paragraph
        nodes.push(
            <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {renderInline(line)}
            </p>
        );
        i++;
    }
    return nodes;
};

// Inline bold/italic
const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-black text-text-strong">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

// ── Typing dots ────────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-2xl rounded-tl-none w-fit shadow-sm">
        {[0, 1, 2].map(i => (
            <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
        ))}
    </div>
);

// ── AI badge + user badge ──────────────────────────────────────────────────
const AIBadge = () => (
    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
    </div>
);

const YouBadge = () => (
    <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 text-[10px] font-black shrink-0">
        YOU
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const AIAnalystTerminal: React.FC<AIAnalystTerminalProps> = ({
    stock, session, onStartAnalysis, onSendMessage,
}) => {
    const [input, setInput] = useState('');
    const chatRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { messages, isLoading, error } = session;
    const hasMessages = messages.length > 0;

    // Auto-scroll on new message
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(stock.symbol, input.trim());
        setInput('');
    };

    const handleChip = (q: string) => {
        if (isLoading) return;
        onSendMessage(stock.symbol, q);
    };

    // Direction badge
    const direction = useMemo(() => {
        const h = stock.priceHistory ?? [];
        if (h.length < 2) return null;
        const last5 = h.slice(-5);
        const up = last5.filter(t => t.close > t.open).length;
        if (up >= 4) return { label: '▲ Trending Up', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' };
        if (up <= 1) return { label: '▼ Trending Down', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' };
        return { label: '◆ Sideways', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    }, [stock.priceHistory]);

    return (
        <div className="flex flex-col" style={{ minHeight: '420px', maxHeight: '580px' }}>
            {/* ── Header ── */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <AIBadge />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-text-strong tracking-tight leading-none">
                                    AI Stock Coach
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                    Gemini
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-slate-400 font-bold">Analysing: <span className="text-text-strong font-black">{stock.name}</span></p>
                                {direction && (
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${direction.color}`}>
                                        {direction.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {hasMessages && (
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onStartAnalysis(stock)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Fresh Analysis
                        </motion.button>
                    )}
                </div>
            </div>

            {/* ── Chat body ── */}
            <div ref={chatRef} className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar space-y-5">
                {/* Empty state */}
                {!hasMessages && !isLoading && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center space-y-5 py-8"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.07, 1] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                            className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner"
                        >
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </motion.div>
                        <div>
                            <p className="text-sm font-black text-text-strong">Get an AI view on {stock.name}</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                                Our AI coach will look at the live price data and tell you what it thinks in plain English.
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onStartAnalysis(stock)}
                            disabled={isLoading}
                            className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.15em] shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            Analyse {stock.symbol} Now
                        </motion.button>
                    </motion.div>
                )}

                {/* Loading first analysis */}
                {isLoading && !hasMessages && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                        <div className="flex items-center gap-4">
                            <AIBadge />
                            <TypingDots />
                        </div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] animate-pulse">
                            Reading the market data...
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center p-8 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/30 space-y-3"
                    >
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-2xl">
                            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-sm font-black text-rose-600">Something went wrong</p>
                        <p className="text-xs text-rose-500/70">{error}</p>
                        <button
                            onClick={() => onStartAnalysis(stock)}
                            className="mt-2 px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}

                {/* Messages */}
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {msg.role === 'model' ? <AIBadge /> : <YouBadge />}
                            <div className={`max-w-[88%] px-5 py-4 rounded-[1.5rem] shadow-sm ${
                                msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white/70 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 rounded-tl-none'
                            }`}>
                                {msg.role === 'user'
                                    ? <p className="text-sm font-bold text-white leading-relaxed">{msg.text}</p>
                                    : <div className="text-sm leading-relaxed">{renderMarkdown(msg.text)}</div>
                                }
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing while in conversation */}
                {isLoading && hasMessages && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3"
                    >
                        <AIBadge />
                        <TypingDots />
                    </motion.div>
                )}
            </div>

            {/* ── Quick-ask chips — only show after first analysis ── */}
            {hasMessages && !isLoading && !error && (
                <div className="px-6 py-3 border-t border-slate-100/50 dark:border-slate-800/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick questions</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map(q => (
                            <motion.button
                                key={q}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleChip(q)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                            >
                                {q}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Input bar — only after first analysis ── */}
            {hasMessages && !error && (
                <div className="px-6 pb-6 pt-2">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask anything about this stock..."
                            disabled={isLoading}
                            className="flex-grow bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-text-strong transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                        />
                        <motion.button
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </motion.button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIAnalystTerminal;