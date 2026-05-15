import { NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

// Paths that require dealer authentication
const PROTECTED = ['/', '/setup', '/fill'];

// API routes that require authentication
const PROTECTED_API = ['/api/store-pdf'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if this path needs auth
  const needsAuth = PROTECTED.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)))
    || PROTECTED_API.some(p => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next();

  // Protected routes require a valid auth cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  const token = cookie?.value;

  if (!token || !(await verifyToken(token))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/setup/:path*',
    '/fill/:path*',
    '/api/store-pdf/:path*',
  ],
};
