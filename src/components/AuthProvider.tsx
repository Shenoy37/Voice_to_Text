'use client';

import { BetterAuthProvider } from 'better-auth/react';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    return (
        <BetterAuthProvider >
            {children}
        </BetterAuthProvider >
    );
}