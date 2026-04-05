


import React, { useState, useEffect, useRef } from 'react';
import type { Stock, Message } from '../types.ts';
import Button from './ui/Button.tsx';

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

const SparkleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.4-1.4l-1.188-.648 1.188-.648a2.25 2.25 0 011.4-1.4l.648-1.188.648 1.188a2.25 2.25 0 011.4 1.4l1.188.648-1.188.648a2.25 2.25 0 01-1.4 1.4z" />
    </svg>
);

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M3.105 3.105a1.5 1.5 0 012.122-.219l8.684 4.342a1.5 1.5 0 010 2.54l-8.684 4.342a1.5 1.5 0 01-2.332-1.928l1.79-4.475a.5.5 0 00-.01- .052l-1.79-4.475a1.5 1.5 0 01.21-1.928z" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 py-4">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" />
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{animationDelay: '0.2s'}} />
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{animationDelay: '0.4s'}}/>
    </div>
);

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full themed-bg-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
        <div className="flex items-center space-x-1 p-3 bg-base-200 rounded-lg">
            <div className="w-2 h-2 rounded-full animate-pulse bg-base-content/50" />
            <div className="w-2 h-2 rounded-full animate-pulse bg-base-content/50" style={{animationDelay: '0.2s'}} />
            <div className="w-2 h-2 rounded-full animate-pulse bg-base-content/50" style={{animationDelay: '0.4s'}}/>
        </div>
    </div>
);

const AIAnalystTerminal: React.FC<AIAnalystTerminalProps> = ({ stock, session, onStartAnalysis, onSendMessage }) => {
  const [userInput, setUserInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error } = session;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleStartAnalysis = () => {
      onStartAnalysis(stock);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    onSendMessage(stock.symbol, userInput);
    setUserInput('');
  };

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-md font-black text-text-strong mt-4 mb-2 tracking-tight">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            const parts = line.split('**');
            return <p key={index} className="mb-2 leading-relaxed"><strong>{parts[1]}</strong>{parts[2]}</p>
        }
        return <p key={index} className="mb-2 last:mb-0 leading-relaxed font-bold text-slate-600 dark:text-slate-400">{line}</p>;
    });
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col h-[500px] group/terminal">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center space-x-5">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                    <SparkleIcon className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-text-strong tracking-tighter leading-none uppercase">Intelligence Uplink</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Node: {stock.symbol} • Neural Link Active</p>
                </div>
            </div>
            {messages.length > 0 && (
                <button 
                  onClick={handleStartAnalysis}
                  className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                >
                    Recalibrate
                </button>
            )}
        </div>
        
        <div className="flex-grow flex flex-col min-h-0 relative">
            {messages.length === 0 && !isLoading && !error && (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700/50 shadow-inner">
                        <SparkleIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Awaiting Command Input</p>
                        <p className="text-xs font-bold text-slate-400 opacity-60">Initialize deep neural analysis for {stock.name}</p>
                    </div>
                    <button 
                        onClick={handleStartAnalysis} 
                        disabled={isLoading}
                        className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Processing' : `Analyze ${stock.symbol} Matrix`}
                    </button>
                </div>
            )}

            {isLoading && messages.length === 0 && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <LoadingSpinner />
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">Syncing Neural Pathways</span>
                </div>
            )}
            
            {error && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/30">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Uplink Failure</p>
                    <p className="text-xs font-bold text-rose-500/70">{error}</p>
                </div>
            )}
            
            {messages.length > 0 && (
                <div ref={chatContainerRef} className="flex-grow space-y-8 overflow-y-auto pr-3 custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] tracking-tight shrink-0 border border-white/20 dark:border-white/5 ${
                                msg.role === 'model' 
                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                                {msg.role === 'model' ? 'AI' : 'US'}
                            </div>
                            <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm transform transition-all duration-300 ${
                                msg.role === 'user' 
                                ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-white rounded-tr-none' 
                                : 'bg-white/60 dark:bg-slate-900/60 text-slate-800 dark:text-white border border-white/40 dark:border-slate-800/40 rounded-tl-none'
                            }`}>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageText(msg.text)}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg animate-pulse">AI</div>
                            <TypingIndicator />
                        </div>
                    )}
                </div>
            )}
        </div>

        {messages.length > 0 && !error && (
            <form onSubmit={handleSendMessage} className="mt-8 flex items-center space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Provide follow-up instruction..."
                    className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 py-4 text-sm font-black text-text-strong transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                    disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.95] disabled:opacity-50"
                  disabled={isLoading || !userInput.trim()}
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </form>
        )}
    </div>
  );
};

export default AIAnalystTerminal;