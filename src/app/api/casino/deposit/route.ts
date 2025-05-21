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
    return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
  }

  const [user] = await sql`
    SELECT id, money FROM "User"
    WHERE id = (SELECT user_id FROM "Sessions" WHERE id = ${session.value})
  `;

  if (!user || user.money < value) {
    return NextResponse.json({ error: 'Insufficient user funds' }, { status: 400 });
  }

  await sql.begin(async (tx) => {
    await tx`
      UPDATE "User" SET money = money - ${value} WHERE id = ${user.id}
    `;
    await tx`
      INSERT INTO "CasinoWallet" (user_id, balance)
      VALUES (${user.id}, ${value})
      ON CONFLICT (user_id) DO UPDATE
      SET balance = "CasinoWallet".balance + ${value}
    `;
    await tx`
      INSERT INTO "CasinoTransactions" (user_id, type, amount)
      VALUES (${user.id}, 'deposit', ${value})
    `;
  });

  return NextResponse.json({ success: true });
}
