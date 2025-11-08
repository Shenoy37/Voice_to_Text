'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/components/AuthProvider';
import { LogIn, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSignInButtonProps {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
    className?: string;
    showText?: boolean;
    fullWidth?: boolean;
}

export function EnhancedSignInButton({
    variant = 'default',
    size = 'lg',
    className,
    showText = true,
    fullWidth = false
}: EnhancedSignInButtonProps) {
    const { isPending, isLoading, error, clearError } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSignIn = () => {
        clearError();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleSignIn}
                disabled={isPending || isLoading}
                variant={variant}
                size={size}
                className={cn(
                    'relative overflow-hidden group transition-all duration-300',
                    'hover:shadow-lg hover:scale-105 active:scale-100',
                    'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
                    'border-0 text-white font-medium',
                    fullWidth && 'w-full',
                    className
                )}
            >
                {/* Background animation effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Button content */}
                <div className="relative flex items-center justify-center gap-2">
                    {isPending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Connecting...</span>
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" />
                            {showText && (
                                <>
                                    <span>Get Started</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                            <Sparkles className="w-4 h-4 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
                        </>
                    )}
                </div>
            </Button>

            <AuthModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                defaultTab="signin"
            />
        </>
    );
}

// Alternative compact version for headers
export function CompactSignInButton({
  className
}: {
  className?: string
}) {
  const { isPending, isLoading, clearError } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSignIn = () => {
      clearError();
      setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleSignIn}
                disabled={isPending || isLoading}
                variant="ghost"
                size="sm"
                className={cn(
                    'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                    'transition-colors duration-200',
                    className
                )}
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                    <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                    </>
                )}
            </Button>

            <AuthModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                defaultTab="signin"
            />
        </>
    );
}