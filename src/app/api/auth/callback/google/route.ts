import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { users, accounts, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    console.log('Google OAuth callback hit');

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
        console.error('OAuth error:', error);
        return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/api/auth/error?error=${error}`);
    }

    if (!code) {
        console.error('No authorization code received');
        return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/api/auth/error?error=no_code`);
    }

    // Verify state parameter
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
        console.error('Invalid state parameter');
        return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/api/auth/error?error=invalid_state`);
    }

    try {
        console.log('Exchanging authorization code for tokens...');

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', errorText);
            return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/api/auth/error?error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        console.log('Tokens received successfully');

        // Get user info from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
            },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('User info fetch failed:', errorText);
            return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/api/auth/error?error=user_info_failed`);
        }

        const userInfo = await userResponse.json();
        console.log('User info received:', userInfo);

        // Create or update user in database
        console.log('Creating/updating user in database...');

        let user;
        const existingUsers = await db.select().from(users).where(eq(users.email, userInfo.email)).limit(1);

        if (existingUsers.length > 0) {
            user = existingUsers[0];
            console.log('Existing user found:', user.id);
        } else {
            // Create new user
            const newUsers = await db.insert(users).values({
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                image: userInfo.picture,
                emailVerified: true,
            }).returning();
            user = newUsers[0];
            console.log('New user created:', user.id);
        }

        // Create OAuth account record
        console.log('Creating OAuth account record...');
        await db.insert(accounts).values({
            id: `google_${userInfo.id}`,
            userId: user.id,
            accountId: userInfo.id,
            providerId: 'google',
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
            scope: 'openid email profile',
        });

        // Create session
        console.log('Creating session...');
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(Date.now() + (60 * 60 * 24 * 7 * 1000)); // 7 days

        await db.insert(sessions).values({
            id: sessionId,
            userId: user.id,
            token: sessionId,
            expiresAt,
            ipAddress: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        console.log('Session created with ID:', sessionId);

        const response = NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/dashboard`);

        // Set session cookie
        response.cookies.set('session_token', JSON.stringify({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
            },
            sessionId: sessionId,
            expiresAt: expiresAt.getTime(),
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Clear OAuth state cookie
        response.cookies.set('oauth_state', '', {
            maxAge: 0,
            path: '/',
        });

        console.log('Session created, redirecting to dashboard');
        return response;

    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${process.env.BETTER_AUTH_URL}/api/auth/error?error=callback_failed`);
    }
}