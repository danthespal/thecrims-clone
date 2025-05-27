import { NextRequest, NextResponse } from 'next/server';
import levelRequirementsArray from '@/data/level-requirements.json';

const levelRequirements = new Map<number, { level: number; respect_required: number }>(
  levelRequirementsArray.map((entry) => [entry.level, entry])
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const levelParam = searchParams.get('level');
    const level = parseInt(levelParam || '', 10);

    if (!levelParam || isNaN(level) || level < 1) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    const requirement = levelRequirements.get(level);

    if (!requirement) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    return new NextResponse(
      JSON.stringify({ respect_required: requirement.respect_required }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (err) {
    console.error('Level requirement fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch level requirement' }, { status: 500 });
  }
}
