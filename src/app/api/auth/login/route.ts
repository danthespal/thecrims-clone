import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
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

    // 🔥 Return session-creating response
    return await createSession(user.id);
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
