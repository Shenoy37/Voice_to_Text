import { NextRequest, NextResponse } from 'next/server';
import { db, QueryOptimizer } from '@/db';
import { notes, categories, tags, noteTags, noteAnalytics } from '@/db/schema';
import { eq, desc, and, or, ilike, SQL, inArray, isNull, isNotNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    content: z.string().min(1, 'Content is required'),
    summary: z.string().optional(),
    transcription: z.string().optional(),
    audioUrl: z.string().url().optional().or(z.literal('')),
    duration: z.number().int().min(0).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    isFavorite: z.boolean().optional().default(false),
    isBookmarked: z.boolean().optional().default(false),
    categoryId: z.number().int().positive().optional(),
    reminderAt: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
});

const searchNotesSchema = z.object({
    search: z.string().optional(),
    status: z.enum(['draft', 'published', 'processing', 'completed', 'failed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    categoryId: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    tagIds: z.string().transform(val => val ? val.split(',').map(Number) : []).optional(),
    isFavorite: z.string().transform(val => val === 'true').optional(),
    isBookmarked: z.string().transform(val => val === 'true').optional(),
    hasReminder: z.string().transform(val => val === 'true').optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'wordCount']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

// GET - Fetch user's notes with pagination, search, and filtering
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const validatedParams = searchNotesSchema.safeParse(Object.fromEntries(searchParams));

        if (!validatedParams.success) {
            return NextResponse.json(
                {
                    error: 'Invalid query parameters',
                    details: validatedParams.error.issues
                },
                { status: 400 }
            );
        }

        const {
            search,
            status,
            priority,
            categoryId,
            tagIds,
            isFavorite,
            isBookmarked,
            hasReminder,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = validatedParams.data;

        const { offset, limit: safeLimit } = QueryOptimizer.paginate(null, page, limit);

        // Build query conditions
        const whereConditions: Array<SQL> = [eq(notes.userId, session.user.id)];

        if (status) {
            whereConditions.push(eq(notes.status, status));
        }

        if (priority) {
            whereConditions.push(eq(notes.priority, priority));
        }

        if (categoryId) {
            whereConditions.push(eq(notes.categoryId, categoryId));
        }

        if (isFavorite !== undefined) {
            whereConditions.push(eq(notes.isFavorite, isFavorite));
        }

        if (isBookmarked !== undefined) {
            whereConditions.push(eq(notes.isBookmarked, isBookmarked));
        }

        if (hasReminder !== undefined) {
            if (hasReminder) {
                whereConditions.push(isNotNull(notes.reminderAt));
            } else {
                whereConditions.push(isNull(notes.reminderAt));
            }
        }

        if (search) {
            const searchCondition = or(
                ilike(notes.title, `%${search}%`),
                ilike(notes.content, `%${search}%`),
                ilike(notes.summary, `%${search}%`)
            );
            if (searchCondition) {
                whereConditions.push(searchCondition);
            }
        }

        const finalWhereCondition = whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions);

        // Determine sort order
        const sortColumn = {
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
            title: notes.title,
            priority: notes.priority,
            wordCount: notes.wordCount,
        }[sortBy];

        const sortDirection = sortOrder === 'asc' ? sortColumn : desc(sortColumn);

        // Execute query with timing
        const { result: userNotes, executionTime } = await QueryOptimizer.timeQuery(
            'fetch-notes',
            async () => {
                // Get notes with optional category and tags
                const notesQuery = db
                    .select({
                        id: notes.id,
                        title: notes.title,
                        content: notes.content,
                        summary: notes.summary,
                        transcription: notes.transcription,
                        audioUrl: notes.audioUrl,
                        duration: notes.duration,
                        status: notes.status,
                        priority: notes.priority,
                        isFavorite: notes.isFavorite,
                        isBookmarked: notes.isBookmarked,
                        categoryId: notes.categoryId,
                        reminderAt: notes.reminderAt,
                        wordCount: notes.wordCount,
                        readingTime: notes.readingTime,
                        createdAt: notes.createdAt,
                        updatedAt: notes.updatedAt,
                    })
                    .from(notes)
                    .where(finalWhereCondition)
                    .orderBy(sortDirection)
                    .limit(safeLimit)
                    .offset(offset);

                // If tagIds filter is applied, we need to join with noteTags
                if (tagIds && tagIds.length > 0) {
                    return db
                        .select({
                            id: notes.id,
                            title: notes.title,
                            content: notes.content,
                            summary: notes.summary,
                            transcription: notes.transcription,
                            audioUrl: notes.audioUrl,
                            duration: notes.duration,
                            status: notes.status,
                            priority: notes.priority,
                            isFavorite: notes.isFavorite,
                            isBookmarked: notes.isBookmarked,
                            categoryId: notes.categoryId,
                            reminderAt: notes.reminderAt,
                            wordCount: notes.wordCount,
                            readingTime: notes.readingTime,
                            createdAt: notes.createdAt,
                            updatedAt: notes.updatedAt,
                        })
                        .from(notes)
                        .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
                        .where(and(
                            finalWhereCondition,
                            inArray(noteTags.tagId, tagIds)
                        ))
                        .orderBy(sortDirection)
                        .limit(safeLimit)
                        .offset(offset);
                }

                return notesQuery;
            }
        );

        // Get total count for pagination
        const { result: totalCount } = await QueryOptimizer.timeQuery(
            'count-notes',
            async () => {
                if (tagIds && tagIds.length > 0) {
                    return db
                        .select({ count: notes.id })
                        .from(notes)
                        .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
                        .where(and(
                            finalWhereCondition,
                            inArray(noteTags.tagId, tagIds)
                        ));
                }
                return db
                    .select({ count: notes.id })
                    .from(notes)
                    .where(finalWhereCondition);
            }
        );

        return NextResponse.json({
            notes: userNotes,
            pagination: {
                page,
                limit: safeLimit,
                total: totalCount.length,
                hasMore: offset + userNotes.length < totalCount.length,
            },
            meta: {
                queryTime: executionTime,
                search: search || null,
                status: status || null,
                priority: priority || null,
                categoryId: categoryId || null,
                tagIds: tagIds || null,
                isFavorite: isFavorite || null,
                isBookmarked: isBookmarked || null,
                hasReminder: hasReminder || null,
                sortBy,
                sortOrder,
            },
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
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

// POST - Create new note
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createNoteSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    details: validatedData.error.issues
                },
                { status: 400 }
            );
        }

        // Calculate word count and reading time
        const wordCount = validatedData.data.content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

        const { result: newNote, executionTime } = await QueryOptimizer.timeQuery(
            'create-note',
            async () => {
                // Create the note
                const noteData = {
                    title: validatedData.data.title,
                    content: validatedData.data.content,
                    summary: validatedData.data.summary,
                    transcription: validatedData.data.transcription,
                    audioUrl: validatedData.data.audioUrl,
                    duration: validatedData.data.duration,
                    priority: validatedData.data.priority,
                    isFavorite: validatedData.data.isFavorite,
                    isBookmarked: validatedData.data.isBookmarked,
                    categoryId: validatedData.data.categoryId,
                    reminderAt: validatedData.data.reminderAt ? new Date(validatedData.data.reminderAt) : null,
                    metadata: validatedData.data.metadata,
                    wordCount,
                    readingTime,
                    userId: session.user.id,
                };

                const createdNote = await db.insert(notes)
                    .values(noteData)
                    .returning();

                // Create analytics record
                await db.insert(noteAnalytics)
                    .values({
                        noteId: createdNote[0].id,
                        userId: session.user.id,
                        viewCount: 0,
                        editCount: 0,
                        shareCount: 0,
                    });

                // Add tags if provided
                if (validatedData.data.tagIds && validatedData.data.tagIds.length > 0) {
                    await db.insert(noteTags)
                        .values(
                            validatedData.data.tagIds.map(tagId => ({
                                noteId: createdNote[0].id,
                                tagId,
                            }))
                        );
                }

                return createdNote;
            }
        );

        return NextResponse.json({
            note: newNote[0],
            meta: {
                queryTime: executionTime,
                timestamp: new Date().toISOString(),
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating note:', error);

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                return NextResponse.json(
                    { error: 'A note with this title already exists' },
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