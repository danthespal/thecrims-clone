import { NextRequest, NextResponse } from 'next/server';
import levelRequirements from '@/data/level-requirements.json';

export async function GET(req: NextRequest) {
  try {
    const levelParam = req.nextUrl.searchParams.get('level');
    const level = parseInt(levelParam || '0', 10);

    if (isNaN(level) || level < 1 || level > levelRequirements.length) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    const requirement = levelRequirements.find((l) => l.level === level);

    if (!requirement) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    return NextResponse.json({ respect_required: requirement.respect_required });
  } catch (err) {
    console.error('Level requirement fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch level requirement' }, { status: 500 });
  }
}
