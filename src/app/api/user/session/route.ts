import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { regenWill } from '@/lib/regenWill';

export async function GET() {
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
