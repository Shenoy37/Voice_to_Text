'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/components/AuthProvider';
import {
    LogOut,
    User,
    Settings,
    CreditCard,
    HelpCircle,
    Shield,
    Sparkles,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedUserMenuProps {
    className?: string;
}

export function EnhancedUserMenu({ className }: EnhancedUserMenuProps) {
    const { session, logout, isLoading } = useAuth();
    const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

    if (!session?.user) return null;

    const handleSignOut = async () => {
        try {
            await logout();
            setIsSignOutDialogOpen(false);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <TooltipProvider>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    'relative h-10 px-3 rounded-full hover:bg-gray-100 transition-colors duration-200',
                                    'flex items-center gap-2 text-sm font-medium',
                                    className
                                )}
                                aria-label="User menu"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={session.user.image || ''}
                                        alt={session.user.name || ''}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                        {getUserInitials(session.user.name || 'User')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:block text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {session.user.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-32">
                                        {session.user.email}
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>User account menu</p>
                        </TooltipContent>
                    </Tooltip>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="w-64 p-2"
                    align="end"
                    forceMount
                    sideOffset={8}
                >
                    {/* User Info Header */}
                    <DropdownMenuLabel className="p-3 pb-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={session.user.image || ''}
                                    alt={session.user.name || ''}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                                    {getUserInitials(session.user.name || 'User')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {session.user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {session.user.email}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Pro
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Menu Items */}
                    <div className="space-y-1">
                        <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                            <User className="mr-3 h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <div className="text-sm font-medium">Profile</div>
                                <div className="text-xs text-gray-500">Manage your account</div>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                            <Settings className="mr-3 h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <div className="text-sm font-medium">Settings</div>
                                <div className="text-xs text-gray-500">Preferences and privacy</div>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                            <CreditCard className="mr-3 h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <div className="text-sm font-medium">Billing</div>
                                <div className="text-xs text-gray-500">Subscription and usage</div>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                            <Shield className="mr-3 h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <div className="text-sm font-medium">Security</div>
                                <div className="text-xs text-gray-500">Password and authentication</div>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                            <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                                <div className="text-sm font-medium">Help & Support</div>
                                <div className="text-xs text-gray-500">Get help and contact us</div>
                            </div>
                        </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Sign Out */}
                    <DropdownMenuItem
                        onClick={() => setIsSignOutDialogOpen(true)}
                        className="p-2 cursor-pointer hover:bg-red-50 rounded-md transition-colors text-red-600 focus:text-red-600"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">Sign Out</div>
                            <div className="text-xs opacity-75">Sign out of your account</div>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Out Confirmation Dialog */}
            <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-red-600" />
                            Sign Out
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            Are you sure you want to sign out? You&apos;ll need to sign in again to access your notes and account settings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                        <AlertDialogCancel
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSignOut}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Signing Out...
                                </>
                            ) : (
                                'Sign Out'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}

// Compact version for mobile or tight spaces
export function CompactUserMenu({ className }: EnhancedUserMenuProps) {
    const { session, logout, isLoading } = useAuth();
    const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

    if (!session?.user) return null;

    const handleSignOut = async () => {
        try {
            await logout();
            setIsSignOutDialogOpen(false);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            'relative h-8 w-8 rounded-full hover:bg-gray-100 transition-colors duration-200 p-0',
                            className
                        )}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={session.user.image || ''}
                                alt={session.user.name || ''}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                {getUserInitials(session.user.name || 'User')}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="w-48 p-1"
                    align="end"
                    forceMount
                    sideOffset={8}
                >
                    <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem className="p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsSignOutDialogOpen(true)}
                        className="p-2 cursor-pointer hover:bg-red-50 rounded-md transition-colors text-red-600 focus:text-red-600"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Sign Out Confirmation Dialog */}
            <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign Out</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to sign out?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSignOut}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading ? 'Signing Out...' : 'Sign Out'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}