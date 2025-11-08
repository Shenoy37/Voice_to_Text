import { NextRequest, NextResponse } from 'next/server';
import { db, QueryOptimizer } from '@/db';
import { tags, noteTags } from '@/db/schema';
import { eq, desc, SQL, ilike, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createTagSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#10B981'),
});

const searchTagsSchema = z.object({
    search: z.string().optional(),
    includeUsageCount: z.string().transform(val => val === 'true').optional(),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

// GET - Fetch user's tags
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const validatedParams = searchTagsSchema.safeParse(Object.fromEntries(searchParams));

        if (!validatedParams.success) {
            return NextResponse.json(
                {
                    error: 'Invalid query parameters',
                    details: validatedParams.error.issues
                },
                { status: 400 }
            );
        }

        const { search, includeUsageCount = false, page = 1, limit = 50 } = validatedParams.data;
        const { offset, limit: safeLimit } = QueryOptimizer.paginate(null, page, limit);

        // Build query conditions
        let whereCondition: SQL = eq(tags.userId, session.user.id);

        if (search) {
            whereCondition = and(
                eq(tags.userId, session.user.id),
                ilike(tags.name, `%${search}%`)
            ) as SQL;
        }

        // Execute query with timing
        const { result: userTags, executionTime } = await QueryOptimizer.timeQuery(
            'fetch-tags',
            async () => {
                if (includeUsageCount) {
                    // Get tags with usage count
                    const tagsWithCount = await db
                        .select({
                            id: tags.id,
                            name: tags.name,
                            color: tags.color,
                            createdAt: tags.createdAt,
                            usageCount: { count: noteTags.tagId },
                        })
                        .from(tags)
                        .leftJoin(noteTags, eq(tags.id, noteTags.tagId))
                        .where(whereCondition)
                        .groupBy(tags.id)
                        .orderBy(desc(tags.createdAt))
                        .limit(safeLimit)
                        .offset(offset);

                    return tagsWithCount;
                } else {
                    // Get tags without usage count
                    return db
                        .select({
                            id: tags.id,
                            name: tags.name,
                            color: tags.color,
                            createdAt: tags.createdAt,
                        })
                        .from(tags)
                        .where(whereCondition)
                        .orderBy(desc(tags.createdAt))
                        .limit(safeLimit)
                        .offset(offset);
                }
            }
        );

        // Get total count for pagination
        const { result: totalCount } = await QueryOptimizer.timeQuery(
            'count-tags',
            () => db
                .select({ count: tags.id })
                .from(tags)
                .where(whereCondition)
        );

        return NextResponse.json({
            tags: userTags,
            pagination: {
                page,
                limit: safeLimit,
                total: totalCount.length,
                hasMore: offset + userTags.length < totalCount.length,
            },
            meta: {
                queryTime: executionTime,
                search: search || null,
                includeUsageCount,
            },
        });

    } catch (error) {
        console.error('Error fetching tags:', error);
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

// POST - Create new tag
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createTagSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    details: validatedData.error.issues
                },
                { status: 400 }
            );
        }

        const { result: newTag, executionTime } = await QueryOptimizer.timeQuery(
            'create-tag',
            () => db.insert(tags)
                .values({
                    ...validatedData.data,
                    userId: session.user.id,
                })
                .returning()
        );

        return NextResponse.json({
            tag: newTag[0],
            meta: {
                queryTime: executionTime,
                timestamp: new Date().toISOString(),
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating tag:', error);

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                return NextResponse.json(
                    { error: 'A tag with this name already exists' },
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