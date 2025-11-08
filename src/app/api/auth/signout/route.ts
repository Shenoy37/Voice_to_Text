import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('Sign-out endpoint hit');

    try {
        const response = NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/`);
        
        // Clear session cookie
        response.cookies.set('session_token', '', {
            path: '/',
            maxAge: 0,
        });
        
        // Clear any other auth-related cookies
        response.cookies.set('oauth_state', '', {
            path: '/',
            maxAge: 0,
        });

        console.log('Session cleared, redirecting to home');
        return response;

    } catch (error) {
        console.error('Sign-out error:', error);
        return NextResponse.json({ error: 'Sign-out failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // Also support GET for sign-out
    return POST(request);
}