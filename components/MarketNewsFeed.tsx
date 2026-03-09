



import React from 'react';
import type { NewsHeadline } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';

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
    const error = !isLoading && news.length === 0 ? 'Could not fetch market news.' : null;

    const impactColors = {
        positive: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400',
        negative: 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-400',
        neutral: 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500'
    };

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-md">
                        <NewspaperIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Market News</h3>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                {isLoading && (
                    <div className="flex justify-center items-center py-8"><LoadingSpinner /> <span className="ml-3 text-sm font-medium text-slate-500 dark:text-slate-400">Fetching headlines...</span></div>
                )}
                {error && <p className="text-sm font-medium text-rose-500 text-center py-8 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-dashed border-rose-200 dark:border-rose-500/30">{error}</p>}

                {!isLoading && news.length > 0 && news.map((item, index) => (
                    <div key={index} className={`p-4 rounded-2xl border-l-[6px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group ${impactColors[item.impact]}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${item.impact === 'positive' ? 'from-emerald-400 to-transparent' : item.impact === 'negative' ? 'from-rose-400 to-transparent' : 'from-blue-400 to-transparent'}`}></div>
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="font-black text-base text-slate-800 dark:text-white tracking-tight drop-shadow-sm">{item.symbol}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm">{item.impact}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold leading-relaxed relative z-10">{item.headline}</p>
                    </div>
                ))}
            </div>

            <div className="text-center mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="px-6 py-2 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Refesh Feed
                </button>
            </div>
        </div>
    );
};

export default MarketNewsFeed;