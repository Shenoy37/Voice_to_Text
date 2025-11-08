// Test alternative OAuth setup approaches
async function testAlternativeOAuthSetup() {
    console.log('=== Testing Alternative OAuth Setup ===\n');

    try {
        const { betterAuth } = require("better-auth");

        // Test 1: Try with minimal configuration
        console.log('Test 1: Minimal configuration');
        const auth1 = betterAuth({
            baseURL: "http://localhost:3000",
            socialProviders: {
                google: {
                    clientId: "test-client-id",
                    clientSecret: "test-client-secret",
                },
            },
        });

        await testAuthRoutes(auth1, "Minimal config");

        // Test 2: Try with explicit social provider config
        console.log('\nTest 2: Explicit social provider config');
        const auth2 = betterAuth({
            baseURL: "http://localhost:3000",
            socialProviders: {
                google: {
                    clientId: "test-client-id",
                    clientSecret: "test-client-secret",
                    enabled: true,
                    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
                    tokenUrl: "https://oauth2.googleapis.com/token",
                    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
                },
            },
        });

        await testAuthRoutes(auth2, "Explicit social config");

        // Test 3: Try with different base path
        console.log('\nTest 3: Different base path');
        const auth3 = betterAuth({
            baseURL: "http://localhost:3000",
            basePath: "/api/auth",
            socialProviders: {
                google: {
                    clientId: "test-client-id",
                    clientSecret: "test-client-secret",
                },
            },
        });

        await testAuthRoutes(auth3, "Different base path");

        // Test 4: Try with advanced configuration
        console.log('\nTest 4: Advanced configuration');
        const auth4 = betterAuth({
            baseURL: "http://localhost:3000",
            basePath: "/api/auth",
            socialProviders: {
                google: {
                    clientId: "test-client-id",
                    clientSecret: "test-client-secret",
                    enabled: true,
                },
            },
            advanced: {
                // Try different advanced options
                cookiePrefix: "better-auth",
                secureCookies: false, // for development
            },
        });

        await testAuthRoutes(auth4, "Advanced config");

    } catch (error) {
        console.error('Alternative setup test error:', error);
        console.error('Stack:', error.stack);
    }
}

async function testAuthRoutes(authInstance, testName) {
    console.log(`\n--- ${testName} ---`);

    const testRoutes = [
        '/api/auth/signin/google',
        '/api/auth/social/google',
        '/api/auth/oauth/google',
        '/api/auth/google',
        '/auth/signin/google',
        '/signin/google'
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

            const response = await authInstance.handler(mockRequest);
            process.stdout.write(`${route}: ${response.status} `);

            if (response.status === 302 || response.status === 301) {
                const location = response.headers.get('location');
                if (location && location.includes('google.com')) {
                    console.log(`🎉 WORKING!`);
                    console.log(`  → Redirects to: ${location}`);
                    return route;
                }
            }
        } catch (error) {
            process.stdout.write(`${route}: Error `);
        }
    }
    console.log('');
}

testAlternativeOAuthSetup();