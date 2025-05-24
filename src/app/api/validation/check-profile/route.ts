import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const profileName = req.nextUrl.searchParams.get('profile_name');
    const dob = req.nextUrl.searchParams.get('date_of_birth');

    if (!profileName || !dob) {
      return NextResponse.json({ available: false });
    }

    const d = new Date(dob);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ available: false });
    }

    const suffix = `#${String(d.getFullYear() % 100)}${d.getMonth() + 1}${d.getDate()}`;
    const fullName = `${profileName}${suffix}`;

    const [exists] = await sql`
      SELECT 1 FROM "User" WHERE profile_name = ${fullName}
    `;

    return NextResponse.json({ available: !exists });
  } catch (err) {
    console.error('Profile name check failed:', err);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
