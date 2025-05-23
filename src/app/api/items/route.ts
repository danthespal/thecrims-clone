import { NextResponse } from 'next/server';
import { getAllItems } from '@/lib/itemLoader';

export async function GET() {
  return NextResponse.json(getAllItems());
}
