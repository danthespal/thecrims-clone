'use client';

interface Transaction {
  type: 'deposit' | 'withdraw';
  amount: number;
  created_at: string;
}

interface Props {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return <p className="text-gray-400 italic">No transactions yet.</p>;
  }

  return (
    <div className="max-h-72 overflow-y-auto divide-y divide-gray-800 text-sm">
      {transactions.map((tx, i) => (
        <div
          key={i}
          className="grid grid-cols-3 gap-2 items-center py-2 px-3 hover:bg-gray-800 transition rounded"
        >
          {/* Type */}
          <span
            className={`font-medium ${
              tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdraw'}
          </span>

          {/* Amount */}
          <span className="text-white text-center font-semibold">
            ${tx.amount.toLocaleString()}
          </span>

          {/* Timestamp */}
          <span className="text-gray-400 text-right text-xs whitespace-nowrap">
            {new Date(tx.created_at).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
