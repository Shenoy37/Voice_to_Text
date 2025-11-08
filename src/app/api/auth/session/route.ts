import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('Session endpoint hit');

    try {
        const sessionToken = request.cookies.get('session_token')?.value;

        if (!sessionToken) {
            console.log('No session token found');
            return NextResponse.json({ data: null });
        }

        try {
            const sessionData = JSON.parse(sessionToken);

            // Check if session is expired
            if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
                console.log('Session expired');
                return NextResponse.json({ data: null });
            }

            console.log('Valid session found for user:', sessionData.user.email);
            return NextResponse.json({
                data: {
                    user: sessionData.user,
                    session: {
                        expiresAt: sessionData.expiresAt,
                    }
                }
            });

        } catch (parseError) {
            console.error('Failed to parse session token:', parseError);
            return NextResponse.json({ data: null });
        }

    } catch (error) {
        console.error('Session endpoint error:', error);
        return NextResponse.json({ data: null }, { status: 500 });
    }
}