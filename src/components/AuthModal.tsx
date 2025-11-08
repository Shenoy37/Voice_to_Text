'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Mail, Lock, User, Chrome, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
    const { login, isPending } = useAuth();
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setIsSubmitting(true);
            await login();
        } catch (err) {
            setError('Failed to sign in with Google. Please try again.');
            console.error('Google sign in error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setError('');
            setIsSubmitting(true);
            // TODO: Implement email sign-in when backend supports it
            setError('Email sign-in will be available soon. Please use Google sign-in for now.');
        } catch (err) {
            setError('Failed to sign in. Please check your credentials.');
            console.error('Email sign in error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !name) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        try {
            setError('');
            setIsSubmitting(true);
            // TODO: Implement email sign-up when backend supports it
            setError('Email sign-up will be available soon. Please use Google sign-in for now.');
        } catch (err) {
            setError('Failed to create account. Please try again.');
            console.error('Email sign up error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setError('');
            setSuccess('');
            setEmail('');
            setPassword('');
            setName('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 animate-in fade-in duration-200"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm transform transition-all duration-300 hover:shadow-3xl">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 transform transition-transform duration-300 hover:scale-110">
                            <Chrome className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">
                            Welcome to Voice to Notes
                        </CardTitle>
                        <CardDescription className="text-center">
                            Transform your voice into organized notes with AI
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-in slide-in-from-top duration-200">
                                <AlertCircle className="w-4 h-4 animate-pulse" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-700 text-sm animate-in slide-in-from-top duration-200">
                                <CheckCircle className="w-4 h-4 animate-pulse" />
                                {success}
                            </div>
                        )}

                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="signin">Sign In</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>

                            {/* Google Sign In Button - Always Visible */}
                            <div className="space-y-3 pt-4">
                                <Button
                                    onClick={handleGoogleSignIn}
                                    disabled={isSubmitting || isPending}
                                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-300 transform hover:scale-105 active:scale-100"
                                    variant="outline"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Chrome className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                                            Continue with Google
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="relative py-4 group">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full transition-colors duration-300 group-hover:bg-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground transition-colors duration-300 group-hover:text-gray-700">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>

                            {/* Sign In Tab */}
                            <TabsContent value="signin" className="space-y-4 mt-0">
                                <form onSubmit={handleEmailSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signin-email"
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signin-password"
                                                type="password"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Signing In...
                                            </>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Sign Up Tab */}
                            <TabsContent value="signup" className="space-y-4 mt-0">
                                <form onSubmit={handleEmailSignUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-name"
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="pl-10"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="Create a password (min. 8 characters)"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating Account...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-4">
                        <div className="text-xs text-center text-muted-foreground">
                            By continuing, you agree to our{' '}
                            <a href="#" className="underline hover:text-primary">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="underline hover:text-primary">
                                Privacy Policy
                            </a>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}