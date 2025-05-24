import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  try {
    const {
      account_name,
      email,
      password,
      profile_name,
      profile_suffix,
      date_of_birth,
    } = await req.json();

    if (
      !account_name ||
      !email ||
      !password ||
      !profile_name ||
      !profile_suffix ||
      !date_of_birth
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [existing] = await sql`
      SELECT 1 FROM "User"
      WHERE account_name = ${account_name} OR email = ${email}
    `;

    if (existing) {
      return NextResponse.json({ error: 'Account name or email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [inserted] = await sql`
      INSERT INTO "User" (
        account_name, email, password, profile_name, profile_suffix,
        date_of_birth, level, respect, money, will
      ) VALUES (
        ${account_name}, ${email}, ${hashedPassword}, ${profile_name}, ${profile_suffix},
        ${date_of_birth}, 1, 0, 0, 100
      ) RETURNING id
    `;

    return await createSession(inserted.id);
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
