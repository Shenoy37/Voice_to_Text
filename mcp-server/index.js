#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { WebSocketServer } from 'ws';
import { createReadStream } from 'fs';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Transcription queue management
class TranscriptionQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 3;
        this.activeJobs = new Map();
    }

    async add(job) {
        const jobId = uuidv4();
        const jobWithId = { ...job, id: jobId, status: 'queued', createdAt: new Date() };
        this.queue.push(jobWithId);

        // Start processing if not already running
        if (!this.processing) {
            this.process();
        }

        return jobId;
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0 && this.activeJobs.size < this.maxConcurrent) {
            const job = this.queue.shift();
            this.activeJobs.set(job.id, job);

            // Process job in background
            this.processJob(job).finally(() => {
                this.activeJobs.delete(job.id);
            });
        }

        this.processing = false;
    }

    async processJob(job) {
        try {
            job.status = 'processing';
            job.startedAt = new Date();

            // Update job status via callback if provided
            if (job.onProgress) {
                job.onProgress({ jobId: job.id, status: 'processing', progress: 0 });
            }

            // Transcribe audio
            const transcription = await this.transcribeAudio(job.audioPath, {
                language: job.language || 'en',
                temperature: job.temperature || 0.0,
                onProgress: (progress) => {
                    if (job.onProgress) {
                        job.onProgress({
                            jobId: job.id,
                            status: 'processing',
                            progress: Math.round(progress * 100)
                        });
                    }
                }
            });

            // Generate summary if requested
            let summary = '';
            if (job.generateSummary && transcription.text) {
                if (job.onProgress) {
                    job.onProgress({ jobId: job.id, status: 'summarizing', progress: 0 });
                }

                summary = await this.generateSummary(transcription.text, {
                    onProgress: (progress) => {
                        if (job.onProgress) {
                            job.onProgress({
                                jobId: job.id,
                                status: 'summarizing',
                                progress: Math.round(progress * 100)
                            });
                        }
                    }
                });
            }

            job.status = 'completed';
            job.completedAt = new Date();
            job.result = {
                transcription: transcription.text,
                summary: summary,
                duration: transcription.duration,
                language: transcription.language
            };

            // Clean up temporary file
            if (job.audioPath && job.cleanup !== false) {
                await unlink(job.audioPath).catch(() => { });
            }

            if (job.onProgress) {
                job.onProgress({
                    jobId: job.id,
                    status: 'completed',
                    progress: 100,
                    result: job.result
                });
            }

            if (job.onComplete) {
                job.onComplete(job.result);
            }

        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.failedAt = new Date();

            // Clean up temporary file on error
            if (job.audioPath && job.cleanup !== false) {
                await unlink(job.audioPath).catch(() => { });
            }

            if (job.onProgress) {
                job.onProgress({
                    jobId: job.id,
                    status: 'failed',
                    error: error.message
                });
            }

            if (job.onError) {
                job.onError(error);
            }
        }
    }

    async transcribeAudio(audioPath, options = {}) {
        const { language = 'en', temperature = 0.0, onProgress } = options;

        try {
            const transcription = await openai.audio.transcriptions.create({
                file: createReadStream(audioPath),
                model: 'whisper-1',
                response_format: 'json',
                language: language,
                temperature: temperature,
            });

            if (onProgress) {
                onProgress(1.0);
            }

            return {
                text: transcription.text,
                duration: transcription.duration,
                language: language
            };
        } catch (error) {
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    async generateSummary(text, options = {}) {
        const { onProgress } = options;

        try {
            if (onProgress) {
                onProgress(0.5);
            }

            const summaryResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that creates concise, accurate summaries of transcribed audio content. Create a summary that is 2-4 sentences long and captures the key information.'
                    },
                    {
                        role: 'user',
                        content: `Please summarize this text:\n\n"${text}"`
                    }
                ],
                temperature: 0.3,
                max_tokens: 300,
            });

            if (onProgress) {
                onProgress(1.0);
            }

            return summaryResponse.choices[0]?.message?.content || '';
        } catch (error) {
            throw new Error(`Summary generation failed: ${error.message}`);
        }
    }

    getJobStatus(jobId) {
        const job = this.activeJobs.get(jobId) || this.queue.find(j => j.id === jobId);
        if (!job) return null;

        return {
            id: job.id,
            status: job.status,
            progress: job.progress || 0,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            failedAt: job.failedAt,
            error: job.error,
            result: job.result
        };
    }

    getQueueStatus() {
        return {
            queued: this.queue.length,
            processing: this.activeJobs.size,
            maxConcurrent: this.maxConcurrent
        };
    }
}

// Initialize transcription queue
const transcriptionQueue = new TranscriptionQueue();

// Ensure temp directory exists
async function ensureTempDir() {
    const tempDir = join(__dirname, 'temp');
    await mkdir(tempDir, { recursive: true });
    return tempDir;
}

