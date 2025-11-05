import fs from "fs";
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Ensure temp directory exists
async function ensureTempDir() {
    const tempDir = join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });
}

export async function POST(request: NextRequest) {
    await ensureTempDir();

    try {
        const data = await request.formData();
        const file: File | null = data.get('audioFile') as unknown as File;

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

        // Create temporary file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const tempPath = join(process.cwd(), 'temp', `${uniqueId}-${file.name}`);

        await writeFile(tempPath, buffer);

        try {
            // Transcribe audio
            const transcription = await openai.audio.transcriptions.create({
                file: require('fs').createReadStream(tempPath),
                model: 'whisper-1',
                response_format: 'json',
                language: 'en',
                temperature: 0.0,
            });

            const transcriptionText = transcription.text;

            // Generate summary
            let summary = '';
            if (transcriptionText.trim()) {
                const summaryResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that creates concise, accurate summaries of transcribed audio content. Create a summary that is 2-4 sentences long and captures the key information.'
                        },
                        {
                            role: 'user',
                            content: `Please summarize this text:\n\n"${transcriptionText}"`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 300,
                });

                summary = summaryResponse.choices[0]?.message?.content || '';
            }

            // Clean up temporary file
            await unlink(tempPath);

            return NextResponse.json({
                success: true,
                data: {
                    transcription: transcriptionText,
                    summary: summary,
                }
            });

        } catch (openaiError) {
            // Clean up temporary file on error
            await unlink(tempPath).catch(() => { });
            throw openaiError;
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