"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import CardImage from "@/components/dashboard/Casino/CardImage";
import { motion } from "framer-motion";

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
      const res = await fetch('/api/casino/blackjack?action=start', {
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
        onResult?.();
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
      const res = await fetch('/api/casino/blackjack?action=hit', {
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
      const res = await fetch('/api/casino/blackjack?action=stand', {
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
      const res = await fetch('/api/casino/blackjack?action=resolve', {
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
    <div className="bg-green-900 flex items-start justify-center gap-6 px-4 py-10 text-white">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Game Table */}
        <div className="space-y-8 bg-black bg-opacity-40 rounded-xl p-6 shadow-lg w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Blackjack</h2>
          <p className="text-sm text-gray-300 italic mb-6">Blackjack pays 3:2</p>

          {phase !== 'idle' && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-teal-300">Dealer&#39;s Hand</h3>
              <div className="flex justify-center gap-2 py-2">
                {phase === 'player' && dealerHand.length === 2
                  ? (
                    <>
                      <CardImage card={dealerHand[1]} />
                      <CardImage card={dealerHand[0]} faceDown />
                    </>
                  )
                  : revealedDealerCards.map((card, i) => (
                      <CardImage key={i} card={card} delay={i * 0.2} />
                    ))}
              </div>
              <p className="text-sm">Total: {phase === 'done' ? dealerScore : '???'}</p>
            </div>
          )}

          {phase !== 'idle' && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-teal-300">Your Hand</h3>
              <div className="flex justify-center gap-2 py-2">
                {playerHand.map((card, i) => (
                  <CardImage key={i} card={card} />
                ))}
              </div>
              <p className="text-sm">Total: {playerScore}</p>
            </div>
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
              {netGain !== null && <p className="text-sm text-gray-300">{netGain > 0 ? `+${netGain}` : `${netGain}`} 💰</p>}
              <p className="mb-2">💰 Your balance: ${casinoBalance}</p>
              <button onClick={startGame} className="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded">Play Again</button>
            </motion.div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-400">Choose your bet:</p>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setBet(chip)}
                  disabled={casinoBalance !== null && chip > casinoBalance}
                  className={`px-4 py-2 rounded font-bold border transition-transform hover:scale-110 ${
                    bet === chip ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                  } ${casinoBalance !== null && chip > casinoBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                {casinoBalance !== null && casinoBalance <= 0 ? 'Insufficient Funds' : loading ? 'Dealing...' : 'Start Game'}
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
                  🧑 {h.player.join(' ')} vs 🃏 {h.dealer.join(' ')} —
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