'use client';

import { authClient } from '@/lib/auth-client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
}

interface Session {
    user: User | null;
}

interface AuthContextType {
    session: Session | null;
    isPending: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSession] = useState<Session | null>(null);
    const [isPending, setIsPending] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                setIsPending(true);
                const sessionData = await authClient.getSession();
                setSession(sessionData.data as Session);
                setError(null);
            } catch (error) {
                console.error('Failed to get session:', error);
                setSession(null);
                setError('Failed to check authentication status');
            } finally {
                setIsPending(false);
            }
        };

        checkSession();
    }, []);

    const login = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await authClient.signIn();
        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to sign in. Please try again.');
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await authClient.signOut();
            setSession(null);
        } catch (error) {
            console.error('Logout error:', error);
            setError('Failed to sign out. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const isAuthenticated = !!session?.user;

    return (
        <AuthContext.Provider
            value={{
                session,
                isPending,
                isLoading,
                isAuthenticated,
                error,
                login,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}