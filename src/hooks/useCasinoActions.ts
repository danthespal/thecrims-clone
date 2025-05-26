'use client';

import { useState } from 'react';
import useCasinoHistory from '@/hooks/useCasinoHistory';
import { depositToCasino, withdrawFromCasino } from '@/lib/services/casino';

export default function useCasinoActions() {
  const { refresh } = useCasinoHistory();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handle = async (
    action: 'deposit' | 'withdraw',
    amount: string | number
  ) => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setMessage('❌ Invalid amount');
      return false;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = action === 'deposit'
        ? await depositToCasino(num)
        : await withdrawFromCasino(num);

      if (res.success) {
        setMessage(`✅ ${action} successful`);
        refresh();
        window.dispatchEvent(new Event('user:update'));
        return true;
      } else {
        setMessage(`❌ ${res.error || `Failed to ${action}`}`);
        return false;
      }
    } catch {
      setMessage(`❌ Error processing ${action}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    message,
    deposit: (amount: string | number) => handle('deposit', amount),
    withdraw: (amount: string | number) => handle('withdraw', amount),
  };
}
