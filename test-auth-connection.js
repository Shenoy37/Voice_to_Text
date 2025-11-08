const { neon } = require('@neondatabase/serverless');
const { betterAuth } = require("better-auth");
const { drizzle } = require('drizzle-orm/neon-http');
const { drizzleAdapter } = require("better-auth/adapters/drizzle");

// Load environment variables
require('dotenv').config();

console.log('Testing authentication service...');

async function testAuth() {
    try {
        console.log('Creating database connection...');
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql, { schema: {} });

        console.log('Creating auth instance...');
        const auth = betterAuth({
            database: drizzleAdapter(db, {
                provider: "pg",
                schema: {
                    users: {},
                    accounts: {},
                    sessions: {},
                    verifications: {},
                    authenticators: {},
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
            advanced: {
                database: {
                    generateId: false,
                },
            },
        });

        console.log('Auth instance created successfully');
        console.log('Testing session handler...');

        // Create a mock request
        const mockRequest = new Request('http://localhost:3000/api/auth/session', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const startTime = Date.now();
        const response = await auth.handler(mockRequest);
        const endTime = Date.now();

        console.log(`Session handler responded in ${endTime - startTime}ms`);
        console.log('Response status:', response.status);

        const responseText = await response.text();
        console.log('Response body:', responseText);

    } catch (error) {
        console.error('Auth test failed:', error);
    }
}

testAuth();