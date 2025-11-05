import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// PUT - Update note
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, content, status } = await request.json();
        const noteId = parseInt(params.id);

        const [updatedNote] = await db.update(notes)
            .set({
                title,
                content,
                status,
                updatedAt: new Date(),
            })
            .where(and(
                eq(notes.id, noteId),
                eq(notes.userId, parseInt(session.user.id))
            ))
            .returning();

        if (!updatedNote) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({ note: updatedNote });

    } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete note
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const noteId = parseInt(params.id);

        const deletedNote = await db.delete(notes)
            .where(and(
                eq(notes.id, noteId),
                eq(notes.userId, parseInt(session.user.id))
            ))
            .returning();

        if (!deletedNote.length) {
            return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Note deleted successfully' });

    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}