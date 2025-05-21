import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const { bet, result } = body;

  if (!bet || bet <= 0 || !['win', 'lose', 'draw', 'blackjack'].includes(result.toLowerCase())) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const [user] = await sql`
    SELECT user_id AS id FROM "Sessions" WHERE id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let payout = 0;

  switch (result.toLowerCase()) {
    case 'win':
    case 'blackjack':
      payout = bet * 2;
      break;
    case 'draw':
      payout = bet;
      break;
    case 'lose':
      payout = 0;
      break;
  }

  if (payout > 0) {
    await sql`
      UPDATE "CasinoWallet"
      SET balance = balance + ${payout}
      WHERE user_id = ${user.id}
    `;
  }

  const [updated] = await sql`
    SELECT balance FROM "CasinoWallet" WHERE user_id = ${user.id}
  `;

  return NextResponse.json({
    success: true,
    payout: payout,
    casinoBalance: updated.balance
  });
}