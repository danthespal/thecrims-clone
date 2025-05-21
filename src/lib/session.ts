import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import sql from '@/lib/db';

const SESSION_COOKIE_NAME = 'session-token';

export async function createSession(userId: number) {
  const sessionId = randomUUID();

  await sql`
    INSERT INTO "Sessions" (id, user_id)
    VALUES (${sessionId}, ${userId})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (session?.value) {
    await sql`DELETE FROM "Sessions" WHERE id = ${session.value}`;
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
