import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Start transcription and create note
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.formData();
        const file: File | null = data.get('audioFile') as unknown as File;
        const title = (data.get('title') as string) || 'New Voice Note';
        const language = (data.get('language') as string) || 'en';
        const temperature = parseFloat((data.get('temperature') as string) || '0.0');
        const generateSummary = (data.get('generateSummary') as string) === 'true';

        if (!file) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a',
            'audio/wav', 'audio/webm', 'audio/flac', 'audio/aac', 'audio/ogg'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Supported formats: MP3, WAV, WebM, M4A, FLAC, AAC, OGG' },
                { status: 400 }
            );
        }

        // Validate file size (max 25MB)
        const maxSize = 25 * 1024 * 1024; // 25MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 25MB.' },
                { status: 400 }
            );
        }

        // Create initial note record with "processing" status
        const [newNote] = await db.insert(notes)
            .values({
                title,
                content: '',
                summary: '',
                transcription: '',
                audioUrl: '', // Will be updated after processing
                duration: 0,
                status: 'processing',
                userId: session.user.id,
            })
            .returning();

        try {
            // Forward the request to the MCP transcription service
            const formData = new FormData();
            formData.append('audioFile', file);
            formData.append('language', language);
            formData.append('temperature', temperature.toString());
            formData.append('generateSummary', generateSummary.toString());

            const mcpResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-transcribe`, {
                method: 'POST',
                body: formData,
                headers: {
                    // Forward the original authorization header
                    'Authorization': request.headers.get('Authorization') || '',
                },
            });

            if (!mcpResponse.ok) {
                const errorData = await mcpResponse.json();
                throw new Error(errorData.error || 'Transcription service failed');
            }

            const mcpResult = await mcpResponse.json();

            // Update the note with transcription results
            const [updatedNote] = await db.update(notes)
                .set({
                    content: mcpResult.data?.result?.transcription || '',
                    summary: mcpResult.data?.result?.summary || '',
                    transcription: mcpResult.data?.result?.transcription || '',
                    status: 'completed',
                    updatedAt: new Date(),
                })
                .where(eq(notes.id, newNote.id))
                .returning();

            return NextResponse.json({
                success: true,
                data: {
                    note: updatedNote,
                    jobId: mcpResult.data?.jobId,
                },
            });

        } catch (transcriptionError) {
            // Update note with failed status
            await db.update(notes)
                .set({
                    status: 'failed',
                    updatedAt: new Date(),
                })
                .where(eq(notes.id, newNote.id));

            throw transcriptionError;
        }

    } catch (error) {
        console.error('Transcription error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET - Get transcription status
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');
        const noteId = searchParams.get('noteId');

        if (jobId) {
            // Forward to MCP service for job status
            const mcpResponse = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-transcribe?jobId=${jobId}`,
                {
                    headers: {
                        'Authorization': request.headers.get('Authorization') || '',
                    },
                }
            );

            if (!mcpResponse.ok) {
                const errorData = await mcpResponse.json();
                return NextResponse.json(
                    { error: errorData.error || 'Failed to get job status' },
                    { status: mcpResponse.status }
                );
            }

            const mcpResult = await mcpResponse.json();
            return NextResponse.json(mcpResult);
        }

        if (noteId) {
            // Get note status from database
            const [note] = await db
                .select({
                    id: notes.id,
                    title: notes.title,
                    status: notes.status,
                    content: notes.content,
                    summary: notes.summary,
                    transcription: notes.transcription,
                    createdAt: notes.createdAt,
                    updatedAt: notes.updatedAt,
                })
                .from(notes)
                .where(and(
                    eq(notes.id, parseInt(noteId)),
                    eq(notes.userId, session.user.id)
                ));

            if (!note) {
                return NextResponse.json({ error: 'Note not found' }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: note,
            });
        }

        return NextResponse.json(
            { error: 'Missing jobId or noteId parameter' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Transcription status error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}