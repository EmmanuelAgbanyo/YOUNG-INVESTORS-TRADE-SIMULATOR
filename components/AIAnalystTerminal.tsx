


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
            return <h3 key={index} className="text-md font-bold text-text-strong mt-2 mb-1">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**')) {
            const parts = line.split('**');
            return <p key={index} className="mb-2"><strong>{parts[1]}</strong>{parts[2]}</p>
        }
        return <p key={index} className="mb-2 last:mb-0">{line}</p>;
    });
  };

  return (
    <div className="bg-base-100 p-4 rounded-2xl border border-base-300 flex flex-col h-[450px]">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
                <SparkleIcon className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-text-strong">AI Analyst</h3>
            </div>
            {messages.length > 0 && <Button variant="ghost" size="sm" onClick={handleStartAnalysis}>New Analysis</Button>}
        </div>
        
        <div className="flex-grow flex flex-col min-h-0">
            {messages.length === 0 && !isLoading && !error && (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <p className="text-base-content mb-4">Chat with an AI analyst for insights on {stock.symbol}.</p>
                    <Button onClick={handleStartAnalysis} disabled={isLoading}>
                        {isLoading ? 'Analyzing...' : `Analyze ${stock.symbol}`}
                    </Button>
                </div>
            )}

            {isLoading && messages.length === 0 && <LoadingSpinner />}
            {error && <p className="text-error text-center py-4 flex-grow flex items-center justify-center">{error}</p>}
            
            {messages.length > 0 && (
                <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto pr-2">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="w-6 h-6 rounded-full themed-bg-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-base-200'}`}>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageText(msg.text)}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && <TypingIndicator />}
                </div>
            )}
        </div>

        {messages.length > 0 && !error && (
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-2 border-t border-base-300 pt-4">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className="input input-bordered w-full bg-base-200 focus:ring-primary focus:border-primary"
                    disabled={isLoading}
                />
                <Button type="submit" className="!p-3 !rounded-lg" disabled={isLoading || !userInput.trim()}>
                    <SendIcon className="w-5 h-5" />
                </Button>
            </form>
        )}
    </div>
  );
};

export default AIAnalystTerminal;