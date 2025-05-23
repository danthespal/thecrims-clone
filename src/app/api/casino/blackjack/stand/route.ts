import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { drawCard, calculateScore } from '@/lib/blackjackUtils';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const { dealerHand } = body;

  if (!Array.isArray(dealerHand) || dealerHand.some((card) => typeof card !== 'string')) {
    return NextResponse.json({ error: 'Invalid dealer hand' }, { status: 400 });
  }

  const updatedDealerHand = [...dealerHand];
  let dealerScore = calculateScore(updatedDealerHand);

  while (dealerScore < 17) {
    const card = drawCard();
    updatedDealerHand.push(card);
    dealerScore = calculateScore(updatedDealerHand);
  }

  return NextResponse.json({
    dealerHand: updatedDealerHand,
    dealerScore,
    bust: dealerScore > 21
  });
}