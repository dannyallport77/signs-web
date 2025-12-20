'use client';

import React, { useState } from 'react';
import WheelOfFortune from './WheelOfFortune';
import ScratchCardGame from './ScratchCardGame';
import FruitMachineGame from './FruitMachineGame';

interface Prize {
  id: string;
  name: string;
  emoji: string;
  probability: number;
}

interface GameSelectorProps {
  promotionId: string;
  placeId: string;
  businessId?: string;
  businessName: string;
  giftName: string;
  giftEmoji: string;
  winOdds?: number;
  prizes?: Prize[];
}

type GameType = 'fruit-machine' | 'scratch-card' | 'spin-wheel';

export default function GameSelector({ promotionId, placeId, businessId, businessName, giftName, giftEmoji, winOdds = 0.15, prizes }: GameSelectorProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [result, setResult] = useState<{ won: boolean; prize: string } | null>(null);

  const handleGameFinish = async (won: boolean, prize: string) => {
    setGameFinished(true);
    setResult({ won, prize });
    
    try {
      await fetch('/api/fruit-machine/spins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId || 'unknown', // Fallback
          placeId,
          promotionId,
          winnerCode: `web-${Date.now()}`,
          prizeType: 'gift', // TODO: Determine type from prize object if available
          prizeName: prize,
          isWin: won,
          gameType: selectedGame
        })
      });
    } catch (e) {
      console.error('Failed to record spin', e);
    }
  };

  // Determine result (simple random for now, should ideally come from server)
  // In a real app, we'd call an API to get the result before the game starts or during spin
  const determineResult = () => {
    // New Logic: Multiple Prizes
    if (prizes && prizes.length > 0) {
      const random = Math.random();
      let cumulativeProbability = 0;
      
      // Normalize probabilities if they don't sum to 1 (assuming they are 0-1 or 0-100)
      // But let's assume they are raw probabilities (e.g. 0.05 for 5%)
      // Or if they are percentages (5, 10, 20), we divide by 100.
      // The mobile app sends "probability" as a number. Let's assume it's percentage (0-100) based on mobile code "winProbability".
      // Actually, mobile app code had "probability: 15" (integer).
      
      for (const prize of prizes) {
        // Convert percentage to decimal if > 1, else assume decimal
        const prob = prize.probability > 1 ? prize.probability / 100 : prize.probability;
        cumulativeProbability += prob;
        
        if (random < cumulativeProbability) {
          return {
            won: true,
            prize: prize.name,
            emoji: prize.emoji
          };
        }
      }
      
      return {
        won: false,
        prize: 'Better luck next time!',
        emoji: '😢'
      };
    }

    // Legacy Logic: Single Gift
    const won = Math.random() < winOdds;
    return {
      won,
      prize: won ? giftName : 'Better luck next time!',
      emoji: won ? giftEmoji : '😢'
    };
  };

  const [preDeterminedResult] = useState(determineResult());

  if (!selectedGame) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-2 uppercase tracking-wider">
            {businessName}
          </h2>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Choose Your Game
          </h1>
          <p className="text-xl text-indigo-200">
            How do you want to win your {giftName}?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setSelectedGame('fruit-machine')}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-yellow-500/50 hover:border-yellow-400 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20"
          >
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🎰</div>
            <h3 className="text-2xl font-bold text-white mb-2">Fruit Machine</h3>
            <p className="text-slate-400">Classic casino style fun</p>
          </button>

          <button
            onClick={() => setSelectedGame('scratch-card')}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🎫</div>
            <h3 className="text-2xl font-bold text-white mb-2">Scratch Card</h3>
            <p className="text-slate-400">Scratch to reveal your prize</p>
          </button>

          <button
            onClick={() => setSelectedGame('spin-wheel')}
            className="group relative bg-slate-800 hover:bg-slate-700 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20"
          >
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🎡</div>
            <h3 className="text-2xl font-bold text-white mb-2">Spin Wheel</h3>
            <p className="text-slate-400">Spin the wheel of fortune</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      <button 
        onClick={() => setSelectedGame(null)}
        className="self-start mb-8 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
      >
        ← Choose Different Game
      </button>

      <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-yellow-400 mb-1">
            {businessName}
          </h3>
          <h2 className="text-3xl font-bold text-white mb-2">
            {selectedGame === 'fruit-machine' && '🎰 Spin To Win'}
            {selectedGame === 'scratch-card' && '🎫 Scratch & Win'}
            {selectedGame === 'spin-wheel' && '🎡 Wheel of Fortune'}
          </h2>
          <p className="text-indigo-200">
            Win a free {giftName}!
          </p>
        </div>

        <div className="flex justify-center min-h-[400px] items-center">
          {selectedGame === 'fruit-machine' && (
            <FruitMachineGame 
              giftEmoji={giftEmoji}
              onSpinFinish={() => handleGameFinish(preDeterminedResult.won, preDeterminedResult.prize)}
            />
          )}

          {selectedGame === 'scratch-card' && (
            <ScratchCardGame 
              result={preDeterminedResult.prize}
              resultEmoji={preDeterminedResult.emoji}
              isWinner={preDeterminedResult.won}
              onReveal={() => handleGameFinish(preDeterminedResult.won, preDeterminedResult.prize)}
            />
          )}

          {selectedGame === 'spin-wheel' && (
            <WheelOfFortune 
              giftName={giftName}
              businessName={businessName}
              promotionId={promotionId}
            />
          )}
        </div>
      </div>

      {gameFinished && selectedGame !== 'spin-wheel' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center transform scale-100 animate-in zoom-in-95 duration-300">
            <div className="text-6xl mb-4">
              {preDeterminedResult.won ? '🎉' : '😢'}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {preDeterminedResult.won ? 'WINNER!' : 'Not this time'}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {preDeterminedResult.prize}
            </p>
            {preDeterminedResult.won && (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                Show this screen to staff to claim your prize!
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