// Create MCP server
const server = new Server(
    {
        name: 'voice-to-notes-transcription',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'transcribe_audio',
                description: 'Transcribe audio file using OpenAI Whisper',
                inputSchema: {
                    type: 'object',
                    properties: {
                        audioData: {
                            type: 'string',
                            description: 'Base64 encoded audio data or file path',
                        },
                        audioFormat: {
                            type: 'string',
                            description: 'Audio format (wav, mp3, webm, etc.)',
                            enum: ['wav', 'mp3', 'webm', 'm4a', 'flac', 'aac', 'ogg'],
                        },
                        language: {
                            type: 'string',
                            description: 'Language code (default: en)',
                            default: 'en',
                        },
                        temperature: {
                            type: 'number',
                            description: 'Temperature for transcription (0.0-1.0)',
                            minimum: 0.0,
                            maximum: 1.0,
                            default: 0.0,
                        },
                        generateSummary: {
                            type: 'boolean',
                            description: 'Whether to generate AI summary',
                            default: false,
                        },
                    },
                    required: ['audioData', 'audioFormat'],
                },
            },
            {
                name: 'get_transcription_status',
                description: 'Get status of a transcription job',
                inputSchema: {
                    type: 'object',
                    properties: {
                        jobId: {
                            type: 'string',
                            description: 'Job ID returned from transcribe_audio',
                        },
                    },
                    required: ['jobId'],
                },
            },
            {
                name: 'get_queue_status',
                description: 'Get current queue status',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'start_realtime_transcription',
                description: 'Start real-time transcription session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        language: {
                            type: 'string',
                            description: 'Language code (default: en)',
                            default: 'en',
                        },
                        enableInterimResults: {
                            type: 'boolean',
                            description: 'Enable interim transcription results',
                            default: true,
                        },
                    },
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'transcribe_audio': {
                const { audioData, audioFormat, language, temperature, generateSummary } = args;

                // Create temporary file
                const tempDir = await ensureTempDir();
                const filename = `${uuidv4()}.${audioFormat}`;
                const audioPath = join(tempDir, filename);

                // Decode and save audio data
                let audioBuffer;
                if (audioData.startsWith('data:')) {
                    // Base64 data URL
                    const base64Data = audioData.split(',')[1];
                    audioBuffer = Buffer.from(base64Data, 'base64');
                } else if (audioData.startsWith('/')) {
                    // File path - just use it directly
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'File paths not supported directly. Please provide base64 encoded audio data.',
                                }),
                            },
                        ],
                    };
                } else {
                    // Raw base64
                    audioBuffer = Buffer.from(audioData, 'base64');
                }

                await writeFile(audioPath, audioBuffer);

                // Add to transcription queue
                const jobId = await transcriptionQueue.add({
                    audioPath,
                    language,
                    temperature,
                    generateSummary,
                    cleanup: true,
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                jobId,
                                message: 'Audio transcription queued successfully',
                                queueStatus: transcriptionQueue.getQueueStatus(),
                            }),
                        },
                    ],
                };
            }

            case 'get_transcription_status': {
                const { jobId } = args;
                const status = transcriptionQueue.getJobStatus(jobId);

                if (!status) {
                    throw new McpError(
                        ErrorCode.NotFound,
                        `Job with ID ${jobId} not found`
                    );
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(status),
                        },
                    ],
                };
            }

            case 'get_queue_status': {
                const status = transcriptionQueue.getQueueStatus();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(status),
                        },
                    ],
                };
            }

            case 'start_realtime_transcription': {
                const { language, enableInterimResults } = args;

                // Create WebSocket server for real-time transcription
                const wsPort = 3010 + Math.floor(Math.random() * 100); // Random port
                const wss = new WebSocketServer({ port: wsPort });

                wss.on('connection', (ws) => {
                    console.log('New WebSocket connection for real-time transcription');

                    ws.on('message', async (data) => {
                        try {
                            const message = JSON.parse(data.toString());

                            if (message.type === 'audio_chunk') {
                                // Process audio chunk for real-time transcription
                                // This would implement streaming transcription
                                ws.send(JSON.stringify({
                                    type: 'status',
                                    message: 'Audio chunk received'
                                }));
                            }
                        } catch (error) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: error.message
                            }));
                        }
                    });

                    ws.on('close', () => {
                        console.log('WebSocket connection closed');
                    });
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                websocketPort: wsPort,
                                language,
                                enableInterimResults,
                                message: 'Real-time transcription server started',
                            }),
                        },
                    ],
                };
            }

            default:
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${name}`
                );
        }
    } catch (error) {
        throw new McpError(
            ErrorCode.InternalError,
            `Tool execution failed: ${error.message}`
        );
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Voice-to-Notes MCP Transcription Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});