'use client';

import { useState } from 'react';
import LiveTranscription from '@/components/LiveTranscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function LiveTranscriptionPage() {
    const [transcriptionResult, setTranscriptionResult] = useState<{
        transcription: string;
        summary: string;
        audioUrl: string;
    } | null>(null);

    const handleTranscriptionComplete = (transcription: string, summary: string, audioUrl: string) => {
        setTranscriptionResult({
            transcription,
            summary,
            audioUrl,
        });
    };

    const handleTranscriptionProgress = (progress: number, status: string) => {
        console.log('Transcription progress:', progress, status);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Live Transcription Demo</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Experience real-time audio transcription with live progress updates and visual feedback.
                        Record your voice and watch as it&apos;s transcribed instantly with our advanced AI-powered system.
                    </p>
                    <div className="flex justify-center gap-2">
                        <Badge variant="secondary">Real-time</Badge>
                        <Badge variant="secondary">Multi-language</Badge>
                        <Badge variant="secondary">AI-powered</Badge>
                    </div>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="transcription" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="transcription">Live Transcription</TabsTrigger>
                        <TabsTrigger value="results">Results</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transcription" className="space-y-6">
                        <LiveTranscription
                            onTranscriptionComplete={handleTranscriptionComplete}
                            onTranscriptionProgress={handleTranscriptionProgress}
                            defaultLanguage="en"
                        />
                    </TabsContent>

                    <TabsContent value="results" className="space-y-6">
                        {transcriptionResult ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Transcription Result */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Transcription</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {transcriptionResult.transcription}
                                                </p>
                                            </div>
                                            {transcriptionResult.audioUrl && (
                                                <audio
                                                    controls
                                                    src={transcriptionResult.audioUrl}
                                                    className="w-full"
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary Result */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>AI Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {transcriptionResult.summary || 'No summary generated'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <svg
                                                className="w-8 h-8 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium">No transcription results yet</h3>
                                        <p className="text-muted-foreground max-w-md">
                                            Start a recording in the Live Transcription tab to see the results here.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Features Section */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                        />
                                    </svg>
                                </div>
                                Real-time Recording
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                High-quality audio recording with real-time level monitoring and visual feedback.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                Live Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Watch transcription progress in real-time with Server-Sent Events (SSE).
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                AI Processing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Advanced AI-powered transcription with automatic summarization capabilities.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}