'use client';
import { useEffect, useState } from 'react';

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

  const fetchHistory = async () => {
    const res = await fetch('/api/casino/history');
    const data = await res.json();
    setTransactions(data.transactions);
    setTotals(data.totals);
  };

  const handleDeposit = async () => {
    setMessage('');
    const res = await fetch('/api/casino/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: deposit }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage('✅ Deposit successful');
      onSuccess?.();
      fetchHistory();
      window.dispatchEvent(new Event('user:update'));
    } else {
      setMessage(`❌ ${data.error || 'Failed to deposit'}`);
    }
  };

  const handleWithdraw = async () => {
    setMessage('');
    const res = await fetch('/api/casino/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: withdraw }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage('✅ Withdrawal successful');
      onSuccess?.();
      fetchHistory();
      window.dispatchEvent(new Event('user:update'));
    } else {
      setMessage(`❌ ${data.error || 'Failed to withdraw'}`);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white">
      {/* Left side */}
      <div className="flex justify-center items-start">
        <div className="w-full max-w-md space-y-6">
          <div>
            <label className="block mb-1">Deposit to Casino Wallet</label>
            <input
              type="number"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-2"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
            <button
              onClick={handleDeposit}
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
            >
              Deposit
            </button>
          </div>

          <div>
            <label className="block mb-1">Withdraw from Casino Wallet</label>
            <input
              type="number"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-2"
              value={withdraw}
              onChange={(e) => setWithdraw(e.target.value)}
            />
            <button
              onClick={handleWithdraw}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
            >
              Withdraw
            </button>
          </div>

          {message && <p className="mt-2 text-yellow-400">{message}</p>}
        </div>
      </div>

      {/* Right side - history */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 space-y-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {totals && (
          <div className="text-sm text-gray-300 space-y-1">
            <p>Total Deposited: <span className="text-green-400">{totals.total_deposit ?? 0}</span></p>
            <p>Total Withdrawn: <span className="text-red-400">{totals.total_withdraw ?? 0}</span></p>
          </div>
        )}
        <div className="max-h-64 overflow-y-auto text-sm divide-y divide-gray-700">
          {transactions.map((tx, i) => (
            <div key={i} className="py-1 flex justify-between">
              <span className={tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}>
                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
              </span>
              <span>{tx.amount}</span>
              <span className="text-gray-400 text-xs">
                {new Date(tx.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
