import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [sessionData] = await sql`
    SELECT user_id FROM "Sessions" WHERE id = ${session.value}
  `;

  if (!sessionData) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const userId = sessionData.user_id;

  switch (action) {
    case 'history': {
      const transactions = await sql`
        SELECT type, amount, created_at
        FROM "CasinoTransactions"
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const totals = await sql`
        SELECT
          SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS total_deposit,
          SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) AS total_withdraw
        FROM "CasinoTransactions"
        WHERE user_id = ${userId}
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

  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { amount } = await req.json();
  const value = parseInt(amount, 10);
  if (!value || value <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  switch (action) {
    case 'deposit': {
      const [user] = await sql`
        SELECT id, money FROM "User"
        WHERE id = (SELECT user_id FROM "Sessions" WHERE id = ${session.value})
      `;
      if (!user || user.money < value) {
        return NextResponse.json({ error: 'Insufficient user funds' }, { status: 400 });
      }
      await sql.begin(async (tx) => {
        await tx`UPDATE "User" SET money = money - ${value} WHERE id = ${user.id}`;
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

    case 'withdraw': {
      const [wallet] = await sql`
        SELECT user_id, balance FROM "CasinoWallet"
        WHERE user_id = (SELECT user_id FROM "Sessions" WHERE id = ${session.value})
      `;
      if (!wallet || wallet.balance < value) {
        return NextResponse.json({ error: 'Insufficient casino balance' }, { status: 400 });
      }
      await sql.begin(async (tx) => {
        await tx`UPDATE "CasinoWallet" SET balance = balance - ${value} WHERE user_id = ${wallet.user_id}`;
        await tx`UPDATE "User" SET money = money + ${value} WHERE id = ${wallet.user_id}`;
        await tx`
          INSERT INTO "CasinoTransactions" (user_id, type, amount)
          VALUES (${wallet.user_id}, 'withdraw', ${value})
        `;
      });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
