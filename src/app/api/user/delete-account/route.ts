import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

export async function DELETE() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');
  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [user] = await sql`
    SELECT u.id FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await sql`
    DELETE FROM "User" WHERE id = ${user.id};
  `;

  await sql`
    DELETE FROM "Sessions" WHERE id = ${session.value};
  `;

  const res = NextResponse.json({ success: true });
  res.cookies.set('session-token', '', { path: '/', maxAge: 0 });

  return res;
}
