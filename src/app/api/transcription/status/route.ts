import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema
const statusSchema = z.object({
    jobId: z.string().optional(),
    noteId: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
});

// Store active connections for real-time updates
const activeConnections = new Map<string, {
    controller: ReadableStreamDefaultController;
    userId: string;
    lastPing: number;
}>();

// Clean up inactive connections every 30 seconds
setInterval(() => {
    const now = Date.now();
    for (const [connectionId, connection] of Array.from(activeConnections.entries())) {
        if (now - connection.lastPing > 60000) { // 1 minute timeout
            try {
                connection.controller.close();
            } catch (error) {
                // Ignore close errors
            }
            activeConnections.delete(connectionId);
        }
    }
}, 30000);

// GET - Server-Sent Events for real-time transcription status
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const validatedParams = statusSchema.safeParse(Object.fromEntries(searchParams));

        if (!validatedParams.success) {
            return NextResponse.json(
                {
                    error: 'Invalid query parameters',
                    details: validatedParams.error.issues
                },
                { status: 400 }
            );
        }

        const { jobId, noteId } = validatedParams.data;

        // Create SSE connection
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                const connectionId = `${session.user.id}-${Date.now()}-${Math.random()}`;

                activeConnections.set(connectionId, {
                    controller,
                    userId: session.user.id,
                    lastPing: Date.now(),
                });

                // Send initial connection message
                const initialData = {
                    type: 'connected',
                    connectionId,
                    timestamp: new Date().toISOString(),
                    jobId: jobId || null,
                    noteId: noteId || null,
                };

                const data = `data: ${JSON.stringify(initialData)}\n\n`;
                controller.enqueue(encoder.encode(data));

                // Set up cleanup on connection close
                request.signal.addEventListener('abort', () => {
                    activeConnections.delete(connectionId);
                    controller.close();
                });

                // Send periodic ping to keep connection alive
                const pingInterval = setInterval(() => {
                    const connection = activeConnections.get(connectionId);
                    if (connection) {
                        connection.lastPing = Date.now();
                        const pingData = {
                            type: 'ping',
                            timestamp: new Date().toISOString(),
                        };
                        const pingMessage = `data: ${JSON.stringify(pingData)}\n\n`;
                        try {
                            controller.enqueue(encoder.encode(pingMessage));
                        } catch (error) {
                            // Connection might be closed
                            activeConnections.delete(connectionId);
                            clearInterval(pingInterval);
                        }
                    } else {
                        clearInterval(pingInterval);
                    }
                }, 30000); // Ping every 30 seconds

                // If jobId is provided, start monitoring that job
                if (jobId) {
                    monitorJobStatus(jobId, connectionId, session.user.id);
                }

                // If noteId is provided, start monitoring that note
                if (noteId) {
                    monitorNoteStatus(noteId, connectionId, session.user.id);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
            },
        });

    } catch (error) {
        console.error('Transcription status SSE error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Monitor job status and broadcast updates
async function monitorJobStatus(jobId: string, connectionId: string, userId: string) {
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    let attempts = 0;

    const pollInterval = setInterval(async () => {
        attempts++;

        try {
            // Forward to MCP service for job status
            const mcpResponse = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-transcribe?jobId=${jobId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (mcpResponse.ok) {
                const mcpResult = await mcpResponse.json();

                if (mcpResult.success && mcpResult.data) {
                    broadcastToConnection(connectionId, {
                        type: 'job_status',
                        jobId,
                        data: mcpResult.data,
                        timestamp: new Date().toISOString(),
                    });

                    // Stop polling if job is completed or failed
                    if (mcpResult.data.status === 'completed' || mcpResult.data.status === 'failed') {
                        clearInterval(pollInterval);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error polling job status:', error);
        }

        // Stop polling after max attempts
        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            broadcastToConnection(connectionId, {
                type: 'job_timeout',
                jobId,
                message: 'Job status monitoring timeout',
                timestamp: new Date().toISOString(),
            });
        }
    }, 2000); // Poll every 2 seconds
}

// Monitor note status and broadcast updates
async function monitorNoteStatus(noteId: number, connectionId: string, userId: string) {
    let lastStatus = '';
    let lastUpdatedAt = '';

    const pollInterval = setInterval(async () => {
        try {
            const [note] = await db
                .select({
                    id: notes.id,
                    status: notes.status,
                    updatedAt: notes.updatedAt,
                })
                .from(notes)
                .where(and(
                    eq(notes.id, noteId),
                    eq(notes.userId, userId)
                ));

            if (note && (note.status !== lastStatus || note.updatedAt.toISOString() !== lastUpdatedAt)) {
                broadcastToConnection(connectionId, {
                    type: 'note_status',
                    noteId,
                    data: {
                        status: note.status,
                        updatedAt: note.updatedAt.toISOString(),
                    },
                    timestamp: new Date().toISOString(),
                });

                lastStatus = note.status || '';
                lastUpdatedAt = note.updatedAt.toISOString();

                // Stop polling if note is completed or failed
                if (note.status === 'completed' || note.status === 'failed') {
                    clearInterval(pollInterval);
                    return;
                }
            }
        } catch (error) {
            console.error('Error polling note status:', error);
        }
    }, 3000); // Poll every 3 seconds
}

// Broadcast message to specific connection
function broadcastToConnection(connectionId: string, message: Record<string, unknown>) {
    const connection = activeConnections.get(connectionId);
    if (connection) {
        try {
            const encoder = new TextEncoder();
            const data = `data: ${JSON.stringify(message)}\n\n`;
            connection.controller.enqueue(encoder.encode(data));
        } catch (error) {
            // Connection might be closed
            activeConnections.delete(connectionId);
        }
    }
}

// Broadcast message to all connections for a user
export function broadcastToUser(userId: string, message: Record<string, unknown>) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(message)}\n\n`;

    for (const [connectionId, connection] of Array.from(activeConnections.entries())) {
        if (connection.userId === userId) {
            try {
                connection.controller.enqueue(encoder.encode(data));
            } catch (error) {
                // Connection might be closed
                activeConnections.delete(connectionId);
            }
        }
    }
}

// Get connection statistics
export function getConnectionStats() {
    const userStats = new Map<string, number>();

    for (const connection of Array.from(activeConnections.values())) {
        const count = userStats.get(connection.userId) || 0;
        userStats.set(connection.userId, count + 1);
    }

    return {
        totalConnections: activeConnections.size,
        activeUsers: userStats.size,
        userConnections: Array.from(userStats.entries()).map(([userId, connectionCount]) => ({
            userId,
            connectionCount,
        })),
    };
}

// POST - Send manual status update (for testing or manual triggers)
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, jobId, noteId, data } = body;

        if (!type) {
            return NextResponse.json(
                { error: 'Message type is required' },
                { status: 400 }
            );
        }

        const message = {
            type,
            jobId: jobId || null,
            noteId: noteId || null,
            data: data || {},
            timestamp: new Date().toISOString(),
        };

        // Broadcast to all connections for this user
        broadcastToUser(session.user.id, message);

        return NextResponse.json({
            success: true,
            message: 'Status update broadcasted',
            stats: getConnectionStats(),
        });

    } catch (error) {
        console.error('Manual status update error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}