import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import sql from '@/lib/db';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');
  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const { current_password, new_password, confirm_password } = body;

  if (!current_password || !new_password || !confirm_password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (new_password !== confirm_password) {
    return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
  }

  if (new_password.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  const [user] = await sql`
    SELECT u.id, u.password FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  const hashed = await bcrypt.hash(new_password, 10);

  await sql`
    UPDATE "User" SET password = ${hashed} WHERE id = ${user.id}
  `;

  return NextResponse.json({ success: true });
}
