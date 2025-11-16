



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
        <div className="w-2 h-2 rounded-full animate-pulse bg-primary" />
        <div className="w-2 h-2 rounded-full animate-pulse bg-primary" style={{animationDelay: '0.2s'}} />
        <div className="w-2 h-2 rounded-full animate-pulse bg-primary" style={{animationDelay: '0.4s'}}/>
    </div>
);

const MarketNewsFeed: React.FC<MarketNewsFeedProps> = ({ news, isLoading, onRefresh }) => {
    const error = !isLoading && news.length === 0 ? 'Could not fetch market news.' : null;

    const impactColors = {
        positive: 'border-l-success bg-success/10',
        negative: 'border-l-error bg-error/10',
        neutral: 'border-l-base-300 bg-base-300/20'
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                    <NewspaperIcon className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold text-text-strong">Market News</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                    </div>
                    <span className="text-sm font-semibold text-success">Live</span>
                </div>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {isLoading && (
                    <div className="flex justify-center items-center py-4"><LoadingSpinner /> <span className="ml-2 text-sm text-base-content">Fetching headlines...</span></div>
                )}
                {error && <p className="text-sm text-error text-center py-4">{error}</p>}
                {!isLoading && news.length > 0 && news.map((item, index) => (
                    <div key={index} className={`p-2 border-l-4 ${impactColors[item.impact]}`}>
                        <p className="font-bold text-sm text-text-strong">{item.symbol}</p>
                        <p className="text-xs text-base-content">{item.headline}</p>
                    </div>
                ))}
            </div>
            <div className="text-center mt-4">
                <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>Refresh News</Button>
            </div>
        </Card>
    );
};

export default MarketNewsFeed;