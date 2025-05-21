'use client';
import { useState } from 'react';

interface Props {
  onSuccess?: () => void;
}

export default function CasinoControls({ onSuccess }: Props) {
  const [deposit, setDeposit] = useState('');
  const [withdraw, setWithdraw] = useState('');
  const [message, setMessage] = useState('');

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
      window.dispatchEvent(new Event('user:update'));
    } else {
      setMessage(`❌ ${data.error || 'Failed to withdraw'}`);
    }
};

  return (
    <div className="space-y-6 text-sm text-white">
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
  );
}
