import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { calculateScore } from '@/lib/blackjackUtils';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { bet, playerHand, dealerHand } = await req.json();

  if (
    !bet || bet <= 0 ||
    !Array.isArray(playerHand) || playerHand.some(card => typeof card !== 'string') ||
    !Array.isArray(dealerHand) || dealerHand.some(card => typeof card !== 'string')
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);

  let validatedResult: 'win' | 'lose' | 'draw' | 'blackjack';

  if (playerScore === 21 && playerHand.length === 2) {
    validatedResult = 'blackjack';
  } else if (playerScore > 21) {
    validatedResult = 'lose';
  } else if (dealerScore > 21 || playerScore > dealerScore) {
    validatedResult = 'win';
  } else if (playerScore < dealerScore) {
    validatedResult = 'lose';
  } else {
    validatedResult = 'draw';
  }

  const [user] = await sql`
    SELECT user_id AS id FROM "Sessions" WHERE id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let payout = 0;
  switch (validatedResult) {
    case 'blackjack':
      payout = Math.floor(bet * 2.5);
      break;
    case 'win':
      payout = bet * 2;
      break;
    case 'draw':
      payout = bet;
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
    payout,
    casinoBalance: updated.balance,
    validatedResult,
  });
}
