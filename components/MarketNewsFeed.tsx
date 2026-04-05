



import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewsHeadline } from '../types.ts';

interface MarketNewsFeedProps {
    news: NewsHeadline[];
    isLoading: boolean;
    onRefresh: () => void;
}

const NewspaperIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 rounded-full animate-bounce bg-blue-500" />
        <div className="w-2 h-2 rounded-full animate-bounce bg-indigo-500" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 rounded-full animate-bounce bg-purple-500" style={{ animationDelay: '0.2s' }} />
    </div>
);

const MarketNewsFeed: React.FC<MarketNewsFeedProps> = ({ news, isLoading, onRefresh }) => {
    const error = !isLoading && news.length === 0 ? 'INTELLIGENCE_LINK_OFFLINE' : null;
    const [lastRefreshed, setLastRefreshed] = useState<string>('');

    useEffect(() => {
        if (!isLoading && news.length > 0) {
            setLastRefreshed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }
    }, [isLoading, news]);

    const impactColors: { [key: string]: { border: string; glow: string; text: string; dot: string } } = {
        positive: { border: 'border-emerald-500/20', glow: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' },
        negative: { border: 'border-rose-500/20', glow: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' },
        neutral: { border: 'border-blue-500/20', glow: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' }
    };

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] shadow-2xl p-8 flex flex-col h-full group/news">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center space-x-5">
                    <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                        <NewspaperIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-text-strong tracking-tighter leading-none">Intelligence Feed</h3>
                        {lastRefreshed && <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">{lastRefreshed} • Operational</p>}
                    </div>
                </div>
            </div>

            <div className="relative flex-grow min-h-0">
                {/* Timeline vertical line */}
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800/50" />

                <div className="space-y-8 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                <LoadingSpinner /> 
                                <span className="mt-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Uplink...</span>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center p-8 text-center space-y-4"
                            >
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl">
                                    <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>
                            </motion.div>
                        )}

                        {!isLoading && news.length > 0 && news.map((item, index) => {
                            const theme = impactColors[item.impact] || impactColors.neutral;
                            return (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative pl-10"
                                >
                                    {/* Connection Point */}
                                    <div className={`absolute left-[0.625rem] top-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-900 z-20 ${theme.dot}`} />
                                    
                                    <div className={`p-6 rounded-[2rem] bg-white/40 dark:bg-slate-800/20 backdrop-blur-md border ${theme.border} hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all duration-500 group cursor-default shadow-sm hover:shadow-2xl`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`font-black text-xs tracking-tighter ${theme.text}`}>$ {item.symbol}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${theme.text}`}>
                                                    {item.impact}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-strong font-black leading-relaxed tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                                            {item.headline}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>Poll Database</span>
                </button>
            </div>
        </div>
    );
};

export default MarketNewsFeed;