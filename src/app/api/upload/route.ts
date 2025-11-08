import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Ensure upload directory exists
async function ensureUploadDir() {
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    return uploadDir;
}

// Generate unique filename
function generateFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || '';
    return `${randomUUID()}.${ext}`;
}

// Validate file type
function validateFileType(fileType: string, fileName: string): boolean {
    const allowedTypes = [
        'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a',
        'audio/wav', 'audio/webm', 'audio/flac', 'audio/aac', 'audio/ogg',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/markdown', 'application/pdf'
    ];

    // Check MIME type
    if (allowedTypes.includes(fileType)) {
        return true;
    }

    // Fallback to extension check for browsers that don't provide proper MIME types
    const ext = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
        'mp3', 'mpeg', 'mp4', 'm4a', 'wav', 'webm', 'flac', 'aac', 'ogg',
        'jpg', 'jpeg', 'png', 'gif', 'webp',
        'txt', 'md', 'pdf'
    ];

    return allowedExtensions.includes(ext || '');
}

// Get file category from MIME type
function getFileCategory(fileType: string): string {
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('text/') || fileType === 'application/pdf') return 'document';
    return 'other';
}

// POST - Upload file
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const category = (data.get('category') as string) || 'auto';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!validateFileType(file.type, file.name)) {
            return NextResponse.json(
                {
                    error: 'Invalid file type',
                    message: 'Supported formats: Audio (MP3, WAV, WebM, M4A, FLAC, AAC, OGG), Images (JPEG, PNG, GIF, WebP), Documents (TXT, MD, PDF)'
                },
                { status: 400 }
            );
        }

        // Validate file size (max 50MB for general uploads)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 50MB.' },
                { status: 400 }
            );
        }

        // Ensure upload directory exists
        const uploadDir = await ensureUploadDir();

        // Generate unique filename
        const filename = generateFilename(file.name);
        const filePath = join(uploadDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Determine file category
        const fileCategory = category === 'auto' ? getFileCategory(file.type) : category;

        // Return file information
        return NextResponse.json({
            success: true,
            data: {
                filename,
                originalName: file.name,
                size: file.size,
                type: file.type,
                category: fileCategory,
                url: `/uploads/${filename}`,
                uploadedAt: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('File upload error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET - Get upload status or file information
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (filename) {
            // Check if file exists and return info
            const uploadDir = join(process.cwd(), 'uploads');
            const filePath = join(uploadDir, filename);

            try {
                const fs = await import('fs/promises');
                const stats = await fs.stat(filePath);

                return NextResponse.json({
                    success: true,
                    data: {
                        filename,
                        size: stats.size,
                        createdAt: stats.birthtime.toISOString(),
                        modifiedAt: stats.mtime.toISOString(),
                        url: `/uploads/${filename}`,
                    },
                });
            } catch (fileError) {
                return NextResponse.json(
                    { error: 'File not found' },
                    { status: 404 }
                );
            }
        }

        // Return upload configuration
        return NextResponse.json({
            success: true,
            data: {
                maxFileSize: 50 * 1024 * 1024, // 50MB
                allowedTypes: [
                    'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a',
                    'audio/wav', 'audio/webm', 'audio/flac', 'audio/aac', 'audio/ogg',
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'text/plain', 'text/markdown', 'application/pdf'
                ],
                categories: ['audio', 'image', 'document', 'other'],
            },
        });

    } catch (error) {
        console.error('Upload status error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete uploaded file
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json(
                { error: 'Missing filename parameter' },
                { status: 400 }
            );
        }

        const uploadDir = join(process.cwd(), 'uploads');
        const filePath = join(uploadDir, filename);

        try {
            const fs = await import('fs/promises');
            await fs.unlink(filePath);

            return NextResponse.json({
                success: true,
                message: 'File deleted successfully',
            });
        } catch (fileError) {
            return NextResponse.json(
                { error: 'File not found or could not be deleted' },
                { status: 404 }
            );
        }

    } catch (error) {
        console.error('File deletion error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}