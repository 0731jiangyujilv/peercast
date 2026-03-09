'use client';

import { Logo } from '@/components/Logo';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative overflow-hidden">
      {/* Network background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="network" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="2" fill="#666" opacity="0.5"/>
              <line x1="100" y1="100" x2="200" y2="50" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="150" y2="200" stroke="#444" strokeWidth="1" opacity="0.3"/>
              <line x1="100" y1="100" x2="50" y2="180" stroke="#444" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#network)"/>
        </svg>
      </div>
      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center min-h-screen px-12 py-20">
        <div className="max-w-3xl space-y-8">
          <Logo size="lg" className="justify-start mb-12" />
          
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className="text-white text-3xl mt-1">↗</span>
              <h1 className="text-white text-5xl font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
                a social-native prediction network
              </h1>
            </div>
            
            <p className="text-[#888] text-2xl pl-12" style={{ fontFamily: 'Arial, sans-serif' }}>
              chat → smart contract → chainlink cre → settlement
            </p>


            <div className="pl-12 pt-8">
              <button
                type="button"
                onClick={() => router.push('/create')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#3a3a3a] bg-[#2a2a2a] px-6 py-3 text-white transition-all duration-200 hover:scale-105 hover:border-[#ff4d1f] hover:bg-[#333]"
                style={{ fontFamily: 'Arial, sans-serif', color: 'white' }}
              >
                Create Prediction
                <span aria-hidden="true" className="text-[#ff4d1f]">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
