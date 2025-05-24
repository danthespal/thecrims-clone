import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
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
