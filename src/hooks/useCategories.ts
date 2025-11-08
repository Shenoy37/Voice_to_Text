import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
}

interface CategoriesResponse {
    categories: Category[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

interface CategoriesQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}

export function useCategories(params: CategoriesQueryParams = {}) {
    const {
        page = 1,
        limit = 50,
        search
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search);

    return useQuery({
        queryKey: ['categories', params],
        queryFn: async (): Promise<CategoriesResponse> => {
            const response = await fetch(`/api/categories?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        },
        placeholderData: (previousData) => previousData,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categoryData: {
            name: string;
            color?: string;
            icon?: string;
        }) => {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData),
            });

            if (!response.ok) {
                throw new Error('Failed to create category');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            color,
            icon
        }: {
            id: number;
            name?: string;
            color?: string;
            icon?: string;
        }) => {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, color, icon }),
            });

            if (!response.ok) {
                throw new Error('Failed to update category');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete category');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
}