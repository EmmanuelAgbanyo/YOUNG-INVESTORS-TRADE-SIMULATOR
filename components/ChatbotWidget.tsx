import React, { useState, useRef, useEffect } from 'react';
import type { Stock, Portfolio } from '../types.ts';
import { useChatbot } from '../hooks/useChatbot.ts';

// Icons
const ChatBubbleOvalLeftEllipsisIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388m-5.182-2.262a2.25 2.25 0 011.08-1.923 13.447 13.447 0 0011.82-7.066 2.25 2.25 0 00-1.08-1.923A13.447 13.447 0 003 12z" /></svg>
);
const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M3.105 3.105a1.5 1.5 0 012.122-.219l8.684 4.342a1.5 1.5 0 010 2.54l-8.684 4.342a1.5 1.5 0 01-2.332-1.928l1.79-4.475a.5.5 0 00-.01-.052l-1.79-4.475a1.5 1.5 0 01.21-1.928z" /></svg>
);
const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2 animate-fade-in-up">
        <div className="w-8 h-8 rounded-full themed-bg-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">AI</div>
        <div className="flex items-center space-x-1 p-3 bg-base-200 rounded-lg">
            <div className="w-2 h-2 rounded-full animate-pulse bg-base-content/50" />
            <div className="w-2 h-2 rounded-full animate-pulse bg-base-content/50" style={{animationDelay: '0.2s'}} />
            <div className="w-2 h-2 rounded-full animate-pulse bg-base-content/50" style={{animationDelay: '0.4s'}}/>
        </div>
    </div>
);

const ToolIndicator: React.FC<{ tool: string }> = ({ tool }) => {
    const messages: { [key: string]: string } = {
        'getMarketSummary': 'Analyzing market data...',
        'getStockAnalysis': 'Running stock analysis...',
        'getPortfolioReview': 'Reviewing portfolio performance...'
    };
    const message = messages[tool] || 'Thinking...';

    return (
        <div className="flex items-center space-x-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full themed-bg-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">AI</div>
            <div className="flex items-center space-x-2 p-3 bg-base-200 rounded-lg">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-base-content font-medium">{message}</span>
            </div>
        </div>
    );
};


interface ChatbotWidgetProps {
  stocks: Stock[];
  portfolio: Portfolio;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ stocks, portfolio }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const { messages, sendMessage, isLoading, toolBeingUsed } = useChatbot();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = (e: React.FormEvent, message?: string) => {
    e.preventDefault();
    const messageToSend = message || userInput;
    if (!messageToSend.trim() || isLoading) return;
    sendMessage(messageToSend, { stocks, portfolio });
    setUserInput('');
  };

  // This function safely renders markdown-like text from the AI into HTML.
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, index, arr) => {
      const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-strong">$1</strong>');
      const heading = bolded.replace(/^### (.*)/g, '<h3 class="text-md font-bold text-text-strong mt-2 mb-1">$1</h3>');
      return <p key={index} dangerouslySetInnerHTML={{ __html: heading }} className={index === arr.length - 1 ? '' : 'mb-2'} />;
    });
  };

  const suggestions = ['Market Summary', 'Analyze GCB', 'Review my portfolio'];

  return (
    <>
      {/* Chat Window */}
      <div className={`fixed bottom-24 right-4 sm:right-6 w-[calc(100%-2rem)] max-w-sm h-[70vh] max-h-[600px] bg-base-100 rounded-2xl shadow-2xl border border-base-300/50 flex flex-col transition-all duration-300 ease-in-out z-40 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <header className="flex items-center justify-between p-4 border-b border-base-300 shrink-0 themed-bg-gradient bg-opacity-20">
          <div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full themed-bg-gradient flex items-center justify-center text-white text-sm font-bold">AI</div><div><h3 className="font-bold text-text-strong">YIN AI Assistant</h3><p className="text-xs text-success flex items-center"><span className="relative flex h-2 w-2 mr-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span></span>Online</p></div></div>
          <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-black/10"><XMarkIcon className="w-6 h-6 text-white" /></button>
        </header>
        <div className="flex-grow flex flex-col relative min-h-0">
             <div className="absolute inset-0 bg-repeat bg-center opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(var(--base-content)) 1px, transparent 0)`,
                backgroundSize: '25px 25px'
            }} />
            <div ref={chatContainerRef} className="relative flex-grow p-4 space-y-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                  {msg.role === 'model' && <div className="w-8 h-8 rounded-full themed-bg-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">AI</div>}
                  <div className={`max-w-[80%] p-3 rounded-lg shadow-md ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-base-200'}`}><div className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageText(msg.text)}</div></div>
                </div>
              ))}
              {isLoading && (toolBeingUsed ? <ToolIndicator tool={toolBeingUsed} /> : <TypingIndicator />)}
            </div>
            {messages.length === 1 && !isLoading && (
              <div className="p-4 border-t border-base-300 flex flex-wrap gap-2 animate-fade-in">
                  {suggestions.map(s => (
                      <button key={s} onClick={(e) => handleSendMessage(e, s)} className="px-3 py-1.5 bg-base-200 rounded-full text-sm font-semibold text-primary border border-primary/50 hover:bg-primary/10 transition-colors">
                          {s}
                      </button>
                  ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-base-300 flex items-center space-x-2 shrink-0 bg-base-100">
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask about the market..." className="input input-bordered w-full bg-base-200" disabled={isLoading} />
              <button type="submit" className="btn btn-primary p-3" disabled={isLoading || !userInput.trim()} aria-label="Send Message"><PaperAirplaneIcon className="w-5 h-5" /></button>
            </form>
        </div>
      </div>

      {/* Floating Action Button */}
      <button onClick={() => setIsOpen(!isOpen)} className={`fixed bottom-6 right-4 sm:right-6 btn btn-primary btn-circle shadow-xl transition-transform duration-300 ease-in-out z-40 w-16 h-16 ${isOpen ? 'scale-0' : 'scale-100'}`} aria-label="Open AI Assistant">
        <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8" />
      </button>
    </>
  );
};

export default ChatbotWidget;
