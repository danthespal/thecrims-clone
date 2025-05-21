import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const level = parseInt(searchParams.get('level') || '0', 10);

    if (isNaN(level) || level < 1) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    const [row] = await sql`
      SELECT respect_required FROM "LevelRequirements"
      WHERE level = ${level}
    `;

    if (!row) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    return NextResponse.json({ respect_required: row.respect_required });
  } catch (err) {
    console.error('Level requirement fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch level requirement' }, { status: 500 });
  }
}
