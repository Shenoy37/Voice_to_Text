'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceRecorderMCPProps {
    onTranscriptionComplete: (transcription: string, summary: string, audioUrl: string) => void;
    onTranscriptionProgress?: (progress: number, status: string) => void;
    defaultLanguage?: string;
}

// Supported languages for transcription
const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
];

interface TranscriptionJob {
    jobId: string;
    status: 'queued' | 'processing' | 'summarizing' | 'completed' | 'failed';
    progress: number;
    result?: {
        transcription: string;
        summary: string;
        duration?: number;
        language?: string;
    };
    error?: string;
}

export default function VoiceRecorderMCP({
    onTranscriptionComplete,
    onTranscriptionProgress,
    defaultLanguage = 'en'
}: VoiceRecorderMCPProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [currentJob, setCurrentJob] = useState<TranscriptionJob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize audio context for level monitoring
    const initializeAudioContext = useCallback(async (stream: MediaStream) => {
        try {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
            microphoneRef.current.connect(analyserRef.current);

            // Start monitoring audio levels
            monitorAudioLevels();
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }, []);

    // Monitor audio levels for visualization
    const monitorAudioLevels = useCallback(() => {
        if (!analyserRef.current || !isRecording) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 128) * 100));

        animationFrameRef.current = requestAnimationFrame(monitorAudioLevels);
    }, [isRecording]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            });

            await initializeAudioContext(stream);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                // Stop audio monitoring
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }

                // Send to MCP service for transcription
                await transcribeWithMCP(audioBlob, url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);

            // Start recording timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error accessing microphone. Please check permissions.');
        }
    }, [initializeAudioContext]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }

            setIsProcessing(true);
        }
    }, [isRecording]);

    // Pause/resume recording
    const togglePause = useCallback(() => {
        if (mediaRecorderRef.current) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                recordingIntervalRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);
            } else {
                mediaRecorderRef.current.pause();
                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                }
            }
            setIsPaused(!isPaused);
        }
    }, [isPaused]);

    // Transcribe using MCP service
    const transcribeWithMCP = async (audioBlob: Blob, url: string) => {
        try {
            // Create form data for MCP API
            const formData = new FormData();
            formData.append('audioFile', audioBlob, 'recording.webm');
            formData.append('language', selectedLanguage);
            formData.append('temperature', '0.0');
            formData.append('generateSummary', 'true');

            const response = await fetch('/api/mcp-transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('MCP transcription failed');
            }

            const data = await response.json();

            if (data.success && data.data.jobId) {
                // Start polling for job status
                pollJobStatus(data.data.jobId, url);
            } else {
                throw new Error('No job ID returned from MCP service');
            }

        } catch (error) {
            console.error('MCP Transcription error:', error);
            setIsProcessing(false);
            alert('Error transcribing audio. Please try again.');
        }
    };

    // Poll job status with SSE fallback
    const pollJobStatus = useCallback((jobId: string, audioUrl: string) => {
        // Try SSE first for real-time updates
        try {
            const eventSource = new EventSource(`/api/mcp-transcribe/progress?jobId=${jobId}`);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'connected':
                            console.log('SSE connected for job:', jobId);
                            break;

                        case 'job_progress':
                            const job: TranscriptionJob = {
                                jobId: data.jobId,
                                status: data.data.status,
                                progress: data.data.progress,
                                error: data.data.error,
                            };
                            setCurrentJob(job);

                            if (onTranscriptionProgress) {
                                onTranscriptionProgress(job.progress, job.status);
                            }
                            break;

                        case 'job_completed':
                            onTranscriptionComplete(
                                data.data.transcription,
                                data.data.summary || '',
                                audioUrl
                            );
                            setIsProcessing(false);
                            eventSource.close();
                            break;

                        case 'job_error':
                            console.error('Transcription failed:', data.data.message);
                            setIsProcessing(false);
                            alert(`Transcription failed: ${data.data.message}`);
                            eventSource.close();
                            break;

                        case 'ping':
                            // Keep-alive ping, no action needed
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE error, falling back to polling:', error);
                eventSource.close();
                // Fallback to regular polling
                fallbackToPolling(jobId, audioUrl);
            };

            // Set timeout for SSE connection
            setTimeout(() => {
                if (eventSource.readyState !== EventSource.CLOSED) {
                    console.log('SSE timeout, falling back to polling');
                    eventSource.close();
                    fallbackToPolling(jobId, audioUrl);
                }
            }, 10000); // 10 second timeout

        } catch (error) {
            console.error('SSE not supported, falling back to polling:', error);
            fallbackToPolling(jobId, audioUrl);
        }
    }, [onTranscriptionComplete, onTranscriptionProgress]);

    // Fallback polling method
    const fallbackToPolling = useCallback((jobId: string, audioUrl: string) => {
        const poll = async () => {
            try {
                const response = await fetch(`/api/mcp-transcribe?jobId=${jobId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    const job: TranscriptionJob = data.data;
                    setCurrentJob(job);

                    if (onTranscriptionProgress) {
                        onTranscriptionProgress(job.progress, job.status);
                    }

                    if (job.status === 'completed' && job.result) {
                        // Transcription completed
                        onTranscriptionComplete(
                            job.result.transcription,
                            job.result.summary || '',
                            audioUrl
                        );
                        setIsProcessing(false);

                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                        }
                    } else if (job.status === 'failed') {
                        // Transcription failed
                        console.error('Transcription failed:', job.error);
                        setIsProcessing(false);
                        alert(`Transcription failed: ${job.error}`);

                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                        }
                    }
                }
            } catch (error) {
                console.error('Error polling job status:', error);
            }
        };

        // Initial poll
        poll();

        // Set up recurring polling
        pollingIntervalRef.current = setInterval(poll, 2000); // Poll every 2 seconds
    }, [onTranscriptionComplete, onTranscriptionProgress]);

    // Play/pause audio playback
    const togglePlayback = useCallback(() => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, audioUrl]);

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
            {/* Language Selection */}
            <Card className="w-full p-4">
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Transcription Language</label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isRecording || isProcessing}
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Recording Controls */}
            <Card className="w-full p-6">
                <CardContent className="space-y-4">
                    {/* Audio Level Indicator */}
                    <div className="flex items-center justify-center">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-100"
                                style={{ width: `${audioLevel}%` }}
                            />
                        </div>
                    </div>

                    {/* Recording Time */}
                    <div className="text-center">
                        <div className="text-2xl font-mono">
                            {formatTime(recordingTime)}
                        </div>
                        {isRecording && (
                            <div className="text-sm text-muted-foreground">
                                {isPaused ? 'Paused' : 'Recording...'}
                            </div>
                        )}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                        {!isRecording ? (
                            <Button
                                size="lg"
                                onClick={startRecording}
                                disabled={isProcessing}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                            >
                                <Mic className="h-6 w-6" />
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="lg"
                                    onClick={togglePause}
                                    className="w-12 h-12 rounded-full"
                                    variant="outline"
                                >
                                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={stopRecording}
                                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                                >
                                    <Square className="h-6 w-6" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Processing Status */}
                    {isProcessing && currentJob && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="capitalize">{currentJob.status}</span>
                                <span>{currentJob.progress}%</span>
                            </div>
                            <Progress value={currentJob.progress} className="w-full" />
                            {currentJob.error && (
                                <div className="text-sm text-red-500">
                                    Error: {currentJob.error}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audio Playback */}
            {audioUrl && !isProcessing && (
                <Card className="w-full p-4">
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Recording</span>
                            <Button
                                size="sm"
                                onClick={togglePlayback}
                                variant="outline"
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                        </div>
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            onTimeUpdate={() => setPlaybackTime(audioRef.current?.currentTime || 0)}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                        <div className="text-xs text-muted-foreground">
                            Duration: {formatTime(recordingTime)}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}