import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/core/db';
import { drawCard, calculateScore } from '@/lib/game/blackjackUtils';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getUserFromSession } from '@/lib/session';
import {
  BlackjackActionSchema,
  StartSchema,
  HitSchema,
  StandSchema,
  ResolveSchema,
} from '@/lib/schemas/blackjackSchema';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const rawAction = url.searchParams.get('action');

  const parsedAction = BlackjackActionSchema.safeParse(rawAction);
  if (!parsedAction.success) {
    return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
  }

  const action = parsedAction.data;

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();

  switch (action) {
    case 'start': {
      const parsed = StartSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid bet amount', issues: parsed.error.flatten() }, { status: 400 });
      }
      const { bet } = parsed.data;

      const [wallet] = await sql`SELECT balance FROM "CasinoWallet" WHERE user_id = ${user.id}`;
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
      const parsed = HitSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid hand', issues: parsed.error.flatten() }, { status: 400 });
      }

      const { hand } = parsed.data;
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
      const parsed = StandSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid dealer hand', issues: parsed.error.flatten() }, { status: 400 });
      }

      const { dealerHand } = parsed.data;
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
      const parsed = ResolveSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid resolve input', issues: parsed.error.flatten() }, { status: 400 });
      }

      const { bet, playerHand, dealerHand } = parsed.data;
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
  }
}
