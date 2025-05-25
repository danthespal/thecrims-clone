import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimiter';

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
        const [user] = await sql`
          SELECT u.id, u.account_name, u.email, u.profile_name, u.profile_suffix, u.date_of_birth,
                 u.level, u.respect, u.money, u.will, u.last_regen
          FROM "User" u
          WHERE u.id = (
            SELECT user_id FROM "Sessions" WHERE id = ${sessionId}
          )
        `;

        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const settings = await sql`
          SELECT key, value FROM "GameSettings"
          WHERE key IN ('max_will', 'will_regen_per_minute')
        `;

        const gameSettings: Record<string, string> = {};
        for (const row of settings) {
          gameSettings[row.key] = row.value;
        }

        return NextResponse.json({
          user,
          settings: {
            max_will: parseInt(gameSettings['max_will'] || '100'),
            regen_rate_per_minute: parseInt(gameSettings['will_regen_per_minute'] || '1'),
          },
        });
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
