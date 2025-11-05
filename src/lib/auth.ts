import { betterAuth } from "better-auth";
import { neonAdapter } from "better-auth/adapters/neon";
import { db } from "@/db";
import { users } from "@/db/schema";

export const auth = betterAuth({
    database: neonAdapter(db, {
        provider: "neon",
        schema: {
            users: users,
        },
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
    },
    account: {
        accountLinking: {
            enabled: true,
        },
    },
});

export type Session = typeof auth.$Infer.Session;