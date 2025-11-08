// Test Better Auth configuration and routes
const { betterAuth } = require("better-auth");

async function testBetterAuthConfig() {
    console.log('=== Testing Better Auth Configuration ===\n');

    try {
        // Test if we can import and configure Better Auth
        const { neon } = require('@neondatabase/serverless');
        const { drizzle } = require('drizzle-orm/neon-http');
        const { drizzleAdapter } = require("better-auth/adapters/drizzle");

        console.log('✓ Better Auth dependencies loaded successfully');

        // Test database connection
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        console.log('✓ Database connection established');

        // Test Better Auth configuration
        const authConfig = {
            database: drizzleAdapter(db, {
                provider: "pg",
                schema: {
                    user: "users",
                    account: "accounts",
                    session: "sessions",
                    verification: "verifications",
                    authenticator: "authenticators",
                },
            }),
            socialProviders: {
                google: {
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                },
            },
            session: {
                expiresIn: 60 * 60 * 24 * 7, // 7 days
                cookieCache: {
                    enabled: true,
                    maxAge: 5 * 60, // 5 minutes
                },
            },
            account: {
                accountLinking: {
                    enabled: true,
                },
            },
        };

        console.log('✓ Better Auth configuration created');

        // Test auth instance creation
        const auth = betterAuth(authConfig);
        console.log('✓ Better Auth instance created successfully');

        // Test handler creation
        const handler = auth.handler;
        console.log('✓ Better Auth handler created');

        // Test what routes Better Auth expects
        console.log('\n=== Better Auth Route Analysis ===');

        // Create a mock request to test route handling
        const mockRequest = new Request('http://localhost:3000/api/auth/signin/google', {
            method: 'GET'
        });

        console.log('Testing mock request to /api/auth/signin/google...');

        // This will help us understand what Better Auth expects
        const response = await handler(mockRequest);
        console.log(`Mock response status: ${response.status}`);

        if (response.status === 302 || response.status === 301) {
            const location = response.headers.get('location');
            console.log(`✓ Mock redirect to: ${location}`);
        }

    } catch (error) {
        console.error('✗ Better Auth configuration error:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testBetterAuthConfig();