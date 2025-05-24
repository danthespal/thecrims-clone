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
  return (
    <div className="max-h-64 overflow-y-auto text-sm divide-y divide-gray-800">
      {transactions.map((tx, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 hover:bg-gray-800 px-2 rounded transition"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span
              className={tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}
            >
              {tx.type === 'deposit' ? '🟢 Deposit' : '🔴 Withdraw'}
            </span>
          </div>
          <span className="text-white font-semibold">${tx.amount}</span>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {new Date(tx.created_at).toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
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