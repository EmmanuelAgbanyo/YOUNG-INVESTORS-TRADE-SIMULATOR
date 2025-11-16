
import { useState, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message, Stock } from '../types.ts';

// Initialize the Gemini AI model once
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a savvy financial analyst for a stock trading simulator game. Your analysis is for educational purposes within the game. Keep your answers concise, clear, and easy for a beginner to understand. Avoid any real-world financial advice disclaimers.',
        },
      });

      const prompt = `Provide a concise, easy-to-understand investment analysis for the following stock on the Ghana Stock Exchange:

Stock: ${stock.name} (${stock.symbol})
Current Price: GHS ${stock.price.toFixed(2)}

Conclude with a clear recommendation: **BUY**, **SELL**, or **HOLD**, and provide a 2-3 sentence rationale. Also include a brief risk assessment.

Format your response using markdown with headings for Recommendation, Rationale, and Risk Assessment.`;
      
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
