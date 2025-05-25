import { cookies } from 'next/headers';
import sql from '@/lib/db';

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) return null;

  const [user] = await sql`
    SELECT u.id
    FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  return user ?? null;
}
