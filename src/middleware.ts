import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get('session-token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = ['/dashboard', '/casino', '/inventory'].some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/casino/:path*', '/inventory/:path*'],
};
