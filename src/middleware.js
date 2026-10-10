import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const isLoginPage = pathname === '/admin/login';
  // Middleware performs only a presence check to avoid loading Node crypto into
  // the middleware runtime. The signed session is verified by /api/admin/auth
  // and every protected API route on the server.
  const hasSessionCookie = Boolean(request.cookies.get('store_session')?.value);

  if (!hasSessionCookie && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/products', request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
