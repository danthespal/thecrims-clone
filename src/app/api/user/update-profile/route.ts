import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sql from '@/lib/db';

const ProfileSchema = z.object({
  email: z.string().email(),
  profile_name: z.string().min(3),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');
  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const result = ProfileSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { email, profile_name, date_of_birth } = result.data;

  const [user] = await sql`
    SELECT u.id FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await sql`
    UPDATE "User"
    SET email = ${email}, profile_name = ${profile_name}, date_of_birth = ${date_of_birth}
    WHERE id = ${user.id}
  `;

  return NextResponse.json({ success: true });
}