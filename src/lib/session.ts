import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

const SESSION_COOKIE_NAME = 'session-token';

export async function createSession(userId: number): Promise<NextResponse> {
  const sessionId = randomUUID();

  await sql`
    INSERT INTO "Sessions" (id, user_id)
    VALUES (${sessionId}, ${userId})
  `;

  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

export async function destroySession(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  const response = NextResponse.json({ success: true });

  if (session?.value) {
    await sql`DELETE FROM "Sessions" WHERE id = ${session.value}`;
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}
