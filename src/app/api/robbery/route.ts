import { NextRequest, NextResponse } from 'next/server';
import { robberyActions } from '@/lib/game/robberyConfig';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getUserFromSession } from '@/lib/session';
import { RobberyActionSchema } from '@/lib/schemas/robberySchema';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  const parsed = RobberyActionSchema.safeParse(action);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
  }

  const actionKey = parsed.data;
  const config = robberyActions[actionKey];
  if (!config) {
    return NextResponse.json({ error: 'Unsupported robbery type' }, { status: 400 });
  }

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await config.handler(user.id);

    return NextResponse.json({
      success: true,
      result,
      cooldown: config.cooldownSeconds,
    });
  } catch (err: unknown) {
    console.error(`${action} error:`, err);
    const errorMessage = err instanceof Error ? err.message : `${action} failed`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}