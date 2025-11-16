import React, { useState, useEffect } from 'react';
import type { MarketEvent } from '../types.ts';
import Card from './ui/Card.tsx';

interface MarketEventDisplayProps {
  event: MarketEvent | null;
}

const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM10.5 9a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.89 6.663a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM21.75 12a9.75 9.75 0 10-19.5 0 9.75 9.75 0 0019.5 0z" />
  </svg>
);

const MarketEventDisplay: React.FC<MarketEventDisplayProps> = ({ event }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!event) return;

    const updateProgress = () => {
      const timeRemaining = event.expiresAt - Date.now();
      const newProgress = (timeRemaining / event.duration) * 100;
      setProgress(Math.max(0, newProgress));
    };

    updateProgress();
    const intervalId = setInterval(updateProgress, 100);

    return () => clearInterval(intervalId);
  }, [event]);

  if (!event) {
    return null;
  }

  const isPositive = event.driftModifier > 0;
  const isNegative = event.driftModifier < 0;

  let borderColor = 'border-info';
  if (isPositive) borderColor = 'border-success';
  if (isNegative) borderColor = 'border-error';

  return (
    <div className="animate-fade-in-up">
        <Card className={`!p-4 border-l-4 ${borderColor}`}>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-3">
                <MegaphoneIcon className="w-8 h-8 text-primary shrink-0" />
                <div>
                    <h4 className="font-bold text-text-strong">{event.title}</h4>
                    <p className="text-sm text-base-content/80">{event.description}</p>
                </div>
            </div>
            <div className="w-full sm:w-48 shrink-0">
                <div className="w-full bg-base-300 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
        </Card>
    </div>
  );
};

export default MarketEventDisplay;