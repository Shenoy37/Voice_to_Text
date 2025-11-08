import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, QueryOptimizer } from '@/db';
import { notes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Queue item interface
interface QueueItem {
    id: string;
    type: 'transcription' | 'summarization' | 'processing';
    status: 'queued' | 'processing' | 'completed' | 'failed';
    priority: number;
    userId: string;
    data: Record<string, unknown>;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    progress?: number;
}

// In-memory queue storage (in production, use Redis or database)
const audioQueue: QueueItem[] = [];
const maxQueueSize = 100;
const maxConcurrentJobs = 3;
const activeJobs = new Map<string, QueueItem>();

// Queue statistics
interface QueueStats {
    totalItems: number;
    queuedItems: number;
    processingItems: number;
    completedItems: number;
    failedItems: number;
    activeJobs: number;
    averageWaitTime: number;
    averageProcessingTime: number;
}

// Validation schemas
const addToQueueSchema = z.object({
    type: z.enum(['transcription', 'summarization', 'processing']),
    priority: z.number().int().min(1).max(10).default(5),
    data: z.record(z.string(), z.unknown()),
});

const queueQuerySchema = z.object({
    status: z.enum(['queued', 'processing', 'completed', 'failed']).optional(),
    type: z.enum(['transcription', 'summarization', 'processing']).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
    userId: z.string().optional(),
});

// GET - Get queue status or items
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'stats') {
            const stats = getQueueStats();
            const userStats = getUserQueueStats(session.user.id);

            return NextResponse.json({
                success: true,
                data: {
                    global: stats,
                    user: userStats,
                },
            });
        }

        if (action === 'items') {
            const validatedParams = queueQuerySchema.safeParse(Object.fromEntries(searchParams));

            if (!validatedParams.success) {
                return NextResponse.json(
                    {
                        error: 'Invalid query parameters',
                        details: validatedParams.error.issues
                    },
                    { status: 400 }
                );
            }

            const { status, type, limit = 50, userId } = validatedParams.data;

            // Filter queue items
            const filteredItems = audioQueue.filter(item => {
                if (userId && item.userId !== userId) return false;
                if (status && item.status !== status) return false;
                if (type && item.type !== type) return false;
                return true;
            });

            // Sort by priority and creation time
            filteredItems.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority; // Higher priority first
                }
                return a.createdAt.getTime() - b.createdAt.getTime(); // Earlier items first
            });

            // Limit results
            const limitedItems = filteredItems.slice(0, limit);

            return NextResponse.json({
                success: true,
                data: {
                    items: limitedItems,
                    total: filteredItems.length,
                    limit,
                },
            });
        }

        // Get user's queue items by default
        const userItems = audioQueue.filter(item => item.userId === session.user.id);
        const userStats = getUserQueueStats(session.user.id);

        return NextResponse.json({
            success: true,
            data: {
                items: userItems,
                stats: userStats,
            },
        });

    } catch (error) {
        console.error('Queue GET error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST - Add item to queue
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = addToQueueSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    details: validatedData.error.issues
                },
                { status: 400 }
            );
        }

        // Check queue size limit
        if (audioQueue.length >= maxQueueSize) {
            return NextResponse.json(
                { error: 'Queue is full. Please try again later.' },
                { status: 429 }
            );
        }

        // Create queue item
        const queueItem: QueueItem = {
            id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: validatedData.data.type,
            status: 'queued',
            priority: validatedData.data.priority,
            userId: session.user.id,
            data: validatedData.data.data,
            createdAt: new Date(),
            progress: 0,
        };

        // Add to queue
        audioQueue.push(queueItem);

        // Sort queue by priority
        audioQueue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        // Start processing if capacity allows
        processQueue();

        return NextResponse.json({
            success: true,
            data: {
                queueItem,
                position: audioQueue.findIndex(item => item.id === queueItem.id) + 1,
                estimatedWaitTime: calculateEstimatedWaitTime(queueItem.id),
            },
        }, { status: 201 });

    } catch (error) {
        console.error('Queue POST error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PATCH - Update queue item status
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('id');

        if (!itemId) {
            return NextResponse.json(
                { error: 'Queue item ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, progress, error } = body;

        // Find queue item
        const itemIndex = audioQueue.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return NextResponse.json(
                { error: 'Queue item not found' },
                { status: 404 }
            );
        }

        const item = audioQueue[itemIndex];

        // Check if user owns this item or is admin
        if (item.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update item
        if (status) item.status = status;
        if (progress !== undefined) item.progress = Math.max(0, Math.min(100, progress));
        if (error) item.error = error;

        if (status === 'processing' && !item.startedAt) {
            item.startedAt = new Date();
            activeJobs.set(itemId, item);
        } else if ((status === 'completed' || status === 'failed') && !item.completedAt) {
            item.completedAt = new Date();
            activeJobs.delete(itemId);
        }

        return NextResponse.json({
            success: true,
            data: item,
        });

    } catch (error) {
        console.error('Queue PATCH error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Remove item from queue
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('id');

        if (!itemId) {
            return NextResponse.json(
                { error: 'Queue item ID is required' },
                { status: 400 }
            );
        }

        // Find and remove queue item
        const itemIndex = audioQueue.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return NextResponse.json(
                { error: 'Queue item not found' },
                { status: 404 }
            );
        }

        const item = audioQueue[itemIndex];

        // Check if user owns this item
        if (item.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Can only remove queued items (not processing)
        if (item.status === 'processing') {
            return NextResponse.json(
                { error: 'Cannot remove item that is currently processing' },
                { status: 409 }
            );
        }

        // Remove from queue
        audioQueue.splice(itemIndex, 1);
        activeJobs.delete(itemId);

        return NextResponse.json({
            success: true,
            message: 'Queue item removed successfully',
        });

    } catch (error) {
        console.error('Queue DELETE error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Process queue items
function processQueue() {
    if (activeJobs.size >= maxConcurrentJobs) {
        return; // Max concurrent jobs reached
    }

    // Find next queued item
    const nextItem = audioQueue.find(item => item.status === 'queued');
    if (!nextItem) {
        return; // No queued items
    }

    // Update status to processing
    nextItem.status = 'processing';
    nextItem.startedAt = new Date();
    activeJobs.set(nextItem.id, nextItem);

    // Process item based on type
    processQueueItem(nextItem);
}

// Process individual queue item
async function processQueueItem(item: QueueItem) {
    try {
        switch (item.type) {
            case 'transcription':
                await processTranscriptionItem(item);
                break;
            case 'summarization':
                await processSummarizationItem(item);
                break;
            case 'processing':
                await processAudioProcessingItem(item);
                break;
            default:
                throw new Error(`Unknown queue item type: ${item.type}`);
        }

        // Mark as completed
        item.status = 'completed';
        item.completedAt = new Date();
        item.progress = 100;

    } catch (error) {
        // Mark as failed
        item.status = 'failed';
        item.completedAt = new Date();
        item.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
        // Remove from active jobs
        activeJobs.delete(item.id);

        // Continue processing queue
        setTimeout(processQueue, 1000);
    }
}

// Process transcription item
async function processTranscriptionItem(item: QueueItem) {
    // This would integrate with the MCP transcription service
    console.log(`Processing transcription item: ${item.id}`);

    // Simulate processing time
    for (let i = 0; i <= 100; i += 10) {
        item.progress = i;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Process summarization item
async function processSummarizationItem(item: QueueItem) {
    // This would integrate with AI summarization service
    console.log(`Processing summarization item: ${item.id}`);

    // Simulate processing time
    for (let i = 0; i <= 100; i += 20) {
        item.progress = i;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// Process audio processing item
async function processAudioProcessingItem(item: QueueItem) {
    // This would integrate with audio processing service
    console.log(`Processing audio item: ${item.id}`);

    // Simulate processing time
    for (let i = 0; i <= 100; i += 15) {
        item.progress = i;
        await new Promise(resolve => setTimeout(resolve, 400));
    }
}

// Get queue statistics
function getQueueStats(): QueueStats {
    const totalItems = audioQueue.length;
    const queuedItems = audioQueue.filter(item => item.status === 'queued').length;
    const processingItems = audioQueue.filter(item => item.status === 'processing').length;
    const completedItems = audioQueue.filter(item => item.status === 'completed').length;
    const failedItems = audioQueue.filter(item => item.status === 'failed').length;

    // Calculate average wait time
    const completedItemsWithTimes = audioQueue.filter(item =>
        item.status === 'completed' && item.startedAt && item.createdAt
    );
    const averageWaitTime = completedItemsWithTimes.length > 0
        ? completedItemsWithTimes.reduce((sum, item) =>
            sum + (item.startedAt!.getTime() - item.createdAt.getTime()), 0
        ) / completedItemsWithTimes.length
        : 0;

    // Calculate average processing time
    const completedItemsWithProcessingTimes = audioQueue.filter(item =>
        item.status === 'completed' && item.completedAt && item.startedAt
    );
    const averageProcessingTime = completedItemsWithProcessingTimes.length > 0
        ? completedItemsWithProcessingTimes.reduce((sum, item) =>
            sum + (item.completedAt!.getTime() - item.startedAt!.getTime()), 0
        ) / completedItemsWithProcessingTimes.length
        : 0;

    return {
        totalItems,
        queuedItems,
        processingItems,
        completedItems,
        failedItems,
        activeJobs: activeJobs.size,
        averageWaitTime,
        averageProcessingTime,
    };
}

// Get user-specific queue statistics
function getUserQueueStats(userId: string) {
    const userItems = audioQueue.filter(item => item.userId === userId);

    return {
        totalItems: userItems.length,
        queuedItems: userItems.filter(item => item.status === 'queued').length,
        processingItems: userItems.filter(item => item.status === 'processing').length,
        completedItems: userItems.filter(item => item.status === 'completed').length,
        failedItems: userItems.filter(item => item.status === 'failed').length,
    };
}

// Calculate estimated wait time for a queue item
function calculateEstimatedWaitTime(itemId: string): number {
    const itemIndex = audioQueue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return 0;

    const itemsAhead = audioQueue.slice(0, itemIndex).filter(item =>
        item.status === 'queued' || item.status === 'processing'
    );

    // Estimate 30 seconds per processing item
    return itemsAhead.length * 30000; // 30 seconds in milliseconds
}

// Export utilities for external use
export type { QueueItem };
export {
    getQueueStats,
    getUserQueueStats,
    processQueue,
    calculateEstimatedWaitTime,
};