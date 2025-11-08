import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('Manual Google OAuth route hit');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.BETTER_AUTH_URL}/api/auth/callback/google`);
    const scope = encodeURIComponent('openid email profile');
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

    console.log('Redirecting to Google OAuth:', googleAuthUrl);

    // Store state in session/cookie for later verification
    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
    });

    return response;
}