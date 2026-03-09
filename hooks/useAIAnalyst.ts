
import { useState, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message, Stock } from '../types.ts';

let _ai_local2: any = null;
const getAI_local2 = () => {
  if (_ai_local2) return _ai_local2;
  try {
    const key = typeof window !== 'undefined' && (window as any).process?.env?.API_KEY
      ? (window as any).process.env.API_KEY
      : (typeof process !== 'undefined' ? (process as any).env?.API_KEY : undefined);
    if (!key) throw new Error('No API key provided for GoogleGenAI');
    _ai_local2 = new GoogleGenAI({ apiKey: key });
    return _ai_local2;
  } catch (err) {
    console.warn('GoogleGenAI not available in this environment, using mock:', err);
    _ai_local2 = { chats: { create: () => ({ sendMessage: async ({ message }: any) => ({ text: 'Mock: ' + String(message) }) }) } };
    return _ai_local2;
  }
};

interface ChatSession {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export const useAIAnalyst = () => {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});

  const updateSession = useCallback((symbol: string, newSessionData: Partial<ChatSession>) => {
    setSessions(prev => ({
      ...prev,
      [symbol]: {
        ...(prev[symbol] || { chat: null, messages: [], isLoading: false, error: null }),
        ...newSessionData
      }
    }));
  }, []);

  const startAnalysis = useCallback(async (stock: Stock) => {
    if (!stock) return;

    // Reset previous error and messages for a fresh analysis
    updateSession(stock.symbol, { isLoading: true, error: null, messages: [] });

    try {
      const client = getAI_local2();
      const newChat = client.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an Elite Institutional Stock Analyst for the Ghana Stock Exchange (GSE). Your analysis must be highly professional, formatting insights like a Bloomberg Terminal breakdown. Use bullet points for readability. Be decisive, objective, and data-driven. Always conclude strongly with a clear Action command: BUY, SELL, or HOLD.',
        },
      });

      const prompt = `Conduct a rapid institutional-grade analysis for the following GSE stock:

Stock: ${stock.name} (${stock.symbol})
Current Price: GHS ${stock.price.toFixed(2)}
Volatility Rating: ${(stock.volatility * 100).toFixed(1)}%
Growth Trend: ${(stock.trend * 100).toFixed(2)}%

Provide:
1. **Market Positioning:** Brief competitive edge/weakness.
2. **Technical Outlook:** What the volatility and trend figures suggest.
3. **Risk Profile:** Key vulnerabilities.
4. **Final Recommendation:** **BUY**, **SELL**, or **HOLD** with a single sentence justification.

Use markdown. Keep it punchy and premium.`;

      const response = await newChat.sendMessage({ message: prompt });
      const modelMessage: Message = { role: 'model', text: response.text };

      updateSession(stock.symbol, {
        chat: newChat,
        messages: [modelMessage],
        isLoading: false
      });

    } catch (e) {
      console.error(e);
      updateSession(stock.symbol, {
        error: 'Failed to start analysis. The AI analyst might be busy. Please try again later.',
        isLoading: false
      });
    }
  }, [updateSession]);

  const sendMessage = useCallback(async (symbol: string, message: string) => {
    const session = sessions[symbol];
    if (!message.trim() || !session || !session.chat || session.isLoading) return;

    const userMessage: Message = { role: 'user', text: message };

    updateSession(symbol, {
      messages: [...session.messages, userMessage],
      isLoading: true,
      error: null
    });

    try {
      const response = await session.chat.sendMessage({ message: message });
      const modelMessage: Message = { role: 'model', text: response.text };

      setSessions(prev => {
        const currentSession = prev[symbol];
        return {
          ...prev,
          [symbol]: {
            ...currentSession,
            messages: [...currentSession.messages, modelMessage],
            isLoading: false
          }
        }
      });

    } catch (e) {
      console.error(e);
      setSessions(prev => {
        const currentSession = prev[symbol];
        return {
          ...prev,
          [symbol]: {
            ...currentSession,
            messages: currentSession.messages.slice(0, -1), // remove user message on failure
            isLoading: false,
            error: 'Failed to get a response. Please try again.'
          }
        }
      });
    }
  }, [sessions, updateSession]);

  return { sessions, startAnalysis, sendMessage };
};
