import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { drawCard, calculateScore } from '@/lib/blackjackUtils';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { hand } = await req.json();

  if (!Array.isArray(hand) || hand.some((c) => typeof c !== 'string')) {
    return NextResponse.json({ error: 'Invalid hand' }, { status: 400 });
  }

  const newCard = drawCard();
  const updatedHand = [...hand, newCard];
  const score = calculateScore(updatedHand);

  return NextResponse.json({
    newCard,
    updatedHand,
    score,
    bust: score > 21,
  });
}
