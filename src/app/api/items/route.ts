import { NextRequest, NextResponse } from 'next/server';
import { getAllItems } from '@/lib/game/itemLoader';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getUserFromSession } from '@/lib/session';
import { ItemActionSchema } from '@/lib/schemas/itemSchema';

export async function GET(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const parsed = ItemActionSchema.safeParse(action);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid or missing action' }, { status: 400 });
  }

  try {
    const items = await getAllItems();
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error('❌ Failed to fetch items:', err);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
