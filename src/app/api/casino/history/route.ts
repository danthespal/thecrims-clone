import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [sessionData] = await sql`
    SELECT user_id FROM "Sessions" WHERE id = ${session.value}
  `;

  if (!sessionData) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const userId = sessionData.user_id;

  const transactions = await sql`
    SELECT type, amount, created_at
    FROM "CasinoTransactions"
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const totals = await sql`
    SELECT
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS total_deposit,
      SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) AS total_withdraw
    FROM "CasinoTransactions"
    WHERE user_id = ${userId}
  `;

  return NextResponse.json({
    transactions,
    totals: totals[0],
  });
}
