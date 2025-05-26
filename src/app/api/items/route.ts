import { NextRequest, NextResponse } from 'next/server';
import { getAllItems } from '@/lib/game/itemLoader';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (!action || action !== 'all') {
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
