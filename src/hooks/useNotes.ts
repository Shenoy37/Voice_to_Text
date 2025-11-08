import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Note {
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
}

interface NotesResponse {
    notes: Note[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
    meta: {
        search?: string;
        status?: string;
        priority?: string;
        categoryId?: number;
        tagIds?: number[];
        isFavorite?: boolean;
        isBookmarked?: boolean;
        hasReminder?: boolean;
        sortBy: string;
        sortOrder: string;
    };
}

interface NotesQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    categoryId?: number;
    tagIds?: number[];
    isFavorite?: boolean;
    isBookmarked?: boolean;
    hasReminder?: boolean;
    sortBy?: string;
    sortOrder?: string;
}

export function useNotes(params: NotesQueryParams = {}) {
    const {
        page = 1,
        limit = 10,
        search,
        status,
        priority,
        categoryId,
        tagIds,
        isFavorite,
        isBookmarked,
        hasReminder,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (priority) queryParams.append('priority', priority);
    if (categoryId) queryParams.append('categoryId', categoryId.toString());
    if (tagIds && tagIds.length > 0) queryParams.append('tagIds', tagIds.join(','));
    if (isFavorite !== undefined) queryParams.append('isFavorite', isFavorite.toString());
    if (isBookmarked !== undefined) queryParams.append('isBookmarked', isBookmarked.toString());
    if (hasReminder !== undefined) queryParams.append('hasReminder', hasReminder.toString());
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    return useQuery({
        queryKey: ['notes', params],
        queryFn: async (): Promise<NotesResponse> => {
            const response = await fetch(`/api/notes?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }
            return response.json();
        },
        placeholderData: (previousData) => previousData,
    });
}

export function useCreateNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (noteData: {
            title: string;
            content: string;
            summary?: string;
            transcription?: string;
            audioUrl?: string;
            duration?: number;
            priority?: 'low' | 'medium' | 'high' | 'urgent';
            isFavorite?: boolean;
            isBookmarked?: boolean;
            categoryId?: number;
            reminderAt?: string;
            metadata?: Record<string, unknown>;
            tagIds?: number[];
        }) => {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(noteData),
            });

            if (!response.ok) {
                throw new Error('Failed to create note');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

export function useUpdateNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            title,
            content,
            summary,
            status,
            priority,
            isFavorite,
            isBookmarked,
            categoryId,
            reminderAt,
            metadata,
            tagIds,
            changeDescription
        }: {
            id: number;
            title?: string;
            content?: string;
            summary?: string;
            status?: 'draft' | 'published' | 'processing' | 'completed' | 'failed';
            priority?: 'low' | 'medium' | 'high' | 'urgent';
            isFavorite?: boolean;
            isBookmarked?: boolean;
            categoryId?: number;
            reminderAt?: string;
            metadata?: Record<string, unknown>;
            tagIds?: number[];
            changeDescription?: string;
        }) => {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    summary,
                    status,
                    priority,
                    isFavorite,
                    isBookmarked,
                    categoryId,
                    reminderAt,
                    metadata,
                    tagIds,
                    changeDescription
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update note');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

export function useDeleteNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete note');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

// Hook for getting a single note
export function useNote(id: number) {
    return useQuery({
        queryKey: ['note', id],
        queryFn: async () => {
            const response = await fetch(`/api/notes/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch note');
            }
            const data = await response.json();
            return data.note;
        },
        enabled: !!id,
    });
}

// Hook for toggling favorite status
export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: boolean }) => {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isFavorite }),
            });

            if (!response.ok) {
                throw new Error('Failed to update favorite status');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
}

// Hook for toggling bookmark status
export function useToggleBookmark() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isBookmarked }: { id: number; isBookmarked: boolean }) => {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isBookmarked }),
            });

            if (!response.ok) {
                throw new Error('Failed to update bookmark status');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
}