import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import sql from '@/lib/core/db';
import { createSession, getUserFromSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/core/rateLimiter';

const SESSION_COOKIE_NAME = 'session-token';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  try {
    switch (action) {
      case 'login': {
        const { account_name, password } = await req.json();

        if (!account_name || !password) {
          return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const [user] = await sql`
          SELECT * FROM "User" WHERE account_name = ${account_name}
        `;

        if (!user) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        return await createSession(user.id);
      }

      case 'register': {
        const {
          account_name,
          email,
          password,
          profile_name,
          profile_suffix,
          date_of_birth,
        } = await req.json();

        if (
          !account_name ||
          !email ||
          !password ||
          !profile_name ||
          !profile_suffix ||
          !date_of_birth
        ) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [existing] = await sql`
          SELECT 1 FROM "User"
          WHERE account_name = ${account_name} OR email = ${email}
        `;

        if (existing) {
          return NextResponse.json({ error: 'Account name or email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [inserted] = await sql`
          INSERT INTO "User" (
            account_name, email, password, profile_name, profile_suffix,
            date_of_birth, level, respect, money, will
          ) VALUES (
            ${account_name}, ${email}, ${hashedPassword}, ${profile_name}, ${profile_suffix},
            ${date_of_birth}, 1, 0, 0, 100
          ) RETURNING id
        `;

        return await createSession(inserted.id);
      }

      case 'logout': {
        const user = await getUserFromSession();
        const response = NextResponse.json({ success: true });

        if (user) {
          await sql`
            DELETE FROM "Sessions" WHERE user_id = ${user.id}
          `;
          response.cookies.set(SESSION_COOKIE_NAME, '', {
            path: '/',
            maxAge: 0,
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
          });
        }

        return response;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error(`${action} error:`, err);
    return NextResponse.json({ error: `${action} failed` }, { status: 500 });
  }
}
