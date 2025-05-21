import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { amount } = await req.json();
  const value = parseInt(amount, 10);

  if (!value || value <= 0) {
    return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
  }

  const [wallet] = await sql`
    SELECT user_id, balance FROM "CasinoWallet"
    WHERE user_id = (SELECT user_id FROM "Sessions" WHERE id = ${session.value})
  `;

  if (!wallet || wallet.balance < value) {
    return NextResponse.json({ error: 'Insufficient casino balance' }, { status: 400 });
  }

  await sql.begin(async (tx) => {
    await tx`
      UPDATE "CasinoWallet" SET balance = balance - ${value} WHERE user_id = ${wallet.user_id}
    `;
    await tx`
      UPDATE "User" SET money = money + ${value} WHERE id = ${wallet.user_id}
    `;
    await tx`
      INSERT INTO "CasinoTransactions" (user_id, type, amount)
      VALUES (${wallet.user_id}, 'withdraw', ${value})
    `;
  });

  return NextResponse.json({ success: true });
}
