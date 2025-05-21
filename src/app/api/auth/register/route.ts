import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcrypt';
import { createSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const {
      account_name,
      email,
      password,
      profile_name,
      profile_suffix,
      date_of_birth,
    } = await req.json();

    // Basic checks
    if (!account_name || !email || !password || !profile_name || !profile_suffix || !date_of_birth) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if account name or email already exists
    const [existing] = await sql`
      SELECT 1 FROM "User"
      WHERE account_name = ${account_name} OR email = ${email}
    `;
    if (existing) {
      return NextResponse.json({ error: 'Account name or email already exists' }, { status: 409 });
    }

    // Generate full profile name with suffix
    const fullProfileName = `${profile_name}#${profile_suffix}`;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [inserted] = await sql`
      INSERT INTO "User" (
        account_name, email, password, profile_name, profile_suffix,
        date_of_birth, level, respect, money, will
      ) VALUES (
        ${account_name}, ${email}, ${hashedPassword}, ${fullProfileName}, ${profile_suffix},
        ${date_of_birth}, 1, 0, 0, 100
      ) RETURNING id
    `;

    // Create session
    await createSession(inserted.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
