import { NextRequest, NextResponse } from 'next/server';
import { robberyActions, RobberyAction } from '@/lib/robberyConfig';
import { checkRateLimit } from '@/lib/rateLimiter';
import { getUserFromSession } from '@/lib/sessionUser';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') as RobberyAction;

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const config = robberyActions[action];
  if (!config) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
