import { NextRequest } from 'next/server';

// Store active SSE connections
const connections = new Map<string, {
    controller: ReadableStreamDefaultController;
    jobId: string;
}>();

// SSE endpoint for real-time transcription progress
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return new Response('Missing jobId parameter', { status: 400 });
    }

    // Create a new SSE connection
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            const connectionId = `${jobId}-${Date.now()}`;
            connections.set(connectionId, { controller, jobId });

            // Send initial connection message
            const data = `data: ${JSON.stringify({
                type: 'connected',
                jobId,
                timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Set up cleanup on connection close
            request.signal.addEventListener('abort', () => {
                connections.delete(connectionId);
                controller.close();
            });

            // Send periodic ping to keep connection alive
            const pingInterval = setInterval(() => {
                if (connections.has(connectionId)) {
                    const pingData = `data: ${JSON.stringify({
                        type: 'ping',
                        timestamp: new Date().toISOString(),
                    })}\n\n`;
                    controller.enqueue(encoder.encode(pingData));
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000); // Ping every 30 seconds
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
}

// Broadcast job progress to all subscribers
export function broadcastJobProgress(jobId: string, progress: {
    status: string;
    progress: number;
    error?: string;
    result?: unknown;
}) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
        type: 'job_progress',
        jobId,
        data: progress,
        timestamp: new Date().toISOString(),
    })}\n\n`;

    // Send to all connections for this job
    for (const [connectionId, connection] of Array.from(connections.entries())) {
        if (connection.jobId === jobId) {
            try {
                connection.controller.enqueue(encoder.encode(data));
            } catch (error) {
                // Connection might be closed, remove it
                connections.delete(connectionId);
            }
        }
    }
}

// Broadcast job completion to all subscribers
export function broadcastJobCompletion(jobId: string, result: {
    transcription: string;
    summary: string;
    duration?: number;
    language?: string;
}) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
        type: 'job_completed',
        jobId,
        data: result,
        timestamp: new Date().toISOString(),
    })}\n\n`;

    // Send to all connections for this job
    for (const [connectionId, connection] of Array.from(connections.entries())) {
        if (connection.jobId === jobId) {
            try {
                connection.controller.enqueue(encoder.encode(data));
            } catch (error) {
                // Connection might be closed, remove it
                connections.delete(connectionId);
            }
        }
    }

    // Clean up connections for this job after completion
    cleanupJobConnections(jobId);
}

// Broadcast job error to all subscribers
export function broadcastJobError(jobId: string, error: {
    message: string;
    code?: string;
}) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
        type: 'job_error',
        jobId,
        data: error,
        timestamp: new Date().toISOString(),
    })}\n\n`;

    // Send to all connections for this job
    for (const [connectionId, connection] of Array.from(connections.entries())) {
        if (connection.jobId === jobId) {
            try {
                connection.controller.enqueue(encoder.encode(data));
            } catch (error) {
                // Connection might be closed, remove it
                connections.delete(connectionId);
            }
        }
    }

    // Clean up connections for this job after error
    cleanupJobConnections(jobId);
}

// Clean up all connections for a specific job
function cleanupJobConnections(jobId: string) {
    for (const [connectionId, connection] of Array.from(connections.entries())) {
        if (connection.jobId === jobId) {
            connections.delete(connectionId);
            try {
                connection.controller.close();
            } catch (error) {
                // Ignore close errors
            }
        }
    }
}

// Get connection statistics
export function getConnectionStats() {
    const jobStats = new Map<string, number>();

    for (const connection of Array.from(connections.values())) {
        const count = jobStats.get(connection.jobId) || 0;
        jobStats.set(connection.jobId, count + 1);
    }

    return {
        totalConnections: connections.size,
        activeJobs: jobStats.size,
        jobDetails: Array.from(jobStats.entries()).map(([jobId, connectionCount]) => ({
            jobId,
            connectionCount,
        })),
    };
}