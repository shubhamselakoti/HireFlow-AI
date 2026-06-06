import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!session?.user;
  const role = (session?.user as any)?.role;

  // ── 1. Always-public routes — no auth, no redirects ─────────────────────
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/candidate-portal') ||
    pathname.startsWith('/interview/');

  if (isPublic) {
    // If already logged in and hitting /login or /register, redirect to their home
    if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL(getRoleHome(role), req.url));
    }
    return NextResponse.next();
  }

  // ── 2. Not logged in — send to login ────────────────────────────────────
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Candidates — can only access /candidate-portal (already public) ──
  // If a candidate somehow navigates to a staff route, send them home
  if (role === 'candidate') {
    return NextResponse.redirect(new URL('/candidate-portal', req.url));
  }

  // ── 4. Staff role guards ─────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard') && role !== 'management_admin') {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  if (pathname.startsWith('/manager') && role !== 'senior_manager') {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  if (pathname.startsWith('/recruiter') && role !== 'hr_recruiter') {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  if (pathname.startsWith('/employee') && role !== 'employee') {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  return NextResponse.next();
});

function getRoleHome(role: string): string {
  switch (role) {
    case 'management_admin': return '/dashboard';
    case 'senior_manager':   return '/manager';
    case 'hr_recruiter':     return '/recruiter';
    case 'employee':         return '/employee';
    case 'candidate':        return '/candidate-portal';
    default:                 return '/login';
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
