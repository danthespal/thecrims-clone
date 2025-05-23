"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import CardImage from "@/components/dashboard/Casino/CardImage";

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
  const [history, setHistory] = useState<
    { round: number; player: string[]; dealer: string[]; result: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    if (!Number.isInteger(bet) || bet <= 0) {
      toast.error('Please select a valid bet.');
      return;
    }
    if (casinoBalance !== null && bet > casinoBalance) {
      toast.error('You do not have enough funds for this bet.');
      return;
    }
    setLoading(true);
    setPhase('idle');
    setPlayerHand([]);
    setDealerHand([]);
    setRevealedDealerCards([]);
    setNetGain(null);
    setResultText('');
    try {
      const res = await fetch('/api/casino/blackjack/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || 'Server rejected the bet.');

      setPlayerHand(data.player);
      setDealerHand(data.dealer);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      setCasinoBalance(data.casinoBalance);
      const nextRound = round + 1;
      setRound(nextRound);
      onResult?.();

      if (data.playerScore === 21 && data.player.length === 2) {
        toast.success('BLACKJACK! 🎉');
        setResultText('BLACKJACK');
        setRevealedDealerCards(data.dealer);
        setPhase('done');
        await resolveResult(data.player, data.dealer, nextRound - 1);
      } else {
        setPhase('player');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Error starting game');
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
        toast.error('You busted! 💥');
        setRevealedDealerCards(dealerHand);
        setPhase('done');
        await resolveResult(data.updatedHand, dealerHand, round - 1);
      }
    } catch (err) {
      toast.error((err as Error).message || 'Error on hit');
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
      setPhase('done');
      await resolveResult(playerHand, data.dealerHand, round - 1);
    } catch (err) {
      toast.error((err as Error).message || 'Error on stand');
    }
  };

  const resolveResult = async (playerCards: string[], dealerCards: string[], roundNumber: number) => {
    try {
      const res = await fetch('/api/casino/blackjack/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet, playerHand: playerCards, dealerHand: dealerCards }),
      });
      const data = await res.json();
      if (data?.success) {
        setCasinoBalance(data.casinoBalance);
        setNetGain(data.payout);
        setResultText(data.validatedResult.toUpperCase());
        setHistory((prev) => [
          { round: roundNumber, player: [...playerCards], dealer: [...dealerCards], result: data.validatedResult.toUpperCase() },
          ...prev,
        ].slice(0, 5));
        toast.success(`Result: ${data.validatedResult.toUpperCase()} — ${data.payout > 0 ? '+' + data.payout : 'No win'}`);
        onResult?.();
      } else {
        toast.error(data.error || 'Resolve failed');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Server error resolving result');
    }
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
              disabled={casinoBalance !== null && chip > casinoBalance}
              className={`px-4 py-2 rounded font-bold border ${
                bet === chip ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
              } ${casinoBalance !== null && chip > casinoBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ${chip}
            </button>
          ))}
        </div>
      </div>

      {phase === 'idle' && (
        <button
          onClick={startGame}
          disabled={loading || (casinoBalance !== null && casinoBalance <= 0)}
          className="mt-4 bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-semibold disabled:opacity-50"
        >
          {casinoBalance !== null && casinoBalance <= 0 ? 'Insufficient Funds' : loading ? 'Dealing...' : 'Start Game'}
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
            <p>Your Hand:</p>
            <div className="flex gap-2 mb-1">
              {playerHand.map((card, i) => (<CardImage key={i} card={card} />))}
            </div>
            <p className="text-sm mb-2">Total: {playerScore}</p>

            <p className="mt-4">Dealer&apos;s Hand:</p>
            <div className="flex gap-2 mb-1">
              {phase === 'player' && dealerHand.length === 2
                ? <><CardImage card={dealerHand[1]} /><CardImage card={dealerHand[0]} faceDown /></>
                : revealedDealerCards.map((card, i) => (
                <CardImage key={i} card={card} delay={i * 0.2} />
              ))}
            </div>
            <p className="text-sm">Total: {phase === 'done' ? dealerScore : '???'}</p>
          </div>

          {phase === 'done' && (
            <div className="animate-pulse">
              <p className="text-lg font-bold">🎲 Result: {resultText === 'BLACKJACK' ? 'BLACKJACK 🎉' : resultText}</p>
              {netGain !== null && <p className="text-sm text-gray-300">{netGain > 0 ? `+${netGain}` : `${netGain}`} 💰</p>}
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
                <span className="text-teal-500 font-semibold">Round {h.round}:</span>
                🧑 {h.player.join(' ')} vs 🃏 {h.dealer.join(' ')} —
                <span className="ml-2 font-bold text-teal-400">{h.result}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
