import React from 'react';

const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center themed-bg-shimmer animate-fade-in">
        <div className="relative flex flex-col items-center">
            <div className="bg-primary/20 p-4 rounded-2xl animate-pulse-dot" style={{ animationDuration: '2s' }}>
                <LogoIcon className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-strong tracking-tight mt-4">
                YIN Trade Simulator
            </h1>
            <p className="text-base-content/70">Initializing Market Data...</p>
        </div>
    </div>
  );
};

export default SplashScreen;
