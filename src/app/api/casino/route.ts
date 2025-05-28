import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/core/db';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getUserFromSession } from '@/lib/session';
import { CasinoActionSchema, CasinoAmountSchema } from '@/lib/schemas/casinoSchema';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  switch (action) {
    case 'history': {
      const transactions = await sql`
        SELECT type, amount, created_at
        FROM "CasinoTransactions"
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const totals = await sql`
        SELECT
          SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS total_deposit,
          SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) AS total_withdraw
        FROM "CasinoTransactions"
        WHERE user_id = ${user.id}
      `;

      return NextResponse.json({
        transactions,
        totals: totals[0],
      });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const { searchParams } = new URL(req.url);
  const actionRow = searchParams.get('action');

  const parsedAction = CasinoActionSchema.safeParse(actionRow);
  if (!parsedAction.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const action = parsedAction.data;

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = CasinoAmountSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid amount', issues: parsedBody.error.flatten() }, { status: 400 });
  }

  const { amount } = parsedBody.data;

  switch (action) {
    case 'deposit': {
      const [found] = await sql`
        SELECT money FROM "User" WHERE id = ${user.id}
      `;

      if (!found || found.money < amount) {
        return NextResponse.json({ error: 'Insufficient user funds' }, { status: 400 });
      }

      await sql.begin(async (tx) => {
        await tx`UPDATE "User" SET money = money - ${amount} WHERE id = ${user.id}`;
        await tx`
          INSERT INTO "CasinoWallet" (user_id, balance)
          VALUES (${user.id}, ${amount})
          ON CONFLICT (user_id) DO UPDATE
          SET balance = "CasinoWallet".balance + ${amount}
        `;
        await tx`
          INSERT INTO "CasinoTransactions" (user_id, type, amount)
          VALUES (${user.id}, 'deposit', ${amount})
        `;
      });

      return NextResponse.json({ success: true });
    }

    case 'withdraw': {
      const [wallet] = await sql`
        SELECT balance FROM "CasinoWallet" WHERE user_id = ${user.id}
      `;

      if (!wallet || wallet.balance < amount) {
        return NextResponse.json({ error: 'Insufficient casino balance' }, { status: 400 });
      }

      await sql.begin(async (tx) => {
        await tx`UPDATE "CasinoWallet" SET balance = balance - ${amount} WHERE user_id = ${user.id}`;
        await tx`UPDATE "User" SET money = money + ${amount} WHERE id = ${user.id}`;
        await tx`
          INSERT INTO "CasinoTransactions" (user_id, type, amount)
          VALUES (${user.id}, 'withdraw', ${amount})
        `;
      });

      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
