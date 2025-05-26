'use client';

import { useState } from 'react';
import TransactionList from './TransactionList';
import useCasinoHistory from '@/hooks/useCasinoHistory';
import useCasinoActions from '@/hooks/useCasinoActions';

interface Props {
  onSuccess?: () => void;
}

export default function CasinoControls({ onSuccess }: Props) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { transactions, totals } = useCasinoHistory();
  const {
    deposit,
    withdraw,
    loading,
    message,
  } = useCasinoActions();

  const isValid = (val: string) =>
    !isNaN(Number(val)) && Number(val) > 0;

  const handleDeposit = async () => {
    if (!isValid(depositAmount)) return;
    const success = await deposit(depositAmount);
    if (success) {
      setDepositAmount('');
      onSuccess?.();
    }
  };

  const handleWithdraw = async () => {
    if (!isValid(withdrawAmount)) return;
    const success = await withdraw(withdrawAmount);
    if (success) {
      setWithdrawAmount('');
      onSuccess?.();
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:space-x-8 text-sm text-white">
      {/* Left Card */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 space-y-6 w-full max-w-md">
        <div>
          <label className="block mb-1 font-medium">Deposit to Casino Wallet</label>
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-2"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button
            onClick={handleDeposit}
            disabled={loading || !isValid(depositAmount)}
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
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button
            onClick={handleWithdraw}
            disabled={loading || !isValid(withdrawAmount)}
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
