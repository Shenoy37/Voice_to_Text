'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, Square, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveTranscription } from '@/hooks/useLiveTranscription';

interface LiveTranscriptionProps {
    onTranscriptionComplete?: (transcription: string, summary: string, audioUrl: string) => void;
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

export default function LiveTranscription({
    onTranscriptionComplete,
    onTranscriptionProgress,
    defaultLanguage = 'en'
}: LiveTranscriptionProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
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

    // Use the live transcription hook
    const {
        isProcessing,
        currentJob,
        liveTranscript,
        connectionStatus,
        connect,
        disconnect,
        resetTranscript,
        isTranscribing,
        isCompleted,
        hasError,
        errorMessage,
    } = useLiveTranscription({
        onTranscriptionComplete,
        onTranscriptionProgress,
        autoReconnect: true,
        reconnectDelay: 3000,
    });

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
            resetTranscript();

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

            // setIsProcessing is handled by the hook
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
                // Start SSE connection for real-time updates using the hook
                connect(data.data.jobId, url);
            } else {
                throw new Error('No job ID returned from MCP service');
            }

        } catch (error) {
            console.error('MCP Transcription error:', error);
            alert('Error transcribing audio. Please try again.');
        }
    };

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

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'queued': return 'bg-yellow-500';
            case 'processing': return 'bg-blue-500';
            case 'transcribing': return 'bg-purple-500';
            case 'summarizing': return 'bg-indigo-500';
            case 'completed': return 'bg-green-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            disconnect();
        };
    }, [disconnect]);

    return (
        <div className="flex flex-col space-y-6 w-full max-w-4xl mx-auto">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Live Transcription</span>
                        <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                            {connectionStatus === 'connected' ? 'Connected' :
                                connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Language Selection */}
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

                    {/* Audio Level Indicator */}
                    <div className="flex items-center justify-center space-x-4">
                        <Volume2 className="h-5 w-5 text-gray-500" />
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-100 ${audioLevel > 80 ? 'bg-red-500' :
                                    audioLevel > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${audioLevel}%` }}
                            />
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">
                            {Math.round(audioLevel)}%
                        </span>
                    </div>

                    {/* Recording Time and Status */}
                    <div className="text-center">
                        <div className="text-3xl font-mono font-bold">
                            {formatTime(recordingTime)}
                        </div>
                        {isRecording && (
                            <div className="text-sm text-muted-foreground mt-1">
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
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge className={`${getStatusColor(currentJob.status)} text-white`}>
                                    {currentJob.status}
                                </Badge>
                                <span className="text-sm font-medium">{currentJob.progress}%</span>
                            </div>
                            <Progress value={currentJob.progress} className="w-full" />
                            {hasError && errorMessage && (
                                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                    Error: {errorMessage}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Live Transcription Display */}
            {(liveTranscript.length > 0 || isProcessing) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Live Transcription</span>
                            {isProcessing && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64 w-full rounded-md border p-4">
                            <div className="space-y-3">
                                {liveTranscript.map((segment, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg ${segment.isFinal
                                            ? 'bg-gray-50 border border-gray-200'
                                            : 'bg-blue-50 border border-blue-200 animate-pulse'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed">
                                            {segment.text}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                                {new Date(segment.timestamp).toLocaleTimeString()}
                                            </span>
                                            {segment.confidence && (
                                                <Badge variant="outline" className="text-xs">
                                                    {Math.round(segment.confidence * 100)}% confidence
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isProcessing && liveTranscript.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                        <p>Waiting for transcription to start...</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {/* Audio Playback */}
            {audioUrl && !isProcessing && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recording Playback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Duration: {formatTime(recordingTime)}</span>
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
                        <Progress
                            value={recordingTime > 0 ? (playbackTime / recordingTime) * 100 : 0}
                            className="w-full"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}