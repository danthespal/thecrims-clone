import { cookies } from 'next/headers';
import { destroySession } from '@/lib/session';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'session-token';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);

    const response = NextResponse.json({ success: true });

    if (session?.value) {
      await destroySession(session.value);

      response.cookies.set(SESSION_COOKIE_NAME, '', {
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
