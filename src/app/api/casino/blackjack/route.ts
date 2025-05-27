import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/core/db';
import { drawCard, calculateScore } from '@/lib/game/blackjackUtils';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getUserFromSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();

  switch (action) {
    case 'start': {
      const bet = Number(body.bet);
      if (!Number.isInteger(bet) || bet <= 0) {
        return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
      }

      const [wallet] = await sql`
        SELECT balance FROM "CasinoWallet" WHERE user_id = ${user.id}
      `;

      if (!wallet || wallet.balance < bet) {
        return NextResponse.json({ error: 'Insufficient casino balance' }, { status: 400 });
      }

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
        playerScore: calculateScore(player),
        dealerScore: calculateScore(dealer),
        casinoBalance: wallet.balance - bet,
      });
    }

    case 'hit': {
      const { hand } = body;
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

    case 'stand': {
      const { dealerHand } = body;
      if (!dealerHand || !Array.isArray(dealerHand) || dealerHand.length === 0 || dealerHand.some((c) => typeof c !== 'string')) {
        return NextResponse.json({ error: 'Invalid dealer hand' }, { status: 400 });
      }

      const updatedDealerHand = [...dealerHand];
      let dealerScore = calculateScore(updatedDealerHand);

      while (dealerScore < 17) {
        updatedDealerHand.push(drawCard());
        dealerScore = calculateScore(updatedDealerHand);
      }

      return NextResponse.json({
        dealerHand: updatedDealerHand,
        dealerScore,
        bust: dealerScore > 21,
      });
    }

    case 'resolve': {
      const { bet, playerHand, dealerHand } = body;

      if (
        !bet || bet <= 0 ||
        !Array.isArray(playerHand) || playerHand.some(card => typeof card !== 'string') ||
        !Array.isArray(dealerHand) || dealerHand.some(card => typeof card !== 'string')
      ) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
      }

      const playerScore = calculateScore(playerHand);
      const dealerScore = calculateScore(dealerHand);

      let result: 'win' | 'lose' | 'draw' | 'blackjack';

      if (playerScore === 21 && playerHand.length === 2) {
        result = 'blackjack';
      } else if (playerScore > 21) {
        result = 'lose';
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        result = 'win';
      } else if (playerScore < dealerScore) {
        result = 'lose';
      } else {
        result = 'draw';
      }

      let payout = 0;
      switch (result) {
        case 'blackjack': payout = Math.floor(bet * 2.5); break;
        case 'win': payout = bet * 2; break;
        case 'draw': payout = bet; break;
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
        validatedResult: result,
      });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
