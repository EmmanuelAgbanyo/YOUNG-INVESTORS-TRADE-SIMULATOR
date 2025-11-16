

import React from 'react';
import type { Module } from './types.ts';
import LessonContent from './components/LessonContent.tsx';

export const ACADEMY_MODULES: Module[] = [
  {
    id: 'module-1',
    title: 'Trading Foundations',
    description: 'Start your journey here. Learn the essential concepts that every trader needs to know.',
    lessons: [
      {
        id: 'intro-to-trading',
        title: 'Introduction to Stock Trading',
        content: React.createElement(LessonContent, { title: "Welcome to the Market!", children: [
          React.createElement("p", { key: 1 }, "Stock trading is the buying and selling of shares in a publicly-traded company. When you buy a stock, you're purchasing a small piece of ownership in that company."),
          React.createElement("p", { key: 2 }, "The goal is simple: ", React.createElement("strong", null, "Buy low, sell high."), " The value of your stocks will fluctuate based on the company's performance, industry trends, and overall market sentiment. This simulator lets you experience these dynamics without any real financial risk.")
        ]}),
        videoId: '_8_dY8T1pso', // A relevant video on what is a stock market
      },
      {
        id: 'market-orders',
        title: 'Understanding Market Orders',
        content: React.createElement(LessonContent, { title: "Executing Trades: The Market Order", children: [
          React.createElement("p", { key: 1 }, "A ", React.createElement("strong", null, "Market Order"), " is the most straightforward way to buy or sell a stock. It tells your broker to execute the trade immediately at the best available price in the current market."),
          React.createElement("p", { key: 2 }, React.createElement("strong", null, "Pros:"), " Guaranteed and fast execution."),
          React.createElement("p", { key: 3 }, React.createElement("strong", null, "Cons:"), " The price you get might be slightly different from the price you saw when you placed the order. This is known as \"slippage.\"")
        ]}),
        quiz: [
          {
            question: 'What is the main advantage of a Market Order?',
            options: ['You get to set the exact price', 'It executes quickly and is guaranteed to be filled', 'It protects you from losses'],
            correctAnswerIndex: 1,
            explanation: 'Market Orders prioritize speed and certainty of execution over a specific price. They are filled at the next available market price.'
          },
        ],
      },
       {
        id: 'limit-orders',
        title: 'Using Limit Orders for Price Control',
        content: React.createElement(LessonContent, { title: "Precision Trading: The Limit Order", children: [
          React.createElement("p", { key: 1 }, "A ", React.createElement("strong", null, "Limit Order"), " gives you control over the price at which your trade is executed. You specify the maximum price you're willing to pay for a stock (for a buy order) or the minimum price you're willing to accept (for a sell order)."),
          React.createElement("p", { key: 2 }, React.createElement("strong", null, "Pros:"), " You're protected from paying more or selling for less than you want."),
          React.createElement("p", { key: 3 }, React.createElement("strong", null, "Cons:"), " Your order is not guaranteed to execute. If the stock's price never reaches your limit price, the trade won't happen.")
        ]}),
        quiz: [
          {
            question: 'When would a Buy Limit Order for GHS 5.00 execute?',
            options: ['When the stock price is GHS 5.10', 'When the stock price is GHS 5.00 or less', 'As soon as you place it, regardless of price'],
            correctAnswerIndex: 1,
            explanation: 'A Buy Limit Order sets a maximum price. The trade will only go through if the market price is at or below your specified limit.'
          },
        ],
      },
    ]
  },
  {
    id: 'module-2',
    title: 'Advanced Techniques',
    description: 'Learn sophisticated order types and strategies to protect your capital and maximize returns.',
    lessons: [
       {
        id: 'trailing-stop-orders',
        title: 'Protecting Profits with Trailing Stops',
        content: React.createElement(LessonContent, { title: "Dynamic Profit Protection: The Trailing Stop", children: [
          React.createElement("p", { key: 1 }, "A ", React.createElement("strong", null, "Trailing Stop Order"), " is a powerful tool for risk management, designed to lock in profits while a stock price is rising. It's only used for selling."),
          React.createElement("p", { key: 2 }, "You set a 'trail' as a percentage (e.g., 10%) below the current market price. As the stock price increases, the stop-loss price moves up with it, always maintaining that 10% distance. If the stock price falls and hits your trailing stop price, a market order is triggered to sell your shares."),
          React.createElement("p", { key: 3 }, React.createElement("strong", null, "Example:"), " You buy a stock at GHS 10. You set a 10% trailing stop, so your initial stop price is GHS 9. The stock rises to GHS 15. Your stop price has automatically trailed up to GHS 13.50. If the stock then drops to GHS 13.50, your sell order is triggered.")
        ]}),
        videoId: '4zI0Yc5_v5w',
        quiz: [
          {
            question: 'What is the primary purpose of a Trailing Stop Order?',
            options: ['To buy stocks at the lowest possible price', 'To guarantee a specific selling price in the future', 'To protect profits by selling a stock if its price drops by a certain percentage'],
            correctAnswerIndex: 2,
          },
        ],
      },
      {
        id: 'risk-management',
        title: 'Fundamentals of Risk Management',
        content: React.createElement(LessonContent, { title: "Protecting Your Capital", children: [
          React.createElement("p", { key: 1 }, "Professional trading isn't just about picking winners; it's about managing losers. ", React.createElement("strong", null, "Risk management"), " is the foundation of long-term success."),
          React.createElement("h4", { key: 2 }, "The 1% Rule"),
          React.createElement("p", { key: 3 }, "A common guideline is to never risk more than 1% of your total portfolio value on a single trade. If your portfolio is GHS 100,000, you should not stand to lose more than GHS 1,000 on any one position."),
          React.createElement("h4", { key: 4 }, "Position Sizing"),
          React.createElement("p", { key: 5 }, "Based on the 1% rule, you can calculate how many shares to buy. If you want to buy a GHS 20 stock and decide you'll sell if it drops to GHS 18 (a GHS 2 loss per share), you can buy 500 shares (GHS 1,000 risk / GHS 2 per share loss)."),
           React.createElement("p", { key: 6 }, "This ensures that a single bad trade won't significantly damage your overall portfolio.")
        ]}),
        quiz: [
          {
            question: 'With a GHS 50,000 portfolio, what is the maximum you should risk on a single trade according to the 1% rule?',
            options: ['GHS 100', 'GHS 500', 'GHS 1,000', 'GHS 5,000'],
            correctAnswerIndex: 1,
            explanation: 'The 1% rule suggests risking no more than 1% of your total account value. 1% of GHS 50,000 is GHS 500.'
          },
        ],
      }
    ]
  }
];
