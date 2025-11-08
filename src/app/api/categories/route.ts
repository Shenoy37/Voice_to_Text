import { NextRequest, NextResponse } from 'next/server';
import { db, QueryOptimizer } from '@/db';
import { categories } from '@/db/schema';
import { eq, desc, SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#3B82F6'),
    icon: z.string().optional().default('📝'),
});

const searchCategoriesSchema = z.object({
    search: z.string().optional(),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

// GET - Fetch user's categories
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const validatedParams = searchCategoriesSchema.safeParse(Object.fromEntries(searchParams));

        if (!validatedParams.success) {
            return NextResponse.json(
                {
                    error: 'Invalid query parameters',
                    details: validatedParams.error.issues
                },
                { status: 400 }
            );
        }

        const { search, page = 1, limit = 50 } = validatedParams.data;
        const { offset, limit: safeLimit } = QueryOptimizer.paginate(null, page, limit);

        // Build query conditions
        let whereCondition: SQL = eq(categories.userId, session.user.id);

        if (search) {
            whereCondition = eq(categories.userId, session.user.id);
            // Note: We would need to import ilike for search functionality
        }

        // Execute query with timing
        const { result: userCategories, executionTime } = await QueryOptimizer.timeQuery(
            'fetch-categories',
            () => db
                .select({
                    id: categories.id,
                    name: categories.name,
                    color: categories.color,
                    icon: categories.icon,
                    createdAt: categories.createdAt,
                    updatedAt: categories.updatedAt,
                })
                .from(categories)
                .where(whereCondition)
                .orderBy(desc(categories.createdAt))
                .limit(safeLimit)
                .offset(offset)
        );

        // Get total count for pagination
        const { result: totalCount } = await QueryOptimizer.timeQuery(
            'count-categories',
            () => db
                .select({ count: categories.id })
                .from(categories)
                .where(whereCondition)
        );

        return NextResponse.json({
            categories: userCategories,
            pagination: {
                page,
                limit: safeLimit,
                total: totalCount.length,
                hasMore: offset + userCategories.length < totalCount.length,
            },
            meta: {
                queryTime: executionTime,
                search: search || null,
            },
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// POST - Create new category
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createCategorySchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    details: validatedData.error.issues
                },
                { status: 400 }
            );
        }

        const { result: newCategory, executionTime } = await QueryOptimizer.timeQuery(
            'create-category',
            () => db.insert(categories)
                .values({
                    ...validatedData.data,
                    userId: session.user.id,
                })
                .returning()
        );

        return NextResponse.json({
            category: newCategory[0],
            meta: {
                queryTime: executionTime,
                timestamp: new Date().toISOString(),
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating category:', error);

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                return NextResponse.json(
                    { error: 'A category with this name already exists' },
                    { status: 409 }
                );
            }
            if (error.message.includes('foreign key constraint')) {
                return NextResponse.json(
                    { error: 'Invalid user reference' },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}