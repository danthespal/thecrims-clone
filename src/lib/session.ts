import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

const SESSION_COOKIE_NAME = 'session-token';

export async function createSession(userId: number): Promise<NextResponse> {
  const existing = await sql`
    SELECT id FROM "Sessions"
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const sessionId = existing.length ? existing[0].id : randomUUID();

  if (!existing.length) {
    await sql`
      INSERT INTO "Sessions" (id, user_id)
      VALUES (${sessionId}, ${userId})
    `;
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

export async function destroySession(sessionId: string): Promise<void> {
  await sql`
    DELETE FROM "Sessions" WHERE id = ${sessionId}
  `;
}

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session?.value) return null;

  const [user] = await sql`
    SELECT u.id
    FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  return user ?? null;
}
