'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { LogIn, Loader2 } from 'lucide-react';

export function SignInButton() {
    const { login, isPending } = useAuth();

    const handleSignIn = async () => {
        await login();
    };

    return (
        <Button
            onClick={handleSignIn}
            disabled={isPending}
            size="lg"
            className="px-8"
        >
            {isPending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                </>
            ) : (
                <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in with Google
                </>
            )}
        </Button>
    );
}