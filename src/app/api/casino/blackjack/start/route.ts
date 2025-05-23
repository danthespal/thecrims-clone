import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { drawCard, calculateScore } from '@/lib/blackjackUtils';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const bet = Number(body.bet);

  if (!Number.isInteger(bet) || bet <= 0) {
    return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
  }

  const [user] = await sql`
    SELECT u.id, w.balance AS casino_balance
    FROM "User" u
    JOIN "CasinoWallet" w ON u.id = w.user_id
    WHERE u.id = (
      SELECT user_id FROM "Sessions" WHERE id = ${session.value}
    )
  `;

  if (!user || user.casino_balance < bet) {
    return NextResponse.json({ error: 'Insufficient casino balance' }, { status: 400 });
  }

  await sql`
    UPDATE "CasinoWallet"
    SET balance = balance - ${bet}
    WHERE user_id = ${user.id}
  `;

  const player = [drawCard(), drawCard()];
  const dealer = [drawCard(), drawCard()];
  const playerScore = calculateScore(player);
  const dealerScore = calculateScore(dealer);

  return NextResponse.json({
    player,
    dealer,
    playerScore,
    dealerScore,
    casinoBalance: user.casino_balance - bet,
  });
}
