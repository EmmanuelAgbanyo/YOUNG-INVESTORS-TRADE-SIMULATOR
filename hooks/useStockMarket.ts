
import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { ref, onValue, get, set, update } from 'firebase/database';
import { database } from '../firebase.ts';
import { apiClient } from './useAPI.ts';
import type { Stock, ProfileState, ToastMessage, NewsHeadline, MarketSentiment, TradeOrder, ActiveOrder, OrderHistoryItem, OHLC, UserProfile, Team, AdminSettings, UnsettledCashItem, MarketEvent, MarketStatus, PerformanceHistoryEntry } from '../types.ts';
import { TradeType, OrderType, OrderStatus } from '../types.ts';
import {
    DEFAULT_STARTING_CAPITAL, STOCKS_DATA, MARKET_OPEN_DELAY_MS,
    DEFAULT_ANNUAL_DRIFT, DEFAULT_ANNUAL_VOLATILITY, DEFAULT_EVENT_CHANCE_PER_TICK,
    DEFAULT_MARKET_DURATION_MINUTES, DEFAULT_CIRCUIT_BREAKER_ENABLED,
    DEFAULT_CIRCUIT_BREAKER_THRESHOLD, DEFAULT_CIRCUIT_BREAKER_HALT_SECONDS, DEFAULT_SIMULATION_SPEED,
    DEFAULT_INTEREST_RATE, DEFAULT_COMMISSION_FEE
} from '../constants.ts';

// Delay creation of the GoogleGenAI client until it's needed. The official
// `@google/genai` package may depend on Node APIs and can throw during module
// evaluation when bundled for the browser. Creating the client at module-load
// can crash the whole app and produce a blank page. Use a factory that
// attempts to create the real client and falls back to a lightweight mock.
let _ai: any = null;
const getAI = () => {
    if (_ai) return _ai;
    try {
        // Prefer runtime-injected key (index.html sets window.process.env.API_KEY)
        const key = typeof window !== 'undefined' && (window as any).process?.env?.API_KEY
            ? (window as any).process.env.API_KEY
            : (typeof process !== 'undefined' ? (process as any).env?.API_KEY : undefined);

        if (!key) throw new Error('No API key provided for GoogleGenAI');
        _ai = new GoogleGenAI({ apiKey: key });
        return _ai;
    } catch (err) {
        // Fallback: provide a minimal mock object used by the hooks so the app
        // can run without the real AI client in the browser.
        console.warn('GoogleGenAI not available in this environment, using mock:', err);
        _ai = {
            models: {
                generateContent: async () => ({ text: JSON.stringify({ headlines: [] }) }),
            },
            chats: {
                create: () => ({
                    sendMessage: async ({ message }: any) => ({ text: 'Mock AI response for message: ' + String(message) }),
                }),
            },
        };
        return _ai;
    }
};

const getProfileStateKey = (profileId: string) => `yin_trade_profile_${profileId}`;

export const MARKET_EVENTS_TEMPLATES: Omit<MarketEvent, 'duration' | 'expiresAt'>[] = [
    { title: 'BREAKING: Positive Economic Report', description: 'Stronger than expected GDP growth boosts investor confidence.', driftModifier: 0.15, volatilityModifier: 0.05 },
    { title: 'NEWS: Inflation Fears Rise', description: 'Concerns over rising inflation are causing market uncertainty and a potential downturn.', driftModifier: -0.20, volatilityModifier: 0.15 },
    { title: 'ALERT: Major Tech Sector Breakthrough', description: 'A significant technological advancement is driving a rally in growth stocks.', driftModifier: 0.25, volatilityModifier: 0.20 },
    { title: 'UPDATE: Global Supply Chain Issues', description: 'Disruptions in global supply chains are negatively impacting corporate earnings.', driftModifier: -0.15, volatilityModifier: 0.10 },
    { title: 'FLASH: Market Experiencing Unusual Stability', description: 'Low trading volume and a lack of news have led to a period of market calm.', driftModifier: 0, volatilityModifier: -0.10 },
];


export const useStockMarket = (activeProfile: UserProfile | null) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [profileState, setProfileState] = useState<ProfileState | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [news, setNews] = useState<NewsHeadline[]>([]);
    const [isNewsLoading, setIsNewsLoading] = useState(false);
    const [marketSentiment, setMarketSentiment] = useState<MarketSentiment>('Neutral');
    const [marketStatus, setMarketStatus] = useState<MarketStatus>('CLOSED');
    const [activeMarketEvent, setActiveMarketEvent] = useState<MarketEvent | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [marketOpenIndexPrice, setMarketOpenIndexPrice] = useState(0);
    const [circuitBreakerTriggered, setCircuitBreakerTriggered] = useState(false);

    const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
        try {
            const settingsJSON = localStorage.getItem('yin_trade_admin_settings');
            if (settingsJSON) {
                const parsed = JSON.parse(settingsJSON);
                return {
                    startingCapital: DEFAULT_STARTING_CAPITAL,
                    interestRate: DEFAULT_INTEREST_RATE,
                    commissionFee: DEFAULT_COMMISSION_FEE,
                    ...parsed,
                };
            }
        } catch (e) { console.error("Could not parse local admin settings", e); }
        return {
            startingCapital: DEFAULT_STARTING_CAPITAL,
            settlementCycle: 'T+2',
            baseDrift: DEFAULT_ANNUAL_DRIFT,
            baseVolatility: DEFAULT_ANNUAL_VOLATILITY,
            eventFrequency: DEFAULT_EVENT_CHANCE_PER_TICK,
            marketDurationMinutes: DEFAULT_MARKET_DURATION_MINUTES,
            circuitBreakerEnabled: DEFAULT_CIRCUIT_BREAKER_ENABLED,
            circuitBreakerThreshold: DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
            circuitBreakerHaltSeconds: DEFAULT_CIRCUIT_BREAKER_HALT_SECONDS,
            simulationSpeed: DEFAULT_SIMULATION_SPEED,
            interestRate: DEFAULT_INTEREST_RATE,
            commissionFee: DEFAULT_COMMISSION_FEE,
        };
    });

    // Firebase Subscriptions for Global State
    useEffect(() => {
        const unsubStatus = apiClient.subscribeMarketStatus((status) => {
            setMarketStatus(status);
        });
        const unsubSettings = apiClient.subscribeAdminSettings((settings) => {
            if (settings) {
                setAdminSettings(settings);
                // Also cache locally for offline/initial load
                localStorage.setItem('yin_trade_admin_settings', JSON.stringify(settings));
            }
        });

        return () => {
            unsubStatus();
            unsubSettings();
        };
    }, []);

    const profileIdToLoad = useMemo(() => {
        if (!activeProfile) return null;
        // For teams, all members share the leader's portfolio state.
        if (activeProfile.teamId) {
            try {
                const teams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
                const team = teams.find(t => t.id === activeProfile.teamId);
                return team ? team.leaderId : activeProfile.id; // Fallback to own ID if team not found
            } catch (e) {
                return activeProfile.id;
            }
        }
        return activeProfile.id; // Leader or solo user
    }, [activeProfile]);


    useEffect(() => {
        setIsLoaded(false);
        if (!profileIdToLoad) {
            setProfileState(null);
            setIsLoaded(true);
            return;
        }

        const syncProfileData = async () => {
            try {
                // 1. Try to fetch from Firebase first
                const [portfolioSnap, holdingsSnap, ordersSnap, historySnap] = await Promise.all([
                    get(ref(database, `portfolios/${profileIdToLoad}`)),
                    get(ref(database, `holdings/${profileIdToLoad}`)),
                    get(ref(database, `orders/${profileIdToLoad}`)),
                    get(ref(database, `history/${profileIdToLoad}`))
                ]);

                if (portfolioSnap.exists()) {
                    // Firebase has data - use it as source of truth
                    const firebaseState: ProfileState = {
                        portfolio: {
                            cash: portfolioSnap.val().cash,
                            unsettledCash: portfolioSnap.val().unsettledCash || [],
                            holdings: holdingsSnap.exists() ? holdingsSnap.val() : {}
                        },
                        activeOrders: ordersSnap.exists() ? Object.values(ordersSnap.val()) : [],
                        orderHistory: historySnap.exists() ? Object.values(historySnap.val()) : [],
                        performanceHistory: portfolioSnap.val().performanceHistory || []
                    };
                    setProfileState(firebaseState);
                } else {
                    // 2. No Firebase data - Check LocalStorage for migration
                    const savedStateJSON = localStorage.getItem(getProfileStateKey(profileIdToLoad));
                    if (savedStateJSON) {
                        const parsedState = JSON.parse(savedStateJSON);
                        // Ensure required arrays exist
                        if (!Array.isArray(parsedState.portfolio.unsettledCash)) parsedState.portfolio.unsettledCash = [];
                        if (!Array.isArray(parsedState.performanceHistory)) parsedState.performanceHistory = [];
                        setProfileState(parsedState);
                        
                        // Trigger an immediate migration to Firebase (Portfolio + Profile Info)
                        await Promise.all([
                            set(ref(database, `profiles/${profileIdToLoad}`), {
                                user_id: activeProfile?.id || profileIdToLoad,
                                name: activeProfile?.name || 'Anonymous Trader',
                                email: activeProfile?.email || '',
                                migratedAt: Date.now()
                            }),
                            set(ref(database, `portfolios/${profileIdToLoad}`), {
                                cash: parsedState.portfolio.cash,
                                unsettledCash: parsedState.portfolio.unsettledCash,
                                performanceHistory: parsedState.performanceHistory,
                                migratedFromLocal: true,
                                updatedAt: Date.now()
                            }),
                            set(ref(database, `holdings/${profileIdToLoad}`), parsedState.portfolio.holdings),
                            set(ref(database, `orders/${profileIdToLoad}`), parsedState.activeOrders),
                            set(ref(database, `history/${profileIdToLoad}`), parsedState.orderHistory)
                        ]);
                    } else {
                        // 3. New user - Initialize defaults in Firebase and State
                        const initialState: ProfileState = {
                            portfolio: { cash: adminSettings.startingCapital, unsettledCash: [], holdings: {} },
                            activeOrders: [],
                            orderHistory: [],
                            performanceHistory: [],
                        };
                        setProfileState(initialState);
                        
                        await Promise.all([
                            set(ref(database, `portfolios/${profileIdToLoad}`), {
                                cash: adminSettings.startingCapital,
                                unsettledCash: [],
                                performanceHistory: [],
                                createdAt: Date.now()
                            }),
                            set(ref(database, `holdings/${profileIdToLoad}`), {}),
                            set(ref(database, `orders/${profileIdToLoad}`), {}),
                            set(ref(database, `history/${profileIdToLoad}`), {})
                        ]);
                    }
                }
            } catch (e) {
                console.error("Firebase sync error, falling back to LocalStorage:", e);
                const savedStateJSON = localStorage.getItem(getProfileStateKey(profileIdToLoad));
                if (savedStateJSON) {
                    setProfileState(JSON.parse(savedStateJSON));
                } else {
                    // Critical Fallback: Initialize fresh state if both Firebase and Local fail
                    setProfileState({
                        portfolio: { cash: adminSettings.startingCapital, unsettledCash: [], holdings: {} },
                        activeOrders: [],
                        orderHistory: [],
                        performanceHistory: [],
                    });
                }
            } finally {
                setIsLoaded(true);
            }
        };

        syncProfileData();
    }, [profileIdToLoad, adminSettings.startingCapital]);

    // Save changes to Firebase and LocalStorage
    useEffect(() => {
        if (profileIdToLoad && profileState && isLoaded) {
            // Update LocalStorage for immediate feedback/offline
            localStorage.setItem(getProfileStateKey(profileIdToLoad), JSON.stringify(profileState));
            
            // Sync to Firebase in the background
            const saveToFirebase = async () => {
                try {
                    await Promise.all([
                        set(ref(database, `portfolios/${profileIdToLoad}`), {
                            cash: profileState.portfolio.cash,
                            unsettledCash: profileState.portfolio.unsettledCash,
                            performanceHistory: profileState.performanceHistory || [],
                            updatedAt: Date.now()
                        }),
                        set(ref(database, `holdings/${profileIdToLoad}`), profileState.portfolio.holdings),
                        set(ref(database, `orders/${profileIdToLoad}`), profileState.activeOrders),
                        set(ref(database, `history/${profileIdToLoad}`), profileState.orderHistory)
                    ]);
                } catch (e) {
                    console.error("Failed to persist state to Firebase:", e);
                }
            };
            saveToFirebase();
        }
    }, [profileIdToLoad, profileState, isLoaded]);


    const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
        setToast({ type, text });
    }, []);

    const fetchNews = useCallback(async () => {
        setIsNewsLoading(true);
        const stockList = STOCKS_DATA.map(s => `${s.name} (${s.symbol})`).join(', ');
        const prompt = `Generate 5 fictional, concise news headlines for a stock market game based on these Ghanaian companies: ${stockList}. The headlines should be plausible but not real. Categorize the impact of each headline as 'positive', 'negative', or 'neutral'.`;

        try {
            const client = getAI();
            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            headlines: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        symbol: { type: Type.STRING, description: 'The stock symbol (e.g., MTNGH)' },
                                        headline: { type: Type.STRING, description: 'The news headline.' },
                                        impact: { type: Type.STRING, description: "The perceived market impact: 'positive', 'negative', or 'neutral'." },
                                    },
                                    required: ['symbol', 'headline', 'impact']
                                }
                            }
                        }
                    },
                }
            });

            const json = JSON.parse(response.text);
            const headlines: NewsHeadline[] = json.headlines;
            setNews(headlines);
        } catch (e) {
            console.error("Failed to fetch news:", e);
        } finally {
            setIsNewsLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Auto-refresh news every 5 minutes so the feed feels truly live
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNews();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    // Re-fetch news whenever live market data arrives (new scraper cycle every 60s)
    const [lastStocksUpdateTime, setLastStocksUpdateTime] = useState(0);
    useEffect(() => {
        if (stocks.length === 0) return;
        const now = Date.now();
        // Only trigger if it's been at least 60s since last re-fetch to avoid spam
        if (now - lastStocksUpdateTime > 60000) {
            setLastStocksUpdateTime(now);
            // Stagger slightly so it doesn't hit at the exact same moment as scraper
            const delay = setTimeout(() => fetchNews(), 3000);
            return () => clearTimeout(delay);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stocks]);


    // LIVE DATA SYNC - Firebase RTDB Listener
    useEffect(() => {
        if (marketStatus !== 'OPEN') return;

        // Immediately sync data when market opens using Firebase Listener
        const marketRef = ref(database, 'market_data');
        const unsubscribe = onValue(marketRef, (snapshot) => {
            if (snapshot.exists()) {
                const liveDataMap = snapshot.val();
                
                setStocks(prev => {
                    if (prev.length === 0) {
                        return STOCKS_DATA.map(baseStock => {
                            const liveData = liveDataMap[baseStock.symbol];
                            return {
                                ...baseStock,
                                price: liveData ? liveData.price : baseStock.price,
                                lastPrice: liveData ? liveData.price : baseStock.price,
                            };
                        });
                    }

                    let updated = false;
                    const newStocks = prev.map(stock => {
                        const liveData = liveDataMap[stock.symbol];
                        if (liveData && liveData.price && Math.abs(liveData.price - stock.price) > 0.001) {
                            updated = true;
                            return {
                                ...stock,
                                lastPrice: stock.price,
                                price: liveData.price,
                                priceHistory: [...stock.priceHistory, { 
                                    open: stock.price, 
                                    high: Math.max(stock.price, liveData.price), 
                                    low: Math.min(stock.price, liveData.price), 
                                    close: liveData.price 
                                }].slice(-50)
                            };
                        }
                        return stock;
                    });
                    return updated ? newStocks : prev;
                });
            }
        }, (error) => {
            console.error('Firebase listen failed:', error);
            showToast('error', 'Could not sync live market data from Firebase.');
        });

        return () => {
            unsubscribe();
        };
    }, [marketStatus, showToast]);

    useEffect(() => {
        const initialIndex = STOCKS_DATA.reduce((sum, s) => sum + s.price, 0) / STOCKS_DATA.length;
        setMarketOpenIndexPrice(initialIndex);
        setCircuitBreakerTriggered(false);
    }, [marketStatus]);

    // Effect 1a: Market Clock Engine
    useEffect(() => {
        // This effect used to contain timers to automatically open and close the market.
        // It has been removed in favor of manual admin controls. The market will now
        // remain in its initial 'PRE_MARKET' state until an admin opens it.
    }, []);

    // Effect 1b: Events Engine
    useEffect(() => {
        if (marketStatus !== 'OPEN') return;

        // Event management (random and manual) runs throughout the open market session
        const eventInterval = setInterval(() => {
            // Check for manually triggered events from admin
            const manualEventJSON = localStorage.getItem('yin_trade_manual_event');
            if (manualEventJSON) {
                try {
                    const { eventName, timestamp } = JSON.parse(manualEventJSON);
                    if (Date.now() - timestamp < 5000) {
                        const template = MARKET_EVENTS_TEMPLATES.find(e => e.title === eventName);
                        if (template) {
                            const duration = 20000 + Math.random() * 20000;
                            const newEvent: MarketEvent = { ...template, duration, expiresAt: Date.now() + duration };
                            setActiveMarketEvent(newEvent);
                            showToast('info', newEvent.title);
                        }
                        localStorage.removeItem('yin_trade_manual_event');
                    }
                } catch (e) {
                    console.error("Could not parse manual event", e);
                    localStorage.removeItem('yin_trade_manual_event');
                }
            }

            // Random event logic using functional update to avoid stale state
            setActiveMarketEvent(currentEvent => {
                if (currentEvent && Date.now() >= currentEvent.expiresAt) {
                    showToast('info', "The market has stabilized.");
                    return null;
                } else if (!currentEvent && Math.random() < adminSettings.eventFrequency) {
                    const template = MARKET_EVENTS_TEMPLATES[Math.floor(Math.random() * MARKET_EVENTS_TEMPLATES.length)];
                    const duration = 20000 + Math.random() * 20000;
                    const newEvent: MarketEvent = { ...template, duration, expiresAt: Date.now() + duration };
                    showToast('info', newEvent.title);
                    return newEvent;
                }
                return currentEvent; // no change
            });
        }, 2000); // Check for events every 2 seconds

        return () => {
            clearInterval(eventInterval);
        };
    }, [marketStatus, adminSettings.eventFrequency, showToast]);

    // Effect 3: Order Processor & Circuit Breaker (Reacts to stock price changes)
    useEffect(() => {
        if (marketStatus !== 'OPEN' || !profileState || stocks.every((s, i) => s.price === STOCKS_DATA[i].price)) return;

        // Circuit Breaker Logic
        if (adminSettings.circuitBreakerEnabled && !circuitBreakerTriggered) {
            const currentIndex = stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length;
            const marketDrop = (marketOpenIndexPrice - currentIndex) / marketOpenIndexPrice;

            if (marketDrop >= adminSettings.circuitBreakerThreshold) {
                setCircuitBreakerTriggered(true);
                setMarketStatus('HALTED');
                showToast('error', `CIRCUIT BREAKER: Market has dropped ${adminSettings.circuitBreakerThreshold * 100}%. Trading halted!`);
                setTimeout(() => {
                    setMarketStatus('OPEN');
                    showToast('info', 'Trading has resumed.');
                }, adminSettings.circuitBreakerHaltSeconds * 1000);
                return; // Halt processing for this tick
            }
        }

        const getSettlementDelay = () => {
            const marketDurationMs = adminSettings.marketDurationMinutes * 60 * 1000;
            switch (adminSettings.settlementCycle) { case 'T+1': return marketDurationMs / 2.5; case 'T+3': return marketDurationMs; case 'T+2': default: return marketDurationMs * (2 / 3); }
        };
        const getPendingDuration = () => {
            switch (adminSettings.simulationSpeed) { case 'Slow': return 8000; case 'Fast': return 2500; case 'Normal': default: return 5000; }
        }

        setProfileState(prevState => {
            if (!prevState) return null;
            let newCash = prevState.portfolio.cash;
            type Holding = { symbol: string; quantity: number; avgCost: number };
            let newHoldings: Record<string, Holding> = { ...prevState.portfolio.holdings } as Record<string, Holding>;
            let newOrderHistory = [...prevState.orderHistory];
            const executedOrderIds = new Set<string>();
            const now = Date.now();

            const settledItems: UnsettledCashItem[] = [];
            const stillUnsettled = prevState.portfolio.unsettledCash.filter(item => { if (now >= item.settlesAt) { settledItems.push(item); return false; } return true; });
            if (settledItems.length > 0) {
                const totalSettled = settledItems.reduce((sum, item) => sum + item.amount, 0);
                newCash += totalSettled;
                showToast('info', `GHS ${totalSettled.toFixed(2)} from a sale has settled.`);
            }
            let newUnsettledCash = stillUnsettled;

            const processExecution = (order: ActiveOrder, executionPrice: number) => {
                let totalValue = order.quantity * executionPrice;
                const commission = totalValue * adminSettings.commissionFee;
                if (order.tradeType === TradeType.BUY) {
                    const existing = newHoldings[order.symbol];
                    newCash -= commission;
                    if (existing) {
                        const totalQuantity = existing.quantity + order.quantity;
                        const totalCost = (existing.avgCost * existing.quantity) + totalValue;
                        newHoldings[order.symbol] = { ...existing, quantity: totalQuantity, avgCost: totalCost / totalQuantity };
                    } else {
                        newHoldings[order.symbol] = { symbol: order.symbol, quantity: order.quantity, avgCost: executionPrice };
                    }
                } else { // SELL
                    const proceedsAfterCommission = totalValue - commission;
                    const settlementDelay = getSettlementDelay();
                    newUnsettledCash = [...newUnsettledCash, { amount: proceedsAfterCommission, settlesAt: Date.now() + settlementDelay }];
                    const existing = newHoldings[order.symbol];
                    if (existing.quantity === order.quantity) {
                        delete newHoldings[order.symbol];
                    } else {
                        newHoldings[order.symbol] = { ...existing, quantity: existing.quantity - order.quantity };
                    }
                }
                newOrderHistory.unshift({ id: order.id, symbol: order.symbol, name: order.name, tradeType: order.tradeType, orderType: order.orderType, quantity: order.quantity, finalStatus: OrderStatus.EXECUTED, timestamp: now, price: executionPrice, total: totalValue, traderId: order.traderId, traderName: order.traderName });
                showToast('success', `${order.tradeType} order by ${order.traderName} for ${order.quantity} ${order.symbol} executed at GHS ${executionPrice.toFixed(2)}. Fee: GHS ${commission.toFixed(2)}.`);
                executedOrderIds.add(order.id);
            };

            const PENDING_DURATION = getPendingDuration();
            const stillActiveOrders = prevState.activeOrders.map(order => {
                const stock = stocks.find(s => s.symbol === order.symbol);
                if (!stock || executedOrderIds.has(order.id)) return null;
                if (order.status === OrderStatus.PENDING && now >= order.submittedAt + PENDING_DURATION) { order.status = OrderStatus.WORKING; }
                if (order.status === OrderStatus.WORKING) {
                    switch (order.orderType) {
                        case OrderType.MARKET: processExecution(order as ActiveOrder, stock.price); return null;
                        case OrderType.LIMIT:
                            if ((order.tradeType === TradeType.BUY && stock.price <= order.limitPrice!) || (order.tradeType === TradeType.SELL && stock.price >= order.limitPrice!)) { processExecution(order as ActiveOrder, stock.price); return null; }
                            break;
                        case OrderType.TRAILING_STOP:
                            const newHighWaterMark = Math.max((order as ActiveOrder).highWaterMark!, stock.price);
                            const newTriggerPrice = newHighWaterMark * (1 - (order as ActiveOrder).trailPercent!);
                            if (stock.price <= newTriggerPrice) { processExecution(order as ActiveOrder, stock.price); return null; }
                            return { ...(order as ActiveOrder), highWaterMark: newHighWaterMark, triggerPrice: newTriggerPrice };
                    }
                }
                return order;
            }).filter((o): o is ActiveOrder => o !== null);

            let newHoldingsValue = 0;
            Object.values(newHoldings).forEach(holding => {
                const stock = stocks.find(s => s.symbol === holding.symbol);
                if (stock) {
                    newHoldingsValue += stock.price * holding.quantity;
                }
            });

            const totalUnsettled = newUnsettledCash.reduce((sum, item) => sum + item.amount, 0);
            const newPortfolioValue = newCash + totalUnsettled + newHoldingsValue;

            const newPerformanceHistory: PerformanceHistoryEntry[] = [
                ...prevState.performanceHistory,
                { timestamp: now, portfolioValue: newPortfolioValue }
            ].slice(-100);

            return {
                portfolio: { cash: newCash, unsettledCash: newUnsettledCash, holdings: newHoldings },
                activeOrders: stillActiveOrders,
                orderHistory: newOrderHistory,
                performanceHistory: newPerformanceHistory,
            };
        });
    }, [stocks, marketStatus, adminSettings, circuitBreakerTriggered, marketOpenIndexPrice, showToast]); // Reacts to changes in stocks, market status, and other critical state.

    const placeOrder = useCallback((order: TradeOrder) => {
        if (marketStatus !== 'OPEN') {
            showToast('error', 'Market is closed or halted. No orders can be placed.');
            return false;
        }
        if (!profileState || !activeProfile) return false;

        const stock = stocks.find(s => s.symbol === order.symbol);
        if (!stock) {
            showToast('error', 'Stock not found.');
            return false;
        }

        const cost = order.quantity * (order.limitPrice || stock.price);
        const commission = cost * adminSettings.commissionFee;

        if (order.tradeType === TradeType.BUY) {
            if (profileState.portfolio.cash < (cost + commission)) {
                showToast('error', 'Insufficient funds for cost + commission.');
                return false;
            }
        } else { // SELL
            const holding = profileState.portfolio.holdings[order.symbol];
            if (!holding || holding.quantity < order.quantity) {
                showToast('error', 'Not enough shares to sell.');
                return false;
            }
        }

        const now = Date.now();
        const newOrder: ActiveOrder = {
            id: `ord_${now}`,
            symbol: order.symbol, name: stock.name, tradeType: order.tradeType, orderType: order.orderType,
            quantity: order.quantity, status: OrderStatus.PENDING, createdAt: now, submittedAt: now,
            traderId: activeProfile.id, traderName: activeProfile.name,
            limitPrice: order.limitPrice, trailPercent: order.trailPercent,
            highWaterMark: order.orderType === OrderType.TRAILING_STOP ? stock.price : undefined,
            triggerPrice: order.orderType === OrderType.TRAILING_STOP ? stock.price * (1 - order.trailPercent!) : undefined,
        };

        setProfileState(prev => {
            if (!prev) return null;
            let newPortfolio = { ...prev.portfolio };

            if (order.tradeType === TradeType.BUY) {
                // Reserve cash for the order. Commission will be deducted upon execution.
                const reservationCost = order.orderType === OrderType.LIMIT ? cost : stock.price * order.quantity;
                newPortfolio.cash -= reservationCost;
            }

            return {
                ...prev,
                portfolio: newPortfolio,
                activeOrders: [...prev.activeOrders, newOrder]
            };
        });

        // showToast('success', `${order.orderType} order for ${order.symbol} placed successfully.`);
        return true;

    }, [stocks, profileState, marketStatus, showToast, activeProfile, adminSettings.commissionFee]);

    const cancelOrder = useCallback((orderId: string) => {
        setProfileState(prev => {
            if (!prev) return null;

            const orderToCancel = prev.activeOrders.find(o => o.id === orderId);
            if (!orderToCancel) return prev;

            const newPortfolio = { ...prev.portfolio };
            if (orderToCancel.tradeType === TradeType.BUY) {
                const stock = stocks.find(s => s.symbol === orderToCancel.symbol);
                const price = orderToCancel.limitPrice || stock?.price || 0;
                // Return the reserved cash
                const cost = orderToCancel.quantity * price;
                newPortfolio.cash += cost;
            }

            const newOrderHistory: OrderHistoryItem[] = [{
                id: orderToCancel.id, symbol: orderToCancel.symbol, name: orderToCancel.name, tradeType: orderToCancel.tradeType,
                orderType: orderToCancel.orderType, quantity: orderToCancel.quantity, finalStatus: OrderStatus.CANCELLED, timestamp: Date.now(),
                traderId: orderToCancel.traderId, traderName: orderToCancel.traderName,
            }, ...prev.orderHistory];

            showToast('info', `Order for ${orderToCancel.symbol} has been cancelled.`);
            return {
                ...prev,
                portfolio: newPortfolio,
                activeOrders: prev.activeOrders.filter(o => o.id !== orderId),
                orderHistory: newOrderHistory
            };
        });
    }, [stocks, showToast]);

    return {
        stocks,
        profileState,
        placeOrder,
        cancelOrder,
        toast,
        setToast,
        news,
        isNewsLoading,
        fetchNews,
        marketSentiment,
        marketStatus,
        activeMarketEvent,
        isLoaded,
        adminSettings,
        syncLiveData: () => {}, // Kept for backwards compatibility but does nothing manually now
    };
};
