import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountName = searchParams.get('account_name');

    if (!accountName) {
      return NextResponse.json({ available: false });
    }

    const [exists] = await sql`
      SELECT 1 FROM "User" WHERE account_name = ${accountName}
    `;

    return NextResponse.json({ available: !exists });
  } catch (err) {
    console.error('Account name check failed:', err);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
