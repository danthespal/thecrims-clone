'use client';

import { useState } from 'react';

interface BlackjackGameProps {
  onResult?: () => void;
}

const CARD_VALUES: Record<string, number> = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, 10: 10,
  J: 10, Q: 10, K: 10, A: 11,
};

const drawCard = (): string => {
  const faces = Object.keys(CARD_VALUES);
  const random = Math.floor(Math.random() * faces.length);
  return faces[random];
};

const calculateScore = (hand: string[]) => {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += CARD_VALUES[card];
    if (card === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

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
      const score = calculateScore(data.player);
      setPlayerScore(score);
      setCasinoBalance(data.casinoBalance);
      setRound((prev) => prev + 1);
      onResult?.();

      if (score === 21 && data.player.length === 2) {
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

  const hit = () => {
    const newCard = drawCard();
    const newHand = [...playerHand, newCard];
    const newScore = calculateScore(newHand);
    setPlayerHand(newHand);
    setPlayerScore(newScore);
    if (newScore > 21) {
      setDealerScore(calculateScore(dealerHand));
      determineWinner(calculateScore(dealerHand));
    }
  };

  const stand = () => {
    setPhase('dealer');
    const dealer = [...dealerHand];
    let score = calculateScore(dealer);
    const revealAndPlay = async () => {
      setRevealedDealerCards([]);
      for (let i = 0; i < dealer.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        setRevealedDealerCards((prev) => [...prev, dealer[i]]);
      }
      while (score < 17) {
        const card = drawCard();
        dealer.push(card);
        score = calculateScore(dealer);
        setDealerHand([...dealer]);
        await new Promise((r) => setTimeout(r, 400));
        setRevealedDealerCards([...dealer]);
      }
      setDealerScore(score);
      determineWinner(score);
    };
    revealAndPlay();
  };

  const determineWinner = (finalDealerScore: number) => {
    let outcome = '';

    if (playerScore > 21) {
      outcome = 'LOSE';
    } else if (finalDealerScore > 21) {
      outcome = 'WIN';
    } else if (playerScore > finalDealerScore) {
      outcome = 'WIN';
    } else if (playerScore < finalDealerScore) {
      outcome = 'LOSE';
    } else {
      outcome = 'DRAW';
    }

    setResultText(outcome);
    setPhase('done');
    setHistory((prev) => [
      { round: round - 1, player: playerHand, dealer: dealerHand, result: outcome },
      ...prev
    ].slice(0, 5));
    resolveResult(outcome);
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