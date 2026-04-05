
import { useState, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';

// Parse a Gemini API error into a user-friendly message
const parseGeminiError = (e: unknown): string => {
  const msg = (e as any)?.message ?? String(e);
  if (/renew.*api.*key|api.*key.*invalid|api.*key.*expired|api_key_invalid/i.test(msg)) {
    return 'The AI API key has expired. The admin needs to renew it in the .env file.';
  }
  if (/quota|rate.?limit|resource.*exhausted|429/i.test(msg)) {
    return 'AI quota exceeded for today. Please try again tomorrow or contact your admin.';
  }
  if (/fetch|network|failed to fetch|econnrefused/i.test(msg)) {
    return 'Network error — could not reach the AI service. Check your internet connection.';
  }
  if (/not.*found|404/i.test(msg)) {
    return 'AI model not available. Please contact your admin.';
  }
  return 'Could not get analysis right now. Please try again in a moment.';
};
import type { Message, Stock } from '../types.ts';

let _aiInstance: any = null;

// Read the API key from every possible source in priority order:
// 1. Vite import.meta.env (from .env file if present)
// 2. window.process.env polyfill set by index.html <script> tag
// 3. Node process.env (SSR / build-time)
// The window lookup uses bracket notation to avoid Vite's compile-time define
//   transform replacing 'process.env.API_KEY' before we can read it from window.
const getApiKey = (): string | undefined => {
  // Vite injects these at build time from .env
  const viteKey = (import.meta as any).env?.VITE_API_KEY
    || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;

  // index.html polyfill: window.process = { env: { API_KEY: '...' } }
  const win = typeof window !== 'undefined' ? (window as any) : undefined;
  const windowKey = win?.['process']?.['env']?.['API_KEY']
    || win?.['process']?.['env']?.['GEMINI_API_KEY'];
  if (windowKey) return windowKey;

  // Node / SSR fallback
  if (typeof process !== 'undefined') {
    return (process as any).env?.API_KEY || (process as any).env?.GEMINI_API_KEY;
  }
  return undefined;
};

const getAI = () => {
  if (_aiInstance) return _aiInstance;
  const key = getApiKey();
  if (!key) {
    console.error('[AI Coach] No API key found. Set VITE_API_KEY in .env or window.process.env.API_KEY in index.html');
    throw new Error('No Gemini API key available');
  }
  _aiInstance = new GoogleGenAI({ apiKey: key });
  return _aiInstance;
};

interface ChatSession {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export const useAIAnalyst = () => {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});

  const updateSession = useCallback((symbol: string, data: Partial<ChatSession>) => {
    setSessions(prev => ({
      ...prev,
      [symbol]: {
        ...(prev[symbol] || { chat: null, messages: [], isLoading: false, error: null }),
        ...data,
      },
    }));
  }, []);

  const startAnalysis = useCallback(async (stock: Stock) => {
    if (!stock) return;
    updateSession(stock.symbol, { isLoading: true, error: null, messages: [] });

    // Compute real session stats from priceHistory
    const history = stock.priceHistory ?? [];
    const sessionOpen  = history.length ? history[0].open : stock.price;
    const sessionHigh  = history.length ? Math.max(...history.map(h => h.high), stock.price) : stock.price;
    const sessionLow   = history.length ? Math.min(...history.map(h => h.low),  stock.price) : stock.price;
    const sessionClose = stock.price;
    const sessionChange    = sessionClose - sessionOpen;
    const sessionChangePct = sessionOpen > 0 ? (sessionChange / sessionOpen) * 100 : 0;
    const tickCount = history.length;

    // Simple momentum: rising if last 5 ticks are mostly up
    const recentTicks = history.slice(-5);
    const risingTicks = recentTicks.filter(h => h.close > h.open).length;
    const momentum = risingTicks >= 4 ? 'Strong Upward' : risingTicks <= 1 ? 'Strong Downward' : 'Mixed / Sideways';

    try {
      const client = getAI();
      const chat = client.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: `You are a friendly but expert stock market coach helping young student investors on the Ghana Stock Exchange (GSE).
Your job is to give clear, simple, and honest stock analysis that a teenager can understand.
Do NOT use jargon like "alpha", "beta exposure", "neural pathways", or "institutional positioning".
Use plain English. Be encouraging but honest about risks.
Always end with ONE of: ✅ BUY, ⏸ HOLD, or ❌ SELL — and explain why in one simple sentence.
Format your response like this:

### What's happening with [STOCK NAME]
[2-3 sentences in plain English about what the numbers show]

### Is the price going up or down?
[1-2 sentences about price trend using the data]

### Why it might keep going up 📈
- [simple bullet point]
- [simple bullet point]

### Why it might fall 📉
- [simple bullet point]
- [simple bullet point]

### Our Recommendation
[BUY / HOLD / SELL emoji + one clear sentence]`,
        },
      });

      const prompt = `Please analyse this GSE stock for me:

**Stock:** ${stock.name} (${stock.symbol})
**Current Price:** GHS ${stock.price.toFixed(2)}
**Session Open:** GHS ${sessionOpen.toFixed(2)}
**Session High:** GHS ${sessionHigh.toFixed(2)}
**Session Low:** GHS ${sessionLow.toFixed(2)}
**Price Change Today:** ${sessionChange >= 0 ? '+' : ''}GHS ${sessionChange.toFixed(2)} (${sessionChangePct >= 0 ? '+' : ''}${sessionChangePct.toFixed(2)}%)
**Price Ticks Recorded:** ${tickCount}
**Short-term Momentum:** ${momentum} (${risingTicks} of last ${Math.min(5, recentTicks.length)} ticks were up)
**Volatility:** ${(stock.volatility * 100).toFixed(1)}% (${stock.volatility < 0.015 ? 'low — very stable' : stock.volatility < 0.03 ? 'medium — some ups and downs' : 'high — price swings a lot'})
**Growth Trend:** ${(stock.trend * 100).toFixed(2)}% per tick

Give me your analysis.`;

      const response = await chat.sendMessage({ message: prompt });
      updateSession(stock.symbol, {
        chat,
        messages: [{ role: 'model', text: response.text }],
        isLoading: false,
      });
    } catch (e) {
      console.error('[AI Coach] startAnalysis error:', e);
      updateSession(stock.symbol, {
        error: parseGeminiError(e),
        isLoading: false,
      });
    }
  }, [updateSession]);

  const sendMessage = useCallback(async (symbol: string, message: string) => {
    const session = sessions[symbol];
    if (!message.trim() || !session?.chat || session.isLoading) return;

    const userMsg: Message = { role: 'user', text: message };
    updateSession(symbol, { messages: [...session.messages, userMsg], isLoading: true, error: null });

    try {
      const response = await session.chat.sendMessage({ message });
      setSessions(prev => {
        const cur = prev[symbol];
        return {
          ...prev,
          [symbol]: { ...cur, messages: [...cur.messages, { role: 'model', text: response.text }], isLoading: false },
        };
      });
    } catch (e) {
      console.error('[AI Coach] sendMessage error:', e);
      setSessions(prev => {
        const cur = prev[symbol];
        return {
          ...prev,
          [symbol]: { ...cur, messages: cur.messages.slice(0, -1), isLoading: false, error: parseGeminiError(e) },
        };
      });
    }
  }, [sessions, updateSession]);

  return { sessions, startAnalysis, sendMessage };
};
