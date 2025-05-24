import { NextResponse } from 'next/server';
import { getAllItems } from '@/lib/itemLoader';

export async function GET() {
  try {
    const items = await getAllItems();
    return NextResponse.json(items);
  } catch (err) {
    console.error('❌ Failed to fetch items:', err);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
