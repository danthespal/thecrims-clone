import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ available: false });
    }

    const [exists] = await sql`
      SELECT 1 FROM "User" WHERE email = ${email}
    `;

    return NextResponse.json({ available: !exists });
  } catch (err) {
    console.error('Email check failed:', err);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
