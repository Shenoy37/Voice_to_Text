import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Tag {
    id: number;
    name: string;
    color: string;
    createdAt: string;
    usageCount?: number;
}

interface TagsResponse {
    tags: Tag[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

interface TagsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    includeUsageCount?: boolean;
}

export function useTags(params: TagsQueryParams = {}) {
    const {
        page = 1,
        limit = 50,
        search,
        includeUsageCount = false
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search);
    queryParams.append('includeUsageCount', includeUsageCount.toString());

    return useQuery({
        queryKey: ['tags', params],
        queryFn: async (): Promise<TagsResponse> => {
            const response = await fetch(`/api/tags?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tags');
            }
            return response.json();
        },
        placeholderData: (previousData) => previousData,
    });
}

export function useCreateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tagData: {
            name: string;
            color?: string;
        }) => {
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tagData),
            });

            if (!response.ok) {
                throw new Error('Failed to create tag');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

export function useUpdateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            color
        }: {
            id: number;
            name?: string;
            color?: string;
        }) => {
            const response = await fetch(`/api/tags/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, color }),
            });

            if (!response.ok) {
                throw new Error('Failed to update tag');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

export function useDeleteTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/tags/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete tag');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
}

// Hook for getting popular tags (most used)
export function usePopularTags(limit: number = 10) {
    return useQuery({
        queryKey: ['tags', { includeUsageCount: true, limit, sortBy: 'usageCount' }],
        queryFn: async (): Promise<Tag[]> => {
            const response = await fetch(`/api/tags?includeUsageCount=true&limit=${limit}`);
            if (!response.ok) {
                throw new Error('Failed to fetch popular tags');
            }
            const data = await response.json();
            // Sort by usage count in descending order
            return data.tags.sort((a: Tag, b: Tag) => (b.usageCount || 0) - (a.usageCount || 0));
        },
    });
}