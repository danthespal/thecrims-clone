import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileName = searchParams.get('profile_name');

    if (!profileName) {
      return NextResponse.json({ available: false });
    }

    const [exists] = await sql`
      SELECT 1 FROM "User" WHERE profile_name = ${profileName}
    `;

    return NextResponse.json({ available: !exists });
  } catch (err) {
    console.error('Profile name check failed:', err);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
