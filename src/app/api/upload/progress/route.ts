import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Store active upload progress tracking
const uploadProgress = new Map<string, {
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    message?: string;
    startTime: number;
    estimatedTime?: number;
    bytesUploaded?: number;
    totalBytes?: number;
}>();

// Store active SSE connections for upload progress
const activeConnections = new Map<string, {
    controller: ReadableStreamDefaultController;
    userId: string;
    uploadId?: string;
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

// GET - Server-Sent Events for real-time upload progress
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get('uploadId');

        // Create SSE connection
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                const connectionId = `${session.user.id}-${Date.now()}-${Math.random()}`;

                activeConnections.set(connectionId, {
                    controller,
                    userId: session.user.id,
                    uploadId: uploadId || undefined,
                    lastPing: Date.now(),
                });

                // Send initial connection message
                const initialData = {
                    type: 'connected',
                    connectionId,
                    timestamp: new Date().toISOString(),
                    uploadId: uploadId || null,
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

                // If uploadId is provided, send current progress
                if (uploadId) {
                    const progress = uploadProgress.get(uploadId);
                    if (progress) {
                        const progressData = {
                            type: 'upload_progress',
                            uploadId,
                            data: progress,
                            timestamp: new Date().toISOString(),
                        };
                        const progressMessage = `data: ${JSON.stringify(progressData)}\n\n`;
                        controller.enqueue(encoder.encode(progressMessage));
                    }
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
        console.error('Upload progress SSE error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

// POST - Update upload progress
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const { uploadId, progress, status, message, bytesUploaded, totalBytes } = body;

        if (!uploadId) {
            return new Response(JSON.stringify({ error: 'Upload ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update progress tracking
        const currentProgress = uploadProgress.get(uploadId) || {
            progress: 0,
            status: 'pending' as const,
            startTime: Date.now(),
        };

        const updatedProgress = {
            ...currentProgress,
            progress: progress !== undefined ? progress : currentProgress.progress,
            status: status || currentProgress.status,
            message: message || currentProgress.message,
            bytesUploaded: bytesUploaded !== undefined ? bytesUploaded : currentProgress.bytesUploaded,
            totalBytes: totalBytes !== undefined ? totalBytes : currentProgress.totalBytes,
        };

        // Calculate estimated time remaining
        if (updatedProgress.bytesUploaded && updatedProgress.totalBytes && updatedProgress.progress > 0) {
            const elapsedTime = Date.now() - updatedProgress.startTime;
            const estimatedTotalTime = elapsedTime / (updatedProgress.progress / 100);
            updatedProgress.estimatedTime = Math.max(0, estimatedTotalTime - elapsedTime);
        }

        uploadProgress.set(uploadId, updatedProgress);

        // Broadcast progress to all connections for this user
        broadcastUploadProgress(session.user.id, uploadId, updatedProgress);

        return new Response(JSON.stringify({
            success: true,
            uploadId,
            progress: updatedProgress,
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upload progress update error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Clean up upload progress
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get('uploadId');

        if (!uploadId) {
            return new Response(JSON.stringify({ error: 'Upload ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Remove progress tracking
        uploadProgress.delete(uploadId);

        // Notify connections about cleanup
        broadcastUploadProgress(session.user.id, uploadId, {
            progress: 0,
            status: 'failed',
            message: 'Upload cancelled or cleaned up',
            startTime: Date.now(),
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Upload progress cleaned up',
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upload progress cleanup error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Broadcast upload progress to all connections for a user
function broadcastUploadProgress(userId: string, uploadId: string, progress: Record<string, unknown>) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
        type: 'upload_progress',
        uploadId,
        data: progress,
        timestamp: new Date().toISOString(),
    })}\n\n`;

    for (const [connectionId, connection] of Array.from(activeConnections.entries())) {
        if (connection.userId === userId && (!connection.uploadId || connection.uploadId === uploadId)) {
            try {
                connection.controller.enqueue(encoder.encode(data));
            } catch (error) {
                // Connection might be closed
                activeConnections.delete(connectionId);
            }
        }
    }
}

// Get upload progress statistics
export function getUploadStats() {
    const userStats = new Map<string, number>();

    for (const [uploadId, progress] of Array.from(uploadProgress.entries())) {
        // Count uploads by status
        const statusKey = `${progress.status}_uploads`;
        const count = userStats.get(statusKey) || 0;
        userStats.set(statusKey, count + 1);
    }

    return {
        totalActiveUploads: uploadProgress.size,
        statusBreakdown: Object.fromEntries(userStats),
        activeConnections: activeConnections.size,
    };
}

// Utility function to create upload progress tracker
export function createUploadTracker(uploadId: string, totalBytes?: number) {
    const progress = {
        progress: 0,
        status: 'pending' as const,
        startTime: Date.now(),
        totalBytes,
        bytesUploaded: 0,
    };

    uploadProgress.set(uploadId, progress);
    return progress;
}

// Utility function to update upload progress
export function updateUploadProgress(uploadId: string, bytesUploaded: number, totalBytes?: number) {
    const current = uploadProgress.get(uploadId);
    if (!current) return;

    const progress = Math.min(100, Math.round((bytesUploaded / (totalBytes || current.totalBytes || bytesUploaded)) * 100));
    const elapsedTime = Date.now() - current.startTime;
    const estimatedTotalTime = elapsedTime / (progress / 100);
    const estimatedTime = Math.max(0, estimatedTotalTime - elapsedTime);

    const updatedProgress = {
        ...current,
        progress,
        status: 'uploading' as const,
        bytesUploaded,
        totalBytes: totalBytes || current.totalBytes,
        estimatedTime,
    };

    uploadProgress.set(uploadId, updatedProgress);
    return updatedProgress;
}

// Utility function to complete upload
export function completeUpload(uploadId: string, message?: string) {
    const current = uploadProgress.get(uploadId);
    if (!current) return;

    const completedProgress = {
        ...current,
        progress: 100,
        status: 'completed' as const,
        message: message || 'Upload completed successfully',
    };

    uploadProgress.set(uploadId, completedProgress);

    // Clean up after 5 minutes
    setTimeout(() => {
        uploadProgress.delete(uploadId);
    }, 5 * 60 * 1000);

    return completedProgress;
}

// Utility function to fail upload
export function failUpload(uploadId: string, errorMessage: string) {
    const current = uploadProgress.get(uploadId);
    if (!current) return;

    const failedProgress = {
        ...current,
        status: 'failed' as const,
        message: errorMessage,
    };

    uploadProgress.set(uploadId, failedProgress);

    // Clean up after 5 minutes
    setTimeout(() => {
        uploadProgress.delete(uploadId);
    }, 5 * 60 * 1000);

    return failedProgress;
}