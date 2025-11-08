import { betterAuth } from "better-auth";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../db/schema";

// Log environment variables for debugging
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_ID length:', process.env.GOOGLE_CLIENT_ID?.length || 0);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CLIENT_SECRET length:', process.env.GOOGLE_CLIENT_SECRET?.length || 0);
console.log('BETTER_AUTH_SECRET exists:', !!process.env.BETTER_AUTH_SECRET);
console.log('BETTER_AUTH_URL exists:', !!process.env.BETTER_AUTH_URL);

// Create database connection for Better Auth
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Add debugging to see if auth is properly initialized
console.log('Initializing Better Auth with schema:', {
    user: !!schema.users,
    account: !!schema.accounts,
    session: !!schema.sessions,
    verification: !!schema.verifications,
    authenticator: !!schema.authenticators,
});

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    basePath: "/api/auth",
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
            account: schema.accounts,
            session: schema.sessions,
            verification: schema.verifications,
            authenticator: schema.authenticators,
        },
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            enabled: true,
            authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
            scope: ["openid", "email", "profile"],
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
        generateId: false, // Use database-generated IDs
        database: {},
        useSecureCookies: false, // for development
        trustedOrigins: ["http://localhost:3000"],
    },
});

export type Session = typeof auth.$Infer.Session;