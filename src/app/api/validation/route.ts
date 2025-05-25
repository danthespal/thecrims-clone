import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimiter';

type ValidationAction = 'check-account' | 'check-email' | 'check-profile';

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') as ValidationAction | null;

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const body = await req.json();

  switch (action) {
    case 'check-account': {
      const { account_name } = body;
      if (!account_name || typeof account_name !== 'string') {
        return NextResponse.json({ error: 'Missing account_name' }, { status: 400 });
      }

      const [user] = await sql`
        SELECT id FROM "User" WHERE LOWER(account_name) = LOWER(${account_name})
      `;

      return NextResponse.json({ available: !user });
    }

    case 'check-email': {
      const { email } = body;
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
      }

      const [user] = await sql`
        SELECT id FROM "User" WHERE LOWER(email) = LOWER(${email})
      `;

      return NextResponse.json({ available: !user });
    }

    case 'check-profile': {
      const { profile_name, profile_suffix } = body;
      if (!profile_name || !profile_suffix) {
        return NextResponse.json({ error: 'Missing profile_name or profile_suffix' }, { status: 400 });
      }

      const [user] = await sql`
        SELECT id FROM "User" WHERE profile_name = ${profile_name} AND profile_suffix = ${profile_suffix}
      `;

      return NextResponse.json({ available: !user });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}