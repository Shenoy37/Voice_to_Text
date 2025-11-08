import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = [
        '/',
        '/api/auth',
        '/api/auth/signin',
        '/api/auth/signout',
        '/api/auth/callback',
        '/api/auth/session',
    ];

    // Check if the current path is a public route or starts with a public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(route)
    );

    // If it's a public route, continue
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // For protected routes, we'll let the client-side handle the authentication check
    // This is because better-auth handles session management on the client side
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};