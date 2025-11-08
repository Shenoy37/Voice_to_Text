'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedUserMenu } from '@/components/EnhancedUserMenu';
import { useAuth } from '@/components/AuthProvider';
import EnhancedNotesList from '@/components/EnhancedNotesList';
import NoteAnalytics from '@/components/NoteAnalytics';
import NoteTemplates from '@/components/NoteTemplates';
import EnhancedCreateNoteModal from '@/components/EnhancedCreateNoteModal';
import NoteExport from '@/components/NoteExport';
import {
    BarChart3,
    FileText,
    Plus,
    LayoutGrid,
    Settings,
    Download,
    Star,
    Bookmark,
    Calendar,
    Tag,
    FolderOpen
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, isPending } = useAuth();
    const [activeTab, setActiveTab] = useState('notes');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

    useEffect(() => {
        if (!isPending && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, isPending, router]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in the useEffect
    }

    const handleNewNote = () => {
        setIsCreateModalOpen(true);
    };

    const handleTemplates = () => {
        setIsTemplatesModalOpen(true);
    };

    const handleExport = (noteId: number) => {
        setSelectedNoteId(noteId);
        setIsExportModalOpen(true);
    };

    const handleAnalytics = () => {
        setActiveTab('analytics');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Notes Dashboard</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <EnhancedUserMenu />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTemplates}
                                className="flex items-center gap-2"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                Templates
                            </Button>
                            <Button
                                onClick={handleNewNote}
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Note
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="notes" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Notes
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Templates
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Favorites
                        </TabsTrigger>
                        <TabsTrigger value="bookmarks" className="flex items-center gap-2">
                            <Bookmark className="h-4 w-4" />
                            Bookmarks
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">All Notes</h2>
                                <p className="text-muted-foreground">Manage and organize your notes</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleTemplates}
                                    className="flex items-center gap-2"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Templates
                                </Button>
                                <Button
                                    onClick={handleNewNote}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Note
                                </Button>
                            </div>
                        </div>
                        <EnhancedNotesList />
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">Analytics & Insights</h2>
                                <p className="text-muted-foreground">Track your note-taking patterns and productivity</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleAnalytics}
                                className="flex items-center gap-2"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Refresh Analytics
                            </Button>
                        </div>
                        <NoteAnalytics />
                    </TabsContent>

                    <TabsContent value="templates" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">Note Templates</h2>
                                <p className="text-muted-foreground">Quick start with pre-designed templates</p>
                            </div>
                            <Button
                                onClick={handleNewNote}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Note
                            </Button>
                        </div>
                        <NoteTemplates
                            open={isTemplatesModalOpen}
                            onOpenChange={setIsTemplatesModalOpen}
                        />
                    </TabsContent>

                    <TabsContent value="favorites" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">Favorite Notes</h2>
                                <p className="text-muted-foreground">Quick access to your starred notes</p>
                            </div>
                            <Button
                                onClick={handleNewNote}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Note
                            </Button>
                        </div>
                        <EnhancedNotesList />
                    </TabsContent>

                    <TabsContent value="bookmarks" className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">Bookmarked Notes</h2>
                                <p className="text-muted-foreground">Notes you&apos;ve saved for later reference</p>
                            </div>
                            <Button
                                onClick={handleNewNote}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Note
                            </Button>
                        </div>
                        <EnhancedNotesList />
                    </TabsContent>
                </Tabs>
            </main>

            {/* Quick Actions Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="flex flex-col gap-2">
                    <Button
                        size="lg"
                        onClick={handleNewNote}
                        className="rounded-full w-14 h-14 shadow-lg"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <EnhancedCreateNoteModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            <NoteTemplates
                open={isTemplatesModalOpen}
                onOpenChange={setIsTemplatesModalOpen}
            />

            <NoteExport
                open={isExportModalOpen}
                onOpenChange={setIsExportModalOpen}
                noteId={selectedNoteId}
            />
        </div>
    );
}