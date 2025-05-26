'use client';

import { useState } from 'react';
import useCasinoHistory from '@/hooks/useCasinoHistory';

export default function useCasinoActions() {
  const { refresh } = useCasinoHistory();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isValidAmount = (val: string | number) =>
    !isNaN(Number(val)) && Number(val) > 0;

  const post = async (action: 'deposit' | 'withdraw', amount: string | number) => {
    if (!isValidAmount(amount)) {
      setMessage('❌ Invalid amount');
      return false;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/casino?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`✅ ${action === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
        refresh();
        window.dispatchEvent(new Event('user:update'));
        return true;
      } else {
        setMessage(`❌ ${data.error || `Failed to ${action}`}`);
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
    deposit: (amount: string | number) => post('deposit', amount),
    withdraw: (amount: string | number) => post('withdraw', amount),
  };
}