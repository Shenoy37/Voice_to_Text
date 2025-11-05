import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET - Fetch user's notes with pagination
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        const userNotes = await db
            .select({
                id: notes.id,
                title: notes.title,
                content: notes.content,
                summary: notes.summary,
                transcription: notes.transcription,
                audioUrl: notes.audioUrl,
                duration: notes.duration,
                status: notes.status,
                createdAt: notes.createdAt,
                updatedAt: notes.updatedAt,
            })
            .from(notes)
            .where(eq(notes.userId, parseInt(session.user.id)))
            .orderBy(desc(notes.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        const totalCount = await db
            .select({ count: notes.id })
            .from(notes)
            .where(eq(notes.userId, parseInt(session.user.id)));

        return NextResponse.json({
            notes: userNotes,
            pagination: {
                page,
                limit,
                total: totalCount.length,
                hasMore: offset + userNotes.length < totalCount.length,
            },
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
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

        const { title, content, summary, transcription, audioUrl, duration } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const [newNote] = await db.insert(notes)
            .values({
                title,
                content,
                summary,
                transcription,
                audioUrl,
                duration,
                userId: parseInt(session.user.id),
            })
            .returning();

        return NextResponse.json({ note: newNote }, { status: 201 });

    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}