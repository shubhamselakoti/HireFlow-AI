import { auth } from './lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!session?.user;
  const role = (session?.user as any)?.role;

  // Public routes — always accessible
  const publicRoutes = ['/', '/login', '/register', '/candidate-portal'];
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith('/candidate-portal'));
  if (isPublic) return NextResponse.next();

  // Auth required for all other routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based access
  if (pathname.startsWith('/dashboard')) {
    if (role !== 'management_admin') {
      return NextResponse.redirect(new URL(getRoleRedirect(role), req.url));
    }
  }

  if (pathname.startsWith('/manager')) {
    if (role !== 'senior_manager') {
      return NextResponse.redirect(new URL(getRoleRedirect(role), req.url));
    }
  }

  if (pathname.startsWith('/recruiter')) {
    if (role !== 'hr_recruiter') {
      return NextResponse.redirect(new URL(getRoleRedirect(role), req.url));
    }
  }

  if (pathname.startsWith('/employee')) {
    if (role !== 'employee') {
      return NextResponse.redirect(new URL(getRoleRedirect(role), req.url));
    }
  }

  return NextResponse.next();
});

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'management_admin': return '/dashboard';
    case 'senior_manager': return '/manager';
    case 'hr_recruiter': return '/recruiter';
    case 'employee': return '/employee';
    default: return '/login';
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
