import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value;
    const isLoginPage = pathname === '/admin/login';

    // If unauthenticated and trying to access any protected /admin page -> Redirect to /admin/login
    if (!token && !isLoginPage) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If already authenticated and visiting /admin/login -> Redirect to /admin/products
    if (token && isLoginPage) {
      return NextResponse.redirect(new URL('/admin/products', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};