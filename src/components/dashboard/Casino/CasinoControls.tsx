'use client';

import { useEffect, useState } from 'react';
import TransactionList from './TransactionList';

interface Props {
  onSuccess?: () => void;
}

interface Transaction {
  type: 'deposit' | 'withdraw';
  amount: number;
  created_at: string;
}

interface Totals {
  total_deposit: number;
  total_withdraw: number;
}

export default function CasinoControls({ onSuccess }: Props) {
  const [deposit, setDeposit] = useState('');
  const [withdraw, setWithdraw] = useState('');
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidNumber = (val: string) => !isNaN(Number(val)) && Number(val) > 0;

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/casino/history');
      const data = await res.json();
      setTransactions(data.transactions);
      setTotals(data.totals);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    }
  };

  const handleDeposit = async () => {
    if (loading || !isValidNumber(deposit)) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/casino/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: deposit }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Deposit successful');
        setDeposit('');
        onSuccess?.();
        fetchHistory();
        window.dispatchEvent(new Event('user:update'));
      } else {
        setMessage(`❌ ${data.error || 'Failed to deposit'}`);
      }
    } catch {
      setMessage('❌ Error processing deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (loading || !isValidNumber(withdraw)) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/casino/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdraw }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Withdrawal successful');
        setWithdraw('');
        onSuccess?.();
        fetchHistory();
        window.dispatchEvent(new Event('user:update'));
      } else {
        setMessage(`❌ ${data.error || 'Failed to withdraw'}`);
      }
    } catch {
      setMessage('❌ Error processing withdrawal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:space-x-8 text-sm text-white">
      {/* Left Card */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 space-y-6 w-full max-w-md">
        <div>
          <label className="block mb-1 font-medium">Deposit to Casino Wallet</label>
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-2"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
          <button
            onClick={handleDeposit}
            disabled={loading || !isValidNumber(deposit)}
            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded w-full disabled:opacity-50"
          >
            Deposit
          </button>
        </div>

        <div>
          <label className="block mb-1 font-medium">Withdraw from Casino Wallet</label>
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-2"
            value={withdraw}
            onChange={(e) => setWithdraw(e.target.value)}
          />
          <button
            onClick={handleWithdraw}
            disabled={loading || !isValidNumber(withdraw)}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded w-full disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>

        {message && <p className="text-yellow-400">{message}</p>}
      </div>

      {/* Right Card */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 space-y-4 w-full md:max-w-xl">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {totals && (
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              Total Deposited:{' '}
              <span className="text-green-400 font-semibold">
                ${totals.total_deposit ?? 0}
              </span>
            </p>
            <p>
              Total Withdrawn:{' '}
              <span className="text-red-400 font-semibold">
                ${totals.total_withdraw ?? 0}
              </span>
            </p>
          </div>
        )}
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
