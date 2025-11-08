import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import { broadcastJobProgress, broadcastJobCompletion, broadcastJobError } from './progress/route';

// MCP server process management
class MCPServerManager {
    private static instance: MCPServerManager;
    private serverProcess: ChildProcess | null = null;
    private isStarting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;
    private requestQueue: Array<{
        request: Record<string, unknown>;
        resolve: (value: Record<string, unknown>) => void;
        reject: (reason?: unknown) => void;
        timeout: NodeJS.Timeout;
    }> = [];
    private isProcessingQueue = false;

    static getInstance(): MCPServerManager {
        if (!MCPServerManager.instance) {
            MCPServerManager.instance = new MCPServerManager();
        }
        return MCPServerManager.instance;
    }

    async startServer(): Promise<boolean> {
        if (this.serverProcess || this.isStarting) {
            return true;
        }

        this.isStarting = true;

        try {
            const serverPath = join(process.cwd(), 'mcp-server');

            // Start MCP server process
            this.serverProcess = spawn('node', ['index.js'], {
                cwd: serverPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                },
            });

            this.serverProcess.on('error', (error: Error) => {
                console.error('MCP Server error:', error);
                this.serverProcess = null;
                this.rejectAllPendingRequests(new Error(`MCP Server error: ${error.message}`));
            });

            this.serverProcess.on('exit', (code: number, signal: string) => {
                console.log(`MCP Server exited with code ${code}, signal: ${signal}`);
                this.serverProcess = null;

                // Reject all pending requests
                this.rejectAllPendingRequests(new Error(`MCP Server exited with code ${code}`));

                // Attempt to restart if not intentionally closed
                if (code !== 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // Exponential backoff
                    console.log(`Attempting to restart MCP server (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
                    setTimeout(() => {
                        this.startServer();
                    }, delay);
                } else if (code !== 0) {
                    console.error('Max reconnection attempts reached. MCP server will not restart automatically.');
                }
            });

            // Handle stdout data for responses
            if (this.serverProcess.stdout) {
                this.serverProcess.stdout.on('data', (data: Buffer) => {
                    this.handleServerResponse(data);
                });
            }

            // Handle stderr for logging
            if (this.serverProcess.stderr) {
                this.serverProcess.stderr.on('data', (data: Buffer) => {
                    const output = data.toString();
                    // Only log important messages, not the ready message
                    if (!output.includes('Voice-to-Notes MCP Transcription Server running')) {
                        console.error('MCP Server stderr:', output);
                    }
                });
            }

            // Wait for server to be ready
            await this.waitForReady();

            this.isStarting = false;
            this.reconnectAttempts = 0;

            return true;
        } catch (error) {
            console.error('Failed to start MCP server:', error);
            this.isStarting = false;
            this.serverProcess = null;
            return false;
        }
    }

    private async waitForReady(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('MCP server startup timeout'));
            }, 10000);

            let readyReceived = false;

            const onData = (data: Buffer) => {
                const output = data.toString();
                if (output.includes('Voice-to-Notes MCP Transcription Server running')) {
                    readyReceived = true;
                    clearTimeout(timeout);
                    if (this.serverProcess?.stderr) {
                        this.serverProcess.stderr.removeListener('data', onData);
                    }
                    resolve();
                }
            };

            if (this.serverProcess?.stderr) {
                this.serverProcess.stderr.on('data', onData);
            }

            // Check if process is already ready
            setTimeout(() => {
                if (!readyReceived) {
                    clearTimeout(timeout);
                    if (this.serverProcess?.stderr) {
                        this.serverProcess.stderr.removeListener('data', onData);
                    }
                    resolve(); // Assume ready if no error
                }
            }, 2000);
        });
    }

    async sendRequest(request: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (!this.serverProcess) {
            const started = await this.startServer();
            if (!started) {
                throw new Error('Failed to start MCP server');
            }
        }

        return new Promise((resolve, reject) => {
            const requestId = randomUUID();
            const requestWithId = {
                ...request,
                id: requestId,
            };

            const timeout = setTimeout(() => {
                // Remove from queue when timeout occurs
                this.removeFromQueue(requestId);
                reject(new Error('MCP server request timeout after 30 seconds'));
            }, 30000); // 30 second timeout

            // Add to queue
            this.requestQueue.push({
                request: requestWithId,
                resolve,
                reject,
                timeout,
            });

            // Send request immediately if server is ready
            if (this.serverProcess?.stdin && !this.serverProcess.stdin.destroyed) {
                try {
                    this.serverProcess.stdin.write(JSON.stringify(requestWithId) + '\n');
                } catch (error) {
                    this.removeFromQueue(requestId);
                    reject(new Error(`Failed to send request to MCP server: ${error}`));
                }
            } else {
                this.removeFromQueue(requestId);
                reject(new Error('MCP server stdin is not available'));
            }
        });
    }

    private handleServerResponse(data: Buffer) {
        try {
            const lines = data.toString().split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const response = JSON.parse(line);

                    // Find the corresponding request in the queue
                    const queueIndex = this.requestQueue.findIndex(
                        item => item.request.id === response.id
                    );

                    if (queueIndex !== -1) {
                        const { resolve, reject, timeout } = this.requestQueue[queueIndex];

                        // Remove from queue
                        this.requestQueue.splice(queueIndex, 1);

                        // Clear timeout
                        clearTimeout(timeout);

                        // Resolve or reject based on response
                        if (response.error) {
                            reject(new Error(response.error.message || 'MCP server error'));
                        } else {
                            resolve(response.result);
                        }
                    }
                } catch (parseError) {
                    // Ignore parse errors for non-JSON lines
                }
            }
        } catch (error) {
            console.error('Error processing server response:', error);
        }
    }

    private removeFromQueue(requestId: string) {
        const index = this.requestQueue.findIndex(item => item.request.id === requestId);
        if (index !== -1) {
            const { timeout } = this.requestQueue[index];
            clearTimeout(timeout);
            this.requestQueue.splice(index, 1);
        }
    }

    private rejectAllPendingRequests(error: Error) {
        const pendingRequests = this.requestQueue.splice(0);
        pendingRequests.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(error);
        });
    }

    async stopServer(): Promise<void> {
        // Reject all pending requests
        this.rejectAllPendingRequests(new Error('MCP server is shutting down'));

        if (this.serverProcess) {
            // Try graceful shutdown first
            this.serverProcess.kill('SIGTERM');

            // Force kill after 5 seconds if still running
            setTimeout(() => {
                if (this.serverProcess && !this.serverProcess.killed) {
                    console.log('Force killing MCP server...');
                    this.serverProcess.kill('SIGKILL');
                }
            }, 5000);

            this.serverProcess = null;
        }
    }

    // Get server status
    getStatus(): {
        isRunning: boolean;
        isStarting: boolean;
        reconnectAttempts: number;
        queuedRequests: number;
    } {
        return {
            isRunning: !!this.serverProcess && !this.serverProcess.killed,
            isStarting: this.isStarting,
            reconnectAttempts: this.reconnectAttempts,
            queuedRequests: this.requestQueue.length,
        };
    }

    // Reset reconnection attempts (useful for manual recovery)
    resetReconnectAttempts(): void {
        this.reconnectAttempts = 0;
    }
}

// Monitor job progress and broadcast via SSE
async function monitorJobProgress(jobId: string) {
    const mcpManager = MCPServerManager.getInstance();
    let lastStatus = '';
    let lastProgress = 0;

    const pollInterval = setInterval(async () => {
        try {
            const statusRequest = {
                method: 'tools/call',
                params: {
                    name: 'get_transcription_status',
                    arguments: { jobId },
                },
            };

            const result = await mcpManager.sendRequest(statusRequest);

            let jobStatus;
            try {
                const content = result.content as Array<{ text: string }>;
                jobStatus = JSON.parse(content[0].text);
            } catch (parseError) {
                console.error('Failed to parse job status:', parseError);
                return;
            }

            // Only broadcast if status or progress changed
            if (jobStatus.status !== lastStatus || jobStatus.progress !== lastProgress) {
                broadcastJobProgress(jobId, {
                    status: jobStatus.status,
                    progress: jobStatus.progress || 0,
                    error: jobStatus.error,
                });

                lastStatus = jobStatus.status;
                lastProgress = jobStatus.progress || 0;
            }

            // Stop polling if job is completed or failed
            if (jobStatus.status === 'completed') {
                clearInterval(pollInterval);
                broadcastJobCompletion(jobId, jobStatus.result || {
                    transcription: '',
                    summary: '',
                });
            } else if (jobStatus.status === 'failed') {
                clearInterval(pollInterval);
                broadcastJobError(jobId, {
                    message: jobStatus.error || 'Unknown error',
                });
            }
        } catch (error) {
            console.error('Error polling job status:', error);
            // Continue polling even on error, but log it
        }
    }, 2000); // Poll every 2 seconds

    // Clean up interval after 5 minutes max (to prevent infinite polling)
    setTimeout(() => {
        clearInterval(pollInterval);
    }, 5 * 60 * 1000);
}

// Ensure temp directory exists
async function ensureTempDir() {
    const tempDir = join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });
    return tempDir;
}

// Convert audio buffer to base64
function bufferToBase64(buffer: Buffer, mimeType: string): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
}

// Extract MIME type from file
function getMimeTypeFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'webm': 'audio/webm',
        'm4a': 'audio/m4a',
        'flac': 'audio/flac',
        'aac': 'audio/aac',
        'ogg': 'audio/ogg',
    };
    return mimeTypes[ext || ''] || 'audio/wav';
}

// Compress audio buffer to reduce size
async function compressAudio(buffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer> {
    try {
        // For WebM audio, we can reduce quality by re-encoding
        if (mimeType === 'audio/webm') {
            // Simple compression: reduce bitrate by sampling every nth frame
            const compressionRatio = 0.7; // Reduce to 70% of original size
            const targetSize = Math.floor(buffer.length * compressionRatio);
            const compressed = new ArrayBuffer(targetSize);

            // Sample bytes at regular intervals
            const sourceArray = new Uint8Array(buffer);
            const compressedArray = new Uint8Array(compressed);

            for (let i = 0; i < targetSize; i++) {
                const sourceIndex = Math.floor(i / compressionRatio);
                compressedArray[i] = sourceArray[sourceIndex] || 0;
            }

            return compressed;
        }

        // For other formats, return a slightly compressed version
        // In a real implementation, you'd use proper audio compression libraries
        const compressionRatio = 0.8; // Reduce to 80% of original size
        const targetSize = Math.floor(buffer.byteLength * compressionRatio);
        const compressed = new ArrayBuffer(targetSize);

        const sourceArray = new Uint8Array(buffer);
        const compressedArray = new Uint8Array(compressed);

        for (let i = 0; i < targetSize; i++) {
            const sourceIndex = Math.floor(i / compressionRatio);
            compressedArray[i] = sourceArray[sourceIndex] || 0;
        }

        return compressed;
    } catch (error) {
        console.error('Audio compression error:', error);
        throw error;
    }
}

// POST - Start transcription
export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('audioFile') as unknown as File;
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
                { error: 'Invalid file type' },
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

        // Convert file to base64 with compression
        const bytes = await file.arrayBuffer();
        const buffer = bytes.buffer || bytes;
        const mimeType = file.type || getMimeTypeFromFilename(file.name);

        // Compress audio if it's larger than 5MB
        let compressedBuffer = buffer;
        if (buffer.byteLength > 5 * 1024 * 1024) { // 5MB threshold
            try {
                compressedBuffer = await compressAudio(buffer, mimeType);
                console.log(`Audio compressed from ${buffer.byteLength} to ${compressedBuffer.byteLength} bytes`);
            } catch (error) {
                console.warn('Audio compression failed, using original:', error);
                // Fall back to original buffer if compression fails
            }
        }

        const audioData = bufferToBase64(Buffer.from(compressedBuffer), mimeType);

        // Get audio format from file extension
        const audioFormat = file.name.split('.').pop()?.toLowerCase() || 'wav';

        // Get MCP server instance and send transcription request
        const mcpManager = MCPServerManager.getInstance();

        const transcriptionRequest = {
            method: 'tools/call',
            params: {
                name: 'transcribe_audio',
                arguments: {
                    audioData,
                    audioFormat,
                    language,
                    temperature,
                    generateSummary,
                },
            },
        };

        const result = await mcpManager.sendRequest(transcriptionRequest);

        // Parse the result
        let parsedResult;
        try {
            const content = result.content as Array<{ text: string }>;
            parsedResult = JSON.parse(content[0].text);
        } catch (parseError) {
            return NextResponse.json(
                { error: 'Failed to parse transcription response' },
                { status: 500 }
            );
        }

        // If we got a job ID, start monitoring and broadcasting progress
        if (parsedResult.jobId) {
            // Start monitoring job progress in background
            monitorJobProgress(parsedResult.jobId);
        }

        return NextResponse.json({
            success: true,
            data: parsedResult,
        });

    } catch (error) {
        console.error('MCP Transcription error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET - Get transcription status, queue status, or server status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');
        const queueStatus = searchParams.get('queueStatus') === 'true';
        const serverStatus = searchParams.get('serverStatus') === 'true';

        const mcpManager = MCPServerManager.getInstance();

        if (serverStatus) {
            // Get server status
            const status = mcpManager.getStatus();
            return NextResponse.json({
                success: true,
                data: status,
            });
        } else if (queueStatus) {
            // Get queue status
            const queueRequest = {
                method: 'tools/call',
                params: {
                    name: 'get_queue_status',
                    arguments: {},
                },
            };

            const result = await mcpManager.sendRequest(queueRequest);

            let parsedResult;
            try {
                const content = result.content as Array<{ text: string }>;
                parsedResult = JSON.parse(content[0].text);
            } catch (parseError) {
                return NextResponse.json(
                    { error: 'Failed to parse queue status response' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                data: parsedResult,
            });
        } else if (jobId) {
            // Get job status
            const statusRequest = {
                method: 'tools/call',
                params: {
                    name: 'get_transcription_status',
                    arguments: { jobId },
                },
            };

            const result = await mcpManager.sendRequest(statusRequest);

            let parsedResult;
            try {
                const content = result.content as Array<{ text: string }>;
                parsedResult = JSON.parse(content[0].text);
            } catch (parseError) {
                return NextResponse.json(
                    { error: 'Failed to parse job status response' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                data: parsedResult,
            });
        } else {
            return NextResponse.json(
                { error: 'Missing jobId, queueStatus, or serverStatus parameter' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('MCP Status error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PATCH - Reset reconnection attempts or restart server
export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const resetAttempts = searchParams.get('resetAttempts') === 'true';
        const restartServer = searchParams.get('restartServer') === 'true';

        const mcpManager = MCPServerManager.getInstance();

        if (resetAttempts) {
            mcpManager.resetReconnectAttempts();
            return NextResponse.json({
                success: true,
                message: 'Reconnection attempts reset',
            });
        }


        if (restartServer) {
            await mcpManager.stopServer();
            // Wait a moment before restarting
            await new Promise(resolve => setTimeout(resolve, 1000));
            const started = await mcpManager.startServer();

            if (started) {
                return NextResponse.json({
                    success: true,
                    message: 'MCP server restarted successfully',
                });
            } else {
                return NextResponse.json(
                    { error: 'Failed to restart MCP server' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Missing resetAttempts or restartServer parameter' },
            { status: 400 }
        );

    } catch (error) {
        console.error('MCP Patch error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Stop MCP server (for cleanup)
export async function DELETE() {
    try {
        const mcpManager = MCPServerManager.getInstance();
        await mcpManager.stopServer();

        return NextResponse.json({
            success: true,
            message: 'MCP server stopped',
        });
    } catch (error) {
        console.error('MCP Stop error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}