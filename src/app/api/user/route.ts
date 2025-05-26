import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/core/db';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { regenWill } from '@/lib/game/regenWill';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'session') {
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('session-token');

      if (!session?.value) {
        return NextResponse.json({ authenticated: false });
      }

      const [sessionUser] = await sql`
        SELECT u.id
        FROM "Sessions" s
        JOIN "User" u ON u.id = s.user_id
        WHERE s.id = ${session.value}
      `;

      if (!sessionUser) {
        return NextResponse.json({ authenticated: false });
      }

      const settingsRows = await sql`SELECT key, value FROM "GameSettings"`;
      const settings = Object.fromEntries(settingsRows.map(({ key, value }) => [key, value]));

      const maxWill = parseInt(settings.max_will || '100', 10);
      const regenRate = parseInt(settings.will_regen_per_minute || '1', 10);

      const [preRegen] = await sql`
        SELECT will, last_regen FROM "User" WHERE id = ${sessionUser.id}
      `;

      await regenWill(
        sessionUser.id,
        preRegen.will,
        preRegen.last_regen,
        maxWill,
        regenRate
      );

      const [user] = await sql`
        SELECT u.id, u.account_name, u.email, u.profile_name, u.profile_suffix,
               u.level, u.money, u.respect, u.will, u.last_regen,
               COALESCE(cw.balance, 0) AS casino_balance
        FROM "User" u
        LEFT JOIN "CasinoWallet" cw ON cw.user_id = u.id
        WHERE u.id = ${sessionUser.id}
      `;

      return NextResponse.json({
        authenticated: true,
        user,
        settings: {
          max_will: maxWill,
          regen_rate_per_minute: regenRate,
        },
      });
    } catch (err) {
      console.error('Session error:', err);
      return NextResponse.json({ authenticated: false, error: 'Failed to load session' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const cookieStore = req.cookies;
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const sessionId = session.value;

  try {
    switch (action) {
      case 'profile': {
        const body = await req.json().catch(() => null);

        const [user] = await sql`
          SELECT u.id FROM "Sessions" s
          JOIN "User" u ON u.id = s.user_id
          WHERE s.id = ${sessionId}
        `;

        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!body || Object.keys(body).length === 0) {
          // GET profile
          const [userInfo] = await sql`
            SELECT u.id, u.account_name, u.email, u.profile_name, u.profile_suffix, u.date_of_birth,
                   u.level, u.respect, u.money, u.will, u.last_regen
            FROM "User" u
            WHERE u.id = ${user.id}
          `;

          const settings = await sql`
            SELECT key, value FROM "GameSettings"
            WHERE key IN ('max_will', 'will_regen_per_minute')
          `;

          const gameSettings: Record<string, string> = {};
          for (const row of settings) {
            gameSettings[row.key] = row.value;
          }

          return NextResponse.json({
            user: userInfo,
            settings: {
              max_will: parseInt(gameSettings['max_will'] || '100'),
              regen_rate_per_minute: parseInt(gameSettings['will_regen_per_minute'] || '1'),
            },
          });
        }

        // UPDATE profile
        const { email, profile_name, date_of_birth } = body;

        if (
          typeof email !== 'string' ||
          typeof profile_name !== 'string' ||
          typeof date_of_birth !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)
        ) {
          return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
        }

        await sql`
          UPDATE "User"
          SET email = ${email}, profile_name = ${profile_name}, date_of_birth = ${date_of_birth}
          WHERE id = ${user.id}
        `;

        return NextResponse.json({ success: true });
      }

      case 'change-password': {
        const { newPassword } = await req.json();

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
          return NextResponse.json({ error: 'Invalid new password' }, { status: 400 });
        }

        const bcrypt = await import('bcrypt');
        const hashed = await bcrypt.hash(newPassword, 10);

        await sql`
          UPDATE "User"
          SET password = ${hashed}
          WHERE id = (SELECT user_id FROM "Sessions" WHERE id = ${sessionId})
        `;

        return NextResponse.json({ success: true });
      }

      case 'delete-account': {
        const { confirmation } = await req.json();

        if (confirmation !== 'DELETE') {
          return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 });
        }

        await sql`
          DELETE FROM "User"
          WHERE id = (SELECT user_id FROM "Sessions" WHERE id = ${sessionId})
        `;

        await sql`
          DELETE FROM "Sessions" WHERE id = ${sessionId}
        `;

        const res = NextResponse.json({ success: true });
        res.cookies.set('session-token', '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
        });

        return res;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error(`${action} error:`, err);
    return NextResponse.json({ error: `${action} failed` }, { status: 500 });
  }
}
