'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { EnhancedSignInButton } from '@/components/EnhancedSignInButton';

const getErrorMessage = (error: string): string => {
    switch (error) {
        case 'access_denied':
            return 'You denied access to your account. Please try again and grant the necessary permissions.';
        case 'invalid_request':
            return 'The authentication request was invalid. Please try again.';
        case 'unauthorized_client':
            return 'The application is not authorized to use this authentication method.';
        case 'unsupported_response_type':
            return 'The authentication server does not support this response type.';
        case 'invalid_scope':
            return 'The requested scope is invalid or unknown.';
        case 'server_error':
            return 'The authentication server encountered an error. Please try again later.';
        case 'temporarily_unavailable':
            return 'The authentication server is temporarily unavailable. Please try again later.';
        case 'configuration':
            return 'There is a problem with the server configuration. Please contact support.';
        case 'access_denied_oauth':
            return 'OAuth access was denied. Please make sure you have the correct permissions.';
        case 'oauth_callback_error':
            return 'There was an error during the OAuth callback. Please try signing in again.';
        case 'unable_to_create_user':
            return 'We were unable to create your account. This might be due to missing required information. Please try again or contact support.';
        case 'email_already_in_use':
            return 'This email is already associated with an account. Please try signing in instead.';
        case 'invalid_credentials':
            return 'Invalid email or password. Please check your credentials and try again.';
        case 'session_expired':
            return 'Your session has expired. Please sign in again.';
        case 'too_many_attempts':
            return 'Too many sign-in attempts. Please wait a few minutes and try again.';
        default:
            return 'An unknown authentication error occurred. Please try again or contact support if the problem persists.';
    }
};

export default function AuthErrorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [errorDetails, setErrorDetails] = useState<string>('');
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
            const details = errorDescription || getErrorMessage(error);
            setErrorDetails(details);
        }
    }, [searchParams]);

    const handleRetry = () => {
        setIsRetrying(true);
        // Clear the error parameters and redirect to sign-in
        router.push('/');
    };

    const handleGoHome = () => {
        router.push('/');
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Error Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                </div>

                {/* Error Card */}
                <Card className="shadow-lg border-red-200">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-bold text-red-900">
                            Authentication Error
                        </CardTitle>
                        <CardDescription className="text-red-700">
                            We encountered an issue while trying to sign you in
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Error Details */}
                        {errorDetails && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-red-800">
                                        <p className="font-medium mb-1">What happened:</p>
                                        <p>{errorDetails}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Troubleshooting Tips */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">What you can try:</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    Try signing in again with the same account
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    Make sure you have a stable internet connection
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    Clear your browser cookies and try again
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    Try using a different browser or incognito mode
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <EnhancedSignInButton
                                fullWidth
                                size="lg"
                                className="w-full"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleGoBack}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Go Back
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleGoHome}
                                    className="flex items-center gap-2"
                                >
                                    <Home className="w-4 h-4" />
                                    Home
                                </Button>
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div className="text-center pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-2">
                                Still having trouble?
                            </p>
                            <Button
                                variant="link"
                                className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto"
                                onClick={() => window.open('mailto:support@voicetonotes.com', '_blank')}
                            >
                                Contact Support
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Help */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-blue-600">i</span>
                            </div>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Security Notice</p>
                                <p>
                                    We take your security seriously. If you didn&apos;t try to sign in recently,
                                    please secure your account and contact our support team immediately.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}