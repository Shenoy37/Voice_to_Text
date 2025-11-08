'use client';

import { useState } from 'react';
import { useNotes, useDeleteNote } from '@/hooks/useNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotesList() {
    const [currentPage, setCurrentPage] = useState(1);
    const { data, isLoading, error } = useNotes({ page: currentPage, limit: 10 });
    const deleteNoteMutation = useDeleteNote();

    const handleDeleteNote = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNoteMutation.mutateAsync(id);
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const handleEditNote = (note: {
        id: number;
        title: string;
        content: string;
        summary?: string;
        transcription?: string;
        audioUrl?: string;
        duration?: number;
        status: 'draft' | 'published' | 'processing' | 'completed' | 'failed';
        priority: 'low' | 'medium' | 'high' | 'urgent';
        isFavorite: boolean;
        isBookmarked: boolean;
        categoryId?: number;
        reminderAt?: string;
        version: number;
        metadata?: Record<string, unknown>;
        wordCount: number;
        readingTime: number;
        createdAt: string;
        updatedAt: string;
    }) => {
        // This would open an edit dialog/modal
        console.log('Edit note:', note);
    };

    if (isLoading) return <div>Loading notes...</div>;
    if (error) return <div>Error loading notes</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.notes.map((note) => (
                    <Card key={note.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg line-clamp-2">
                                    {note.title}
                                </CardTitle>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditNote(note)}
                                        className="h-8 w-8"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        disabled={deleteNoteMutation.isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={note.status === 'published' ? 'default' : 'secondary'}>
                                    {note.status}
                                </Badge>
                                {note.duration && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {Math.floor(note.duration / 60)}:{(note.duration % 60).toString().padStart(2, '0')}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {note.summary && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {note.summary}
                                </p>
                            )}
                            <p className="text-sm line-clamp-3 mb-3">
                                {note.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                </div>
                                {note.audioUrl && (
                                    <Badge variant="outline" className="text-xs">
                                        🎤 Voice
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.total > 10 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={
                                    currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>

                        {Array.from({ length: Math.ceil(data.pagination.total / 10) }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(p => p + 1)}
                                className={
                                    !data.pagination.hasMore ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}