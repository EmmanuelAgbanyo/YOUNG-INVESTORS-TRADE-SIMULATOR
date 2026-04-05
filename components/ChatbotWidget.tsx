import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
    >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg">AI</div>
        <div className="flex items-center space-x-1.5 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none">
            <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-slate-400" />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-slate-400" style={{animationDelay: '0.2s'}} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-slate-400" style={{animationDelay: '0.4s'}}/>
        </div>
    </motion.div>
);

const ToolIndicator: React.FC<{ tool: string }> = ({ tool }) => {
    const messages: { [key: string]: string } = {
        'getMarketSummary': 'Analyzing market vectors...',
        'getStockAnalysis': 'Synthesizing performance data...',
        'getPortfolioReview': 'Auditing asset allocation...'
    };
    const message = messages[tool] || 'Synchronizing...';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3"
        >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg">AI</div>
            <div className="flex items-center space-x-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl rounded-tl-none">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[11px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-widest leading-none">{message}</span>
            </div>
        </motion.div>
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
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100%-2rem)] max-w-sm h-[70vh] max-h-[600px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/20 rounded-[2.5rem] shadow-2xl flex flex-col z-40 overflow-hidden"
          >
            <header className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-black shadow-lg">AI</div>
                    <div>
                        <h3 className="font-black text-text-strong tracking-tighter leading-none">Intelligence Hub</h3>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1.5 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            Operations Live
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </header>
            
            <div className="flex-grow flex flex-col relative min-h-0 bg-white/20 dark:bg-slate-900/20">
                <div ref={chatContainerRef} className="relative flex-grow p-6 space-y-6 overflow-y-auto custom-scrollbar">
                  {messages.map((msg, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg">AI</div>
                      )}
                      <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/60 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700/20 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                        <div className="text-sm leading-relaxed">{renderMessageText(msg.text)}</div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (toolBeingUsed ? <ToolIndicator tool={toolBeingUsed} /> : <TypingIndicator />)}
                </div>

                {messages.length === 1 && !isLoading && (
                  <div className="p-4 flex flex-wrap gap-2 justify-center">
                      {suggestions.map(s => (
                          <button 
                            key={s} 
                            onClick={(e) => handleSendMessage(e, s)} 
                            className="px-4 py-2 bg-white/60 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700/20 rounded-full text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
                          >
                              {s}
                          </button>
                      ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3 shrink-0">
                  <input 
                    type="text" 
                    value={userInput} 
                    onChange={(e) => setUserInput(e.target.value)} 
                    placeholder="Query market intel..." 
                    className="flex-grow bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm font-bold text-text-strong placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    disabled={isLoading} 
                  />
                  <button 
                    type="submit" 
                    className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                    disabled={isLoading || !userInput.trim()}
                  >
                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                  </button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)} 
        className={`fixed bottom-6 right-4 sm:right-6 w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center z-40 transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8" />
      </motion.button>
    </>
  );
};

export default ChatbotWidget;
