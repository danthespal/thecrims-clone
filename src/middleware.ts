import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
	const sessionToken = req.cookies.get('session-token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = ['/dashboard', '/casino', '/inventory'].some((path) =>
    pathname.startsWith(path)
  );

  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/casino/:path*', '/inventory/:path*'],
};