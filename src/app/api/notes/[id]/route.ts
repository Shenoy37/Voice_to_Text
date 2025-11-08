import { NextRequest, NextResponse } from 'next/server';
import { db, QueryOptimizer } from '@/db';
import { notes, noteTags, noteVersions, noteAnalytics } from '@/db/schema';
import { eq, and, SQL, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const updateNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    summary: z.string().optional(),
    status: z.enum(['draft', 'published', 'processing', 'completed', 'failed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    isFavorite: z.boolean().optional(),
    isBookmarked: z.boolean().optional(),
    categoryId: z.number().int().positive().optional().nullable(),
    reminderAt: z.string().datetime().optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    changeDescription: z.string().optional(), // For versioning
});

const paramsSchema = z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
});

// PUT - Update note
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate parameters
        const paramsValidation = paramsSchema.safeParse(await params);
        if (!paramsValidation.success) {
            return NextResponse.json(
                { error: 'Invalid note ID' },
                { status: 400 }
            );
        }
        const noteId = paramsValidation.data.id;

        const body = await request.json();
        const validatedData = updateNoteSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    details: validatedData.error.issues
                },
                { status: 400 }
            );
        }

        // Get current note for versioning
        const currentNoteResult = await QueryOptimizer.timeQuery(
            'get-current-note',
            () => db
                .select()
                .from(notes)
                .where(and(
                    eq(notes.id, noteId),
                    eq(notes.userId, session.user.id)
                ))
        );

        if (!currentNoteResult.result.length) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        const currentNote = currentNoteResult.result[0];

        // Only include fields that were actually provided
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (validatedData.data.title !== undefined) updateData.title = validatedData.data.title;
        if (validatedData.data.content !== undefined) {
            updateData.content = validatedData.data.content;
            // Update word count and reading time
            const wordCount = validatedData.data.content.split(/\s+/).length;
            updateData.wordCount = wordCount;
            updateData.readingTime = Math.ceil(wordCount / 200);
        }
        if (validatedData.data.summary !== undefined) updateData.summary = validatedData.data.summary;
        if (validatedData.data.status !== undefined) updateData.status = validatedData.data.status;
        if (validatedData.data.priority !== undefined) updateData.priority = validatedData.data.priority;
        if (validatedData.data.isFavorite !== undefined) updateData.isFavorite = validatedData.data.isFavorite;
        if (validatedData.data.isBookmarked !== undefined) updateData.isBookmarked = validatedData.data.isBookmarked;
        if (validatedData.data.categoryId !== undefined) updateData.categoryId = validatedData.data.categoryId;
        if (validatedData.data.reminderAt !== undefined) {
            updateData.reminderAt = validatedData.data.reminderAt ? new Date(validatedData.data.reminderAt) : null;
        }
        if (validatedData.data.metadata !== undefined) updateData.metadata = validatedData.data.metadata;

        // Increment version
        updateData.version = (currentNote.version || 1) + 1;

        const { result: updatedNote, executionTime } = await QueryOptimizer.timeQuery(
            'update-note',
            async () => {
                // Update the note
                const updated = await db.update(notes)
                    .set(updateData)
                    .where(and(
                        eq(notes.id, noteId),
                        eq(notes.userId, session.user.id)
                    ))
                    .returning();

                // Create version record
                await db.insert(noteVersions)
                    .values({
                        noteId,
                        version: updateData.version as number,
                        title: currentNote.title,
                        content: currentNote.content,
                        summary: currentNote.summary,
                        changeDescription: validatedData.data.changeDescription || 'Note updated',
                        userId: session.user.id,
                    });

                // Update analytics
                await db.update(noteAnalytics)
                    .set({
                        editCount: sql`${noteAnalytics.editCount} + 1`,
                        lastEditedAt: new Date(),
                    })
                    .where(eq(noteAnalytics.noteId, noteId));

                // Update tags if provided
                if (validatedData.data.tagIds !== undefined) {
                    // Remove existing tags
                    await db.delete(noteTags)
                        .where(eq(noteTags.noteId, noteId));

                    // Add new tags
                    if (validatedData.data.tagIds.length > 0) {
                        await db.insert(noteTags)
                            .values(
                                validatedData.data.tagIds.map(tagId => ({
                                    noteId,
                                    tagId,
                                }))
                            );
                    }
                }

                return updated;
            }
        );

        if (!updatedNote.length) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({
            note: updatedNote[0],
            meta: {
                queryTime: executionTime,
                timestamp: new Date().toISOString(),
            }
        });

    } catch (error) {
        console.error('Error updating note:', error);

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('duplicate key')) {
                return NextResponse.json(
                    { error: 'A note with this title already exists' },
                    { status: 409 }
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

// DELETE - Delete note
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate parameters
        const paramsValidation = paramsSchema.safeParse(await params);
        if (!paramsValidation.success) {
            return NextResponse.json(
                { error: 'Invalid note ID' },
                { status: 400 }
            );
        }
        const noteId = paramsValidation.data.id;

        const { result: deletedNote, executionTime } = await QueryOptimizer.timeQuery(
            'delete-note',
            () => db.delete(notes)
                .where(and(
                    eq(notes.id, noteId),
                    eq(notes.userId, session.user.id)
                ))
                .returning()
        );

        if (!deletedNote.length) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Note deleted successfully',
            meta: {
                queryTime: executionTime,
                timestamp: new Date().toISOString(),
            }
        });

    } catch (error) {
        console.error('Error deleting note:', error);

        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('foreign key constraint')) {
                return NextResponse.json(
                    { error: 'Cannot delete note due to dependencies' },
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

// GET - Get single note
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate parameters
        const paramsValidation = paramsSchema.safeParse(await params);
        if (!paramsValidation.success) {
            return NextResponse.json(
                { error: 'Invalid note ID' },
                { status: 400 }
            );
        }
        const noteId = paramsValidation.data.id;

        const { result: note, executionTime } = await QueryOptimizer.timeQuery(
            'get-note',
            async () => {
                // Get note with analytics
                const noteData = await db
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
                        version: notes.version,
                        metadata: notes.metadata,
                        wordCount: notes.wordCount,
                        readingTime: notes.readingTime,
                        createdAt: notes.createdAt,
                        updatedAt: notes.updatedAt,
                    })
                    .from(notes)
                    .where(and(
                        eq(notes.id, noteId),
                        eq(notes.userId, session.user.id)
                    ));

                // Update analytics - increment view count
                if (noteData.length > 0) {
                    await db.update(noteAnalytics)
                        .set({
                            viewCount: sql`${noteAnalytics.viewCount} + 1`,
                            lastViewedAt: new Date(),
                        })
                        .where(eq(noteAnalytics.noteId, noteId));
                }

                return noteData;
            }
        );

        if (!note.length) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({
            note: note[0],
            meta: {
                queryTime: executionTime,
                timestamp: new Date().toISOString(),
            }
        });

    } catch (error) {
        console.error('Error fetching note:', error);
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