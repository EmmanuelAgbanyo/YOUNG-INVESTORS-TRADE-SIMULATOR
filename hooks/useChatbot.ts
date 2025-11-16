

import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message, Stock, Portfolio } from '../types.ts';

// Use the shared safe factory from other hooks pattern. Create a local
// factory so this module remains self-contained.
let _ai_local: any = null;
const getAI_local = () => {
    if (_ai_local) return _ai_local;
    try {
        const key = typeof window !== 'undefined' && (window as any).process?.env?.API_KEY
            ? (window as any).process.env.API_KEY
            : (typeof process !== 'undefined' ? (process as any).env?.API_KEY : undefined);
        if (!key) throw new Error('No API key provided for GoogleGenAI');
        _ai_local = new GoogleGenAI({ apiKey: key });
        return _ai_local;
    } catch (err) {
        console.warn('GoogleGenAI not available in this environment, using mock:', err);
        _ai_local = {
            chats: {
                create: () => ({ sendMessage: async ({ message }: any) => ({ text: 'Mock: ' + String(message) }) }),
            },
        };
        return _ai_local;
    }
};

const SYSTEM_INSTRUCTION = `You are "YIN AI Assistant", a helpful and knowledgeable guide for a stock trading simulator game. Your tone is professional, encouraging, and clear.
When a user asks for a market summary, to analyze a specific stock, or to review their portfolio, you MUST respond ONLY with a JSON object to trigger the correct tool. Do not add any other text.
- For a market summary, respond with: {"tool": "getMarketSummary"}
- To analyze a stock (e.g., "analyze MTNGH"), respond with: {"tool": "getStockAnalysis", "symbol": "MTNGH"}
- For a portfolio review, respond with: {"tool": "getPortfolioReview"}
For all other general questions about trading concepts or how to use the simulator, respond conversationally and helpfully in markdown format.`;

const formatMarketSummary = (stocks: Stock[]): string => {
    const stocksWithChange = stocks
        .map(stock => ({
            ...stock,
            change: stock.lastPrice ? (stock.price - stock.lastPrice) / stock.lastPrice : 0,
        }))
        .filter(s => s.change !== 0);
    
    stocksWithChange.sort((a, b) => b.change - a.change);
    const topGainers = stocksWithChange.slice(0, 3);
    const topLosers = stocksWithChange.slice(-3).reverse();
    
    return `
        Top 3 Gainers: ${topGainers.map(s => `${s.symbol} (+${(s.change * 100).toFixed(2)}%)`).join(', ') || 'None'}.
        Top 3 Losers: ${topLosers.map(s => `${s.symbol} (${(s.change * 100).toFixed(2)}%)`).join(', ') || 'None'}.
    `;
};

const formatStockDataForAnalysis = (stock: Stock): string => {
    return `Stock: ${stock.name} (${stock.symbol}), Current Price: GHS ${stock.price.toFixed(2)}.`;
};

const formatPortfolioForReview = (portfolio: Portfolio, stocks: Stock[]): string => {
    const stockMap = new Map(stocks.map(s => [s.symbol, s.price]));
    let holdingsValue = 0;
    const holdingsSummary = Object.values(portfolio.holdings).map(h => {
        const price = stockMap.get(h.symbol) || 0;
        const value = h.quantity * price;
        holdingsValue += value;
        return `${h.quantity} shares of ${h.symbol} worth GHS ${value.toFixed(2)}`;
    }).join('; ');
    const totalValue = portfolio.cash + holdingsValue;
    return `
        Available Cash: GHS ${portfolio.cash.toFixed(2)}.
        Holdings: ${holdingsSummary || 'None'}.
        Total Portfolio Value: GHS ${totalValue.toFixed(2)}.
    `;
};

export const useChatbot = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toolBeingUsed, setToolBeingUsed] = useState<string | null>(null);

    useEffect(() => {
        const initializeChat = () => {
                const client = getAI_local();
                const newChat = client.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction: SYSTEM_INSTRUCTION },
                });
            setChat(newChat);
            setMessages([{
                role: 'model',
                text: 'Hello! I am the YIN AI Assistant. How can I help you today? You can ask me for a market summary, to analyze a stock, or to review your portfolio.'
            }]);
        };
        initializeChat();
    }, []);

    const sendMessage = useCallback(async (
        userMessageText: string,
        context: { stocks: Stock[], portfolio: Portfolio }
    ) => {
        if (!chat || isLoading) return;

        const userMessage: Message = { role: 'user', text: userMessageText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setToolBeingUsed(null);

        try {
                const detectionResponse = await chat.sendMessage({ message: userMessageText });
            let toolResultData = '';
            let isToolCall = false;
            let finalPrompt = '';

            try {
                const potentialTool = JSON.parse(detectionResponse.text);
                if (potentialTool.tool) {
                    isToolCall = true;
                    setToolBeingUsed(potentialTool.tool); // Let the UI know which tool is running
                    switch (potentialTool.tool) {
                        case 'getMarketSummary':
                            toolResultData = formatMarketSummary(context.stocks);
                            finalPrompt = `Based on the following data, provide a concise summary of today's market activity. Data: ${toolResultData}`;
                            break;
                        case 'getStockAnalysis':
                            const stock = context.stocks.find(s => s.symbol.toUpperCase() === potentialTool.symbol.toUpperCase());
                            toolResultData = stock ? formatStockDataForAnalysis(stock) : `Error: Could not find data for symbol ${potentialTool.symbol}.`;
                            finalPrompt = `Provide a concise, easy-to-understand investment analysis for the following stock based on this data. Conclude with a clear recommendation (**BUY**, **SELL**, or **HOLD**), a 2-3 sentence rationale, and a brief risk assessment. Data: ${toolResultData}`;
                            break;
                        case 'getPortfolioReview':
                             toolResultData = formatPortfolioForReview(context.portfolio, context.stocks);
                             finalPrompt = `Review the following user portfolio. Comment on its overall value, cash/equity balance, and any concentration risks. Provide one actionable piece of feedback. Data: ${toolResultData}`;
                            break;
                        default:
                            toolResultData = `I detected an unknown tool: ${potentialTool.tool}.`;
                            finalPrompt = `Please inform the user there was an error with an unknown tool.`;
                    }
                }
            } catch (e) {
                // Not a JSON object, so it's a conversational response
                isToolCall = false;
            }

            let finalResponseText: string;
            if (isToolCall) {
                const finalResponse = await chat.sendMessage({ message: finalPrompt });
                finalResponseText = finalResponse.text;
            } else {
                finalResponseText = detectionResponse.text;
            }

            const modelMessage: Message = { role: 'model', text: finalResponseText };
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setToolBeingUsed(null);
        }
    }, [chat, isLoading]);

    return { messages, sendMessage, isLoading, toolBeingUsed };
};
