import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

const CARD_VALUES = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, 10: 10,
  J: 10, Q: 10, K: 10, A: 11,
};

const drawCard = (): string => {
  const faces = Object.keys(CARD_VALUES);
  const random = Math.floor(Math.random() * faces.length);
  return faces[random];
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const bet = parseInt(body.bet, 10);

  if (!bet || bet <= 0) {
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

  // Deduct the bet
  await sql`
    UPDATE "CasinoWallet"
    SET balance = balance - ${bet}
    WHERE user_id = ${user.id}
  `;

  const player = [drawCard(), drawCard()];
  const dealer = [drawCard(), drawCard()];

  return NextResponse.json({
    player,
    dealer,
    casinoBalance: user.casino_balance - bet,
  });
}
