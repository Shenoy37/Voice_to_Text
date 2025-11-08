// Debug Better Auth routes and configuration
async function debugBetterAuthRoutes() {
    console.log('=== Debugging Better Auth Routes ===\n');

    try {
        // Import Better Auth to inspect its configuration
        const { betterAuth } = require("better-auth");

        // Create a minimal auth instance to debug
        const auth = betterAuth({
            baseURL: "http://localhost:3000",
            socialProviders: {
                google: {
                    clientId: "test-client-id",
                    clientSecret: "test-client-secret",
                    enabled: true,
                },
            },
        });

        console.log('✓ Better Auth instance created');

        // Test different route patterns that Better Auth might expect
        const testRoutes = [
            '/api/auth/signin/google',
            '/api/auth/social/google',
            '/api/auth/oauth/google',
            '/api/auth/google',
            '/signin/google',
            '/auth/signin/google'
        ];

        for (const route of testRoutes) {
            try {
                const mockRequest = new Request(`http://localhost:3000${route}`, {
                    method: 'GET'
                });

                const response = await auth.handler(mockRequest);
                console.log(`${route}: ${response.status}`);

                if (response.status === 302 || response.status === 301) {
                    const location = response.headers.get('location');
                    if (location && location.includes('google.com')) {
                        console.log(`  ✓ ✓ ✓ FOUND WORKING ROUTE: ${route}`);
                        console.log(`  → Redirects to: ${location}`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`${route}: Error - ${error.message}`);
            }
        }

        // Let's also check what routes Better Auth actually registers
        console.log('\n=== Checking Better Auth Internal Routes ===');

        // Try to access internal Better Auth configuration
        try {
            const handler = auth.handler;
            console.log('Handler type:', typeof handler);

            // Test with different request methods
            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
            for (const method of methods) {
                try {
                    const mockRequest = new Request('http://localhost:3000/api/auth/signin/google', {
                        method
                    });
                    const response = await handler(mockRequest);
                    console.log(`${method} /api/auth/signin/google: ${response.status}`);
                } catch (error) {
                    console.log(`${method} /api/auth/signin/google: Error - ${error.message}`);
                }
            }
        } catch (error) {
            console.log('Could not inspect handler:', error.message);
        }

    } catch (error) {
        console.error('Debug error:', error);
        console.error('Stack:', error.stack);
    }
}

debugBetterAuthRoutes();