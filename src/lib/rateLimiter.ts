import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export function checkRateLimit(req: NextRequest): NextResponse | null {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || 'unknown';
  const now = Date.now();

  const entry = rateLimitMap.get(ip) || { count: 0, timestamp: now };

  if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return null;
  }

  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return null;
}