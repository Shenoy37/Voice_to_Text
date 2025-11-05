import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Note {
    id: number;
    title: string;
    content: string;
    summary?: string;
    transcription?: string;
    audioUrl?: string;
    duration?: number;
    status: 'draft' | 'published';
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
}

export function useNotes(page: number = 1, limit: number = 10) {
    return useQuery({
        queryKey: ['notes', page, limit],
        queryFn: async (): Promise<NotesResponse> => {
            const response = await fetch(`/api/notes?page=${page}&limit=${limit}`);
            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }
            return response.json();
        },
        keepPreviousData: true,
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
            status
        }: {
            id: number;
            title: string;
            content: string;
            status?: 'draft' | 'published';
        }) => {
            const response = await fetch(`/api/notes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update note');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
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
        },
    });
}