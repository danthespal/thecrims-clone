'use client';

import { motion } from 'framer-motion';
import CardImage from '@/components/dashboard/Casino/CardImage';
import useBlackjackClientGame from '@/hooks/useBlackjackGame';

interface BlackjackGameProps {
  onResult?: () => void;
}

export default function BlackjackGame({ onResult }: BlackjackGameProps) {
  const {
    bet,
    setBet,
    playerHand,
    dealerHand,
    revealedDealerCards,
    playerScore,
    dealerScore,
    casinoBalance,
    netGain,
    phase,
    resultText,
    history,
    loading,
    startGame,
    hit,
    stand,
  } = useBlackjackClientGame(onResult);

  const chips = [10, 50, 100, 250, 500];

  return (
    <div className="bg-green-900 flex items-start justify-center gap-6 px-4 py-10 text-white">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Game Table */}
        <div className="space-y-8 bg-black bg-opacity-40 rounded-xl p-6 shadow-lg w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Blackjack</h2>
          <p className="text-sm text-gray-300 italic mb-6">Blackjack pays 3:2</p>

          {phase !== 'idle' && (
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-teal-300">Dealer&#39;s Hand</h3>
                <div className="flex justify-center gap-2 py-2">
                  {phase === 'player' && dealerHand.length === 2 ? (
                    <>
                      <CardImage card={dealerHand[1]} />
                      <CardImage card={dealerHand[0]} faceDown />
                    </>
                  ) : (
                    revealedDealerCards.map((card, i) => (
                      <CardImage key={i} card={card} delay={i * 0.2} />
                    ))
                  )}
                </div>
                <p className="text-sm">Total: {phase === 'done' ? dealerScore : '???'}</p>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-teal-300">Your Hand</h3>
                <div className="flex justify-center gap-2 py-2">
                  {playerHand.map((card, i) => (
                    <CardImage key={i} card={card} />
                  ))}
                </div>
                <p className="text-sm">Total: {playerScore}</p>
              </div>
            </>
          )}

          {phase === 'player' && (
            <div className="flex justify-center gap-4">
              <button onClick={hit} className="bg-yellow-500 hover:bg-yellow-400 px-4 py-2 rounded font-bold">Hit</button>
              <button onClick={stand} className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded font-bold">Stand</button>
            </div>
          )}

          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center animate-pulse"
            >
              <p className="text-lg font-bold">
                🎲 Result: {resultText === 'BLACKJACK' ? 'BLACKJACK 🎉' : resultText}
              </p>
              {netGain !== null && (
                <p className="text-sm text-gray-300">{netGain > 0 ? `+${netGain}` : `${netGain}`} 💰</p>
              )}
              <p className="mb-2">💰 Your balance: ${casinoBalance}</p>
              <button onClick={startGame} className="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded">
                Play Again
              </button>
            </motion.div>
          )}

          {/* Betting Controls */}
          <div className="text-center">
            <p className="text-sm text-gray-400">Choose your bet:</p>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setBet(chip)}
                  disabled={casinoBalance !== null && chip > casinoBalance}
                  className={`px-4 py-2 rounded font-bold border transition-transform hover:scale-110 ${
                    bet === chip
                      ? 'bg-yellow-400 text-black border-yellow-500'
                      : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                  } ${
                    casinoBalance !== null && chip > casinoBalance
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  ${chip}
                </button>
              ))}
            </div>
          </div>

          {phase === 'idle' && (
            <div className="text-center">
              <button
                onClick={startGame}
                disabled={loading || (casinoBalance !== null && casinoBalance <= 0)}
                className="mt-4 bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-semibold disabled:opacity-50"
              >
                {casinoBalance !== null && casinoBalance <= 0
                  ? 'Insufficient Funds'
                  : loading
                  ? 'Dealing...'
                  : 'Start Game'}
              </button>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="bg-black bg-opacity-40 rounded-xl p-6 shadow-lg w-full max-w-sm sticky top-10 h-fit">
          <h4 className="text-sm font-semibold text-teal-300 mb-4">Last 5 Rounds</h4>
          {history.length === 0 ? (
            <p className="text-gray-400 italic">No rounds yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-300">
              {history.map((h, idx) => (
                <li key={idx} className="border-b border-gray-700 pb-1">
                  <span className="text-teal-500 font-semibold">Round {h.round}:</span>
                  🧑 {h.player.join(' ')} vs 🃏 {h.dealer.join(' ')} —{' '}
                  <span className="ml-2 font-bold text-teal-400">{h.result}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
