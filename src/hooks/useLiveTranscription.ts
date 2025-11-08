import { useState, useEffect, useRef, useCallback } from 'react';

interface TranscriptionSegment {
    text: string;
    timestamp: number;
    confidence?: number;
    isFinal?: boolean;
}

interface TranscriptionJob {
    jobId: string;
    status: 'queued' | 'processing' | 'transcribing' | 'summarizing' | 'completed' | 'failed';
    progress: number;
    result?: {
        transcription: string;
        summary: string;
        duration?: number;
        language?: string;
    };
    error?: string;
}

interface UseLiveTranscriptionOptions {
    onTranscriptionComplete?: (transcription: string, summary: string, audioUrl: string) => void;
    onTranscriptionProgress?: (progress: number, status: string) => void;
    onTranscriptUpdate?: (segments: TranscriptionSegment[]) => void;
    autoReconnect?: boolean;
    reconnectDelay?: number;
}

interface UseLiveTranscriptionReturn {
    // State
    isProcessing: boolean;
    currentJob: TranscriptionJob | null;
    liveTranscript: TranscriptionSegment[];
    connectionStatus: 'disconnected' | 'connecting' | 'connected';

    // Actions
    connect: (jobId: string, audioUrl: string) => void;
    disconnect: () => void;
    resetTranscript: () => void;

    // Computed values
    isTranscribing: boolean;
    isCompleted: boolean;
    hasError: boolean;
    errorMessage: string | null;
}

export function useLiveTranscription({
    onTranscriptionComplete,
    onTranscriptionProgress,
    onTranscriptUpdate,
    autoReconnect = true,
    reconnectDelay = 3000,
}: UseLiveTranscriptionOptions = {}): UseLiveTranscriptionReturn {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentJob, setCurrentJob] = useState<TranscriptionJob | null>(null);
    const [liveTranscript, setLiveTranscript] = useState<TranscriptionSegment[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentJobIdRef = useRef<string | null>(null);
    const currentAudioUrlRef = useRef<string | null>(null);
    const reconnectAttemptsRef = useRef<number>(0);

    // Clean up event source
    const cleanupEventSource = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setLiveTranscript([]);
    }, []);

    // Disconnect from SSE
    const disconnect = useCallback(() => {
        cleanupEventSource();
        setConnectionStatus('disconnected');
        setIsProcessing(false);
        currentJobIdRef.current = null;
        currentAudioUrlRef.current = null;
        reconnectAttemptsRef.current = 0;
    }, [cleanupEventSource]);

    // Handle SSE message
    const handleSSEMessage = useCallback((event: MessageEvent, jobId: string, audioUrl: string) => {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'connected':
                    console.log('SSE connected for job:', jobId);
                    reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
                    break;

                case 'job_progress':
                    const job: TranscriptionJob = {
                        jobId: data.jobId,
                        status: data.data.status,
                        progress: data.data.progress,
                        error: data.data.error,
                    };
                    setCurrentJob(job);

                    // Simulate live transcript updates during processing
                    if (data.data.status === 'transcribing' && liveTranscript.length === 0) {
                        const mockSegment: TranscriptionSegment = {
                            text: 'Transcription in progress...',
                            timestamp: Date.now(),
                            isFinal: false,
                        };
                        setLiveTranscript([mockSegment]);
                    }

                    if (onTranscriptionProgress) {
                        onTranscriptionProgress(job.progress, job.status);
                    }
                    break;

                case 'job_completed':
                    const finalTranscript = data.data.transcription;
                    const segments: TranscriptionSegment[] = finalTranscript
                        .split('. ')
                        .filter((sentence: string) => sentence.trim())
                        .map((sentence: string, index: number) => ({
                            text: sentence.trim() + (index < finalTranscript.split('. ').length - 1 ? '.' : ''),
                            timestamp: Date.now() + index * 1000,
                            isFinal: true,
                            confidence: 0.9 + Math.random() * 0.1,
                        }));

                    setLiveTranscript(segments);

                    if (onTranscriptUpdate) {
                        onTranscriptUpdate(segments);
                    }

                    if (onTranscriptionComplete) {
                        onTranscriptionComplete(
                            data.data.transcription,
                            data.data.summary || '',
                            audioUrl
                        );
                    }

                    setIsProcessing(false);
                    setConnectionStatus('disconnected');
                    cleanupEventSource();
                    break;

                case 'job_error':
                    console.error('Transcription failed:', data.data.message);
                    setIsProcessing(false);
                    setConnectionStatus('disconnected');
                    cleanupEventSource();
                    break;

                case 'ping':
                    // Keep-alive ping, no action needed
                    break;
            }
        } catch (error) {
            console.error('Error parsing SSE message:', error);
        }
    }, [cleanupEventSource, liveTranscript.length, onTranscriptionComplete, onTranscriptionProgress, onTranscriptUpdate]);

    // Connect to SSE for real-time updates
    const connect = useCallback((jobId: string, audioUrl: string) => {
        // Clean up existing connection
        cleanupEventSource();

        currentJobIdRef.current = jobId;
        currentAudioUrlRef.current = audioUrl;
        setConnectionStatus('connecting');
        setIsProcessing(true);

        const establishConnection = () => {
            try {
                const eventSource = new EventSource(`/api/mcp-transcribe/progress?jobId=${jobId}`);
                eventSourceRef.current = eventSource;

                eventSource.onopen = () => {
                    setConnectionStatus('connected');
                };

                eventSource.onmessage = (event) => {
                    handleSSEMessage(event, jobId, audioUrl);
                };

                eventSource.onerror = (error) => {
                    console.error('SSE error:', error);
                    setConnectionStatus('disconnected');
                    cleanupEventSource();

                    // Simple reconnection logic without circular dependency
                    if (autoReconnect && isProcessing && reconnectAttemptsRef.current < 5) {
                        reconnectAttemptsRef.current++;
                        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff

                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (currentJobIdRef.current && currentAudioUrlRef.current) {
                                establishConnection();
                            }
                        }, delay);
                    }
                };

            } catch (error) {
                console.error('Error setting up SSE connection:', error);
                setConnectionStatus('disconnected');
                setIsProcessing(false);
            }
        };

        establishConnection();
    }, [cleanupEventSource, handleSSEMessage, autoReconnect, reconnectDelay, isProcessing]);

    // Computed values
    const isTranscribing = currentJob?.status === 'transcribing';
    const isCompleted = currentJob?.status === 'completed';
    const hasError = currentJob?.status === 'failed';
    const errorMessage = currentJob?.error || null;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupEventSource();
        };
    }, [cleanupEventSource]);

    return {
        // State
        isProcessing,
        currentJob,
        liveTranscript,
        connectionStatus,

        // Actions
        connect,
        disconnect,
        resetTranscript,

        // Computed values
        isTranscribing,
        isCompleted,
        hasError,
        errorMessage,
    };
}