import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT key, value FROM "GameSettings"`;

    const settings = rows.reduce<Record<string, string>>((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});

    return NextResponse.json(settings);
  } catch (err) {
    console.error('Failed to load settings:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
