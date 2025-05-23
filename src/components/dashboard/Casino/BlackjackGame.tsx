'use client';

import { useState } from 'react';

interface BlackjackGameProps {
  onResult?: () => void;
}

export default function BlackjackGame({ onResult }: BlackjackGameProps) {
  const chips = [10, 50, 100, 250, 500];
  const [bet, setBet] = useState(10);
  const [round, setRound] = useState(1);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [revealedDealerCards, setRevealedDealerCards] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'player' | 'dealer' | 'done'>('idle');
  const [resultText, setResultText] = useState('');
  const [casinoBalance, setCasinoBalance] = useState<number | null>(null);
  const [netGain, setNetGain] = useState<number | null>(null);
  const [history, setHistory] = useState<{
    round: number;
    player: string[];
    dealer: string[];
    result: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    setPhase('idle');
    setPlayerHand([]);
    setDealerHand([]);
    setRevealedDealerCards([]);
    setNetGain(null);
    try {
      const res = await fetch('/api/casino/blackjack/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet }),
      });
      const data = await res.json();
      if (!data || data.error) throw new Error(data?.error || 'Unknown error');

      setPlayerHand(data.player);
      setDealerHand(data.dealer);
      setPlayerScore(data.playerScore);
      setCasinoBalance(data.casinoBalance);
      setRound((prev) => prev + 1);
      onResult?.();

      if (data.playerScore === 21 && data.player.length === 2) {
        setResultText('BLACKJACK');
        resolveResult('BLACKJACK');
        setPhase('done');
      } else {
        setPhase('player');
      }
    } catch (err) {
      console.error('Start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const hit = async () => {
    try {
      const res = await fetch('/api/casino/blackjack/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hand: playerHand }),
      });
      const data = await res.json();
      if (!data || data.error) throw new Error(data?.error || 'Hit failed');

      setPlayerHand(data.updatedHand);
      setPlayerScore(data.score);

      if (data.bust) {
        setDealerScore(data.dealerScore);
        determineWinner(data.dealerScore, data.score);
      }
    } catch (err) {
      console.error('Hit error:', err);
    }
  };

  const stand = async () => {
    setPhase('dealer');
    try {
      const res = await fetch('/api/casino/blackjack/stand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerHand }),
      });
      const data = await res.json();

      if (!data || data.error) throw new Error(data?.error || 'Stand failed');

      setDealerHand(data.dealerHand);
      setRevealedDealerCards(data.dealerHand);
      setDealerScore(data.dealerScore);
      determineWinner(data.dealerScore, playerScore);
    } catch (err) {
      console.error('Stand error:', err);
    }
  };

  const determineWinner = (finalDealerScore: number, finalPlayerScore: number) => {
    let outcome = '';

    if (finalPlayerScore > 21) {
      outcome = 'LOSE';
    } else if (finalDealerScore > 21) {
      outcome = 'WIN';
    } else if (finalPlayerScore > finalDealerScore) {
      outcome = 'WIN';
    } else if (finalPlayerScore < finalDealerScore) {
      outcome = 'LOSE';
    } else {
      outcome = 'DRAW';
    }

    setResultText(outcome);
    setPhase('done');
    setHistory((prev) => [
      { round: round - 1, player: playerHand, dealer: dealerHand, result: outcome },
      ...prev,
    ].slice(0, 5));
    resolveResult(outcome);
  };

  const resolveResult = async (outcome: string) => {
    try {
      const res = await fetch('/api/casino/blackjack/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bet,
          result: outcome === 'BLACKJACK' ? 'blackjack' : outcome.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setCasinoBalance(data.casinoBalance);
        setNetGain(data.payout);
        onResult?.();
      }
    } catch (error) {
      console.error('Resolve error:', error);
    }
  };

  const formatCard = (card: string) => {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return `${card}${suit}`;
  };

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-2">
        <p className="text-sm text-gray-400">Choose your bet:</p>
        <div className="flex gap-3">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setBet(chip)}
              className={`px-4 py-2 rounded font-bold border ${
                bet === chip
                  ? 'bg-yellow-400 text-black border-yellow-500'
                  : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
              }`}
            >
              ${chip}
            </button>
          ))}
        </div>
      </div>

      {phase === 'idle' && (
        <button
          onClick={startGame}
          disabled={loading}
          className="mt-4 bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-semibold disabled:opacity-50"
        >
          {loading ? 'Dealing...' : 'Start Game'}
        </button>
      )}

      {phase === 'player' && (
        <div className="space-x-4">
          <button onClick={hit} className="bg-yellow-500 hover:bg-yellow-400 px-4 py-2 rounded">Hit</button>
          <button onClick={stand} className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded">Stand</button>
        </div>
      )}

      {phase !== 'idle' && (
        <div className="mt-6 bg-gray-900 p-4 rounded border border-gray-700 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-teal-400">Round {round - 1} - Blackjack</h3>
            <p>Your Hand: {playerHand.map(formatCard).join(' ')} (Total: {playerScore})</p>
            <p>Dealer&apos;s Hand: {revealedDealerCards.length === 0 ? '🂠' : revealedDealerCards.map(formatCard).join(' ')} {phase === 'done' && `(Total: ${dealerScore})`}</p>
          </div>
          {phase === 'done' && (
            <div className="animate-pulse">
              <p className="text-lg font-bold">
                🎲 Result: {resultText === 'BLACKJACK' ? 'BLACKJACK 🎉' : resultText}
              </p>
              {netGain !== null && (
                <p className="text-sm text-gray-300">{netGain > 0 ? `+${netGain}` : `${netGain}`} 💰</p>
              )}
              <p>💰 Your balance: ${casinoBalance}</p>
              <button onClick={startGame} className="mt-2 bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded">Play Again</button>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h4 className="text-sm font-semibold text-teal-300 mb-2">Last 5 Rounds</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            {history.map((h, idx) => (
              <li key={idx} className="border-b border-gray-700 pb-1">
                <span className="text-teal-500 font-semibold">Round {h.round}:</span> 🧑 {h.player.map(formatCard).join(' ')} vs 🃏 {h.dealer.map(formatCard).join(' ')} —
                <span className="ml-2 font-bold text-teal-400">{h.result}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
