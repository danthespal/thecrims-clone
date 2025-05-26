'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCasinoBalance } from '@/context/CasinoBalanceContext';

export type GamePhase = 'idle' | 'player' | 'dealer' | 'done';

interface BlackjackGameState {
  bet: number;
  round: number;
  playerHand: string[];
  dealerHand: string[];
  playerScore: number;
  dealerScore: number;
  revealedDealerCards: string[];
  phase: GamePhase;
  resultText: string;
  casinoBalance: number | null;
  netGain: number | null;
  history: { round: number; player: string[]; dealer: string[]; result: string }[];
  loading: boolean;
  setBet: (value: number) => void;
  startGame: () => Promise<void>;
  hit: () => Promise<void>;
  stand: () => Promise<void>;
}

export default function useBlackjackClientGame(onResult?: () => void): BlackjackGameState {
  const [bet, setBet] = useState(10);
  const [round, setRound] = useState(1);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [revealedDealerCards, setRevealedDealerCards] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [resultText, setResultText] = useState('');
  const [netGain, setNetGain] = useState<number | null>(null);
  const [history, setHistory] = useState<
    { round: number; player: string[]; dealer: string[]; result: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const { balance: casinoBalance, refresh: refreshCasinoBalance } = useCasinoBalance();

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

  const resolveResult = async (
    playerCards: string[],
    dealerCards: string[],
    roundNumber: number
  ) => {
    try {
      const res = await fetch('/api/casino/blackjack?action=resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet, playerHand: playerCards, dealerHand: dealerCards }),
      });
      const data = await res.json();
      if (data?.success) {
        setNetGain(data.payout);
        setResultText(data.validatedResult.toUpperCase());
        setHistory((prev) => [
          {
            round: roundNumber,
            player: [...playerCards],
            dealer: [...dealerCards],
            result: data.validatedResult.toUpperCase(),
          },
          ...prev,
        ].slice(0, 5));
        toast.success(
          `Result: ${data.validatedResult.toUpperCase()} — ${
            data.payout > 0 ? '+' + data.payout : 'No win'
          }`
        );
        await refreshCasinoBalance(); // update global balance after resolution
        onResult?.();
      } else {
        toast.error(data.error || 'Resolve failed');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Server error resolving result');
    }
  };

  return {
    bet,
    setBet,
    round,
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
  };
}
