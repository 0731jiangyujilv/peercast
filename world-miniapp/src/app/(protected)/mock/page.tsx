'use client';

import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { useEffect, useState } from 'react';

interface Message {
  id: number;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: string;
  emoji?: string;
  details?: string[];
}

const mockMessages: Message[] = [
  {
    id: 1,
    type: 'user',
    content: '@peer_cast_bot predict with @jerrycat2019 1usdc for BTC up in 5m',
    timestamp: '8:11 PM',
  },
  {
    id: 2,
    type: 'bot',
    content: '✅ @jamesharbert has connected their wallet.\n💰 Waiting for @jerrycat2019 to connect...',
    timestamp: '9:12 PM',
  },
  {
    id: 3,
    type: 'bot',
    content: '✅ @jerrycat2019 has connected their wallet.\n💰 Waiting for @jerrycat2019 to connect...',
    timestamp: '9:12 PM',
  },
  {
    id: 4,
    type: 'bot',
    content: '🎯 Prediction Created!',
    emoji: '🎯',
    timestamp: '9:13 PM',
    details: [
      '📊 Market: BTC/USD',
      '💵 Amount: 1 USDC',
      '⏱️ Duration: 5 minutes',
      '📈 @jamesharbert predicts: UP',
      '📉 @jerrycat2019 predicts: DOWN',
      '🔒 Both parties have deposited 1 USDC',
    ],
  },
  {
    id: 5,
    type: 'system',
    content: 'Waiting for price settlement...',
    timestamp: '9:18 PM',
  },
  {
    id: 6,
    type: 'bot',
    content: '🏆 Prediction Settled!',
    emoji: '🏆',
    timestamp: '9:20 PM',
    details: [
      '🎉 Winner: @jamesharbert',
      '💰 Won: 2 USDC',
      '📊 BTC/USD: $67196.02 → $67333.385',
      '📈 Price went UP as predicted!',
    ],
  },
  {
    id: 7,
    type: 'bot',
    content: '✅ @jamesharbert has received 2 USDC',
    timestamp: '9:20 PM',
  },
  {
    id: 8,
    type: 'bot',
    content: '📊 Platform Statistics',
    emoji: '📊',
    timestamp: '10:14 PM',
    details: [
      '🎯 Active predictions: 0',
      '📝 Total predictions: 2',
      '💵 Total Volume: 2.00 USDC',
      '✅ Settled predictions: 2',
    ],
  },
];

export default function MockPage() {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < mockMessages.length) {
      const timer = setTimeout(() => {
        setDisplayedMessages((prev) => [...prev, mockMessages[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="PeerCast"
          startAdornment={
            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col mb-16 p-0">
        <div className="flex-1 overflow-y-auto bg-[#d4e4c8] min-h-screen p-4 space-y-3">
          {displayedMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {message.type === 'bot' && (
                <div className="flex-shrink-0 mr-2">
                  <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    P
                  </div>
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-[#dcf8c6] rounded-tr-none'
                    : message.type === 'system'
                      ? 'bg-gray-200 text-gray-600 text-sm text-center mx-auto'
                      : 'bg-white rounded-tl-none'
                }`}
              >
                {message.type === 'bot' && message.emoji && (
                  <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <span className="text-xl">{message.emoji}</span>
                    <span>PeerCast</span>
                  </div>
                )}
                <div className="text-gray-800 whitespace-pre-line text-[15px]">
                  {message.content}
                </div>
                {message.details && (
                  <div className="mt-2 space-y-1 text-[14px] text-gray-700 border-t border-gray-200 pt-2">
                    {message.details.map((detail, idx) => (
                      <div key={idx}>{detail}</div>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-gray-500 mt-1 text-right">
                  {message.timestamp}
                  {message.type === 'user' && (
                    <span className="ml-1 text-green-600">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Page.Main>
    </>
  );
}
