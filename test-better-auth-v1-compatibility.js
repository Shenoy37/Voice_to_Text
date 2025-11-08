// Test Better Auth v1 compatibility and route structure
async function testBetterAuthV1Compatibility() {
    console.log('=== Testing Better Auth v1 Compatibility ===\n');

    try {
        const { betterAuth } = require("better-auth");

        // Test with explicit route configuration
        const auth = betterAuth({
            baseURL: "http://localhost:3000",
            socialProviders: {
                google: {
                    clientId: "test-client-id",
                    clientSecret: "test-client-secret",
                    enabled: true,
                },
            },
            // Try explicit route configuration
            authRoutes: {
                signIn: "/api/auth/signin",
                signOut: "/api/auth/signout",
                session: "/api/auth/session",
                callback: "/api/auth/callback",
            },
        });

        console.log('✓ Better Auth instance with explicit routes created');

        // Test the actual route structure that might work
        const testRoutes = [
            // Standard Better Auth routes
            '/api/auth/signin/google',
            '/api/auth/sign-up/google',
            '/api/auth/oauth/google',
            '/api/auth/social/google',
            '/api/auth/google/signin',
            '/api/auth/google/oauth',
            // Alternative routes
            '/api/sign-in/google',
            '/api/oauth/google',
            '/auth/google',
            '/auth/signin/google'
        ];

        for (const route of testRoutes) {
            try {
                const mockRequest = new Request(`http://localhost:3000${route}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const response = await auth.handler(mockRequest);
                console.log(`${route}: ${response.status}`);

                if (response.status === 302 || response.status === 301) {
                    const location = response.headers.get('location');
                    if (location && location.includes('google.com')) {
                        console.log(`  🎉 FOUND WORKING ROUTE: ${route}`);
                        console.log(`  → Redirects to: ${location}`);

                        // Parse OAuth parameters
                        const url = new URL(location);
                        console.log(`  → Client ID: ${url.searchParams.get('client_id') ? 'Present' : 'Missing'}`);
                        console.log(`  → Redirect URI: ${url.searchParams.get('redirect_uri') ? 'Present' : 'Missing'}`);
                        console.log(`  → Scope: ${url.searchParams.get('scope') ? 'Present' : 'Missing'}`);
                        console.log(`  → State: ${url.searchParams.get('state') ? 'Present' : 'Missing'}`);
                        console.log(`  → Response Type: ${url.searchParams.get('response_type') ? 'Present' : 'Missing'}`);
                        return route;
                    }
                }
            } catch (error) {
                console.log(`${route}: Error - ${error.message}`);
            }
        }

        console.log('\n❌ No working OAuth route found');

        // Let's check what Better Auth actually exposes
        console.log('\n=== Checking Better Auth Handler Properties ===');
        try {
            console.log('Auth handler properties:', Object.getOwnPropertyNames(auth.handler));
            console.log('Auth handler prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(auth.handler)));
        } catch (error) {
            console.log('Could not inspect handler:', error.message);
        }

    } catch (error) {
        console.error('Compatibility test error:', error);
        console.error('Stack:', error.stack);
    }
}

testBetterAuthV1Compatibility();