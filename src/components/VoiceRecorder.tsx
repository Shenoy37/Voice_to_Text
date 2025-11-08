'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VoiceRecorderProps {
    onTranscriptionComplete: (transcription: string, summary: string, audioUrl: string) => void;
}

interface AudioLevel {
    current: number;
    peak: number;
    average: number;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState<AudioLevel>({ current: 0, peak: 0, average: 0 });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
    const levelMeterCanvasRef = useRef<HTMLCanvasElement>(null);

    // Format time in MM:SS format
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Initialize audio context and analyser
    const initializeAudioContext = useCallback((stream: MediaStream) => {
        try {
            audioContextRef.current = new (window.AudioContext || (window as unknown as typeof AudioContext))();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            analyserRef.current.smoothingTimeConstant = 0.8;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            streamRef.current = stream;
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }, []);

    // Draw waveform visualization
    const drawWaveform = useCallback(() => {
        if (!analyserRef.current || !waveformCanvasRef.current) return;

        const canvas = waveformCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording || isPaused) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(241, 245, 249)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = isRecording ? 'rgb(239, 68, 68)' : 'rgb(107, 114, 128)';
            canvasCtx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };

        draw();
    }, [isRecording, isPaused]);

    // Draw audio level meter
    const drawLevelMeter = useCallback(() => {
        if (!analyserRef.current || !levelMeterCanvasRef.current) return;

        const canvas = levelMeterCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording || isPaused) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);

            // Calculate audio levels
            let sum = 0;
            let peak = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
                if (dataArray[i] > peak) {
                    peak = dataArray[i];
                }
            }
            const average = sum / bufferLength;
            const current = Math.max.apply(null, Array.from(dataArray.slice(0, 100))); // Get max from lower frequencies

            setAudioLevel({
                current: current / 255,
                peak: peak / 255,
                average: average / 255
            });

            // Clear canvas
            canvasCtx.fillStyle = 'rgb(241, 245, 249)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw level bars
            const barWidth = canvas.width / 3;
            const barSpacing = 10;
            const maxHeight = canvas.height - 20;

            // Current level (red/yellow/green based on intensity)
            const currentHeight = (current / 255) * maxHeight;
            const currentColor = current > 200 ? 'rgb(239, 68, 68)' : current > 100 ? 'rgb(251, 191, 36)' : 'rgb(34, 197, 94)';
            canvasCtx.fillStyle = currentColor;
            canvasCtx.fillRect(barSpacing, canvas.height - currentHeight - 10, barWidth, currentHeight);

            // Peak level (blue)
            const peakHeight = (peak / 255) * maxHeight;
            canvasCtx.fillStyle = 'rgb(59, 130, 246)';
            canvasCtx.fillRect(barWidth + barSpacing * 2, canvas.height - peakHeight - 10, barWidth, peakHeight);

            // Average level (purple)
            const averageHeight = (average / 255) * maxHeight;
            canvasCtx.fillStyle = 'rgb(168, 85, 247)';
            canvasCtx.fillRect(barWidth * 2 + barSpacing * 3, canvas.height - averageHeight - 10, barWidth, averageHeight);

            // Draw labels
            canvasCtx.fillStyle = 'rgb(107, 114, 128)';
            canvasCtx.font = '10px sans-serif';
            canvasCtx.fillText('Current', barSpacing, canvas.height - 2);
            canvasCtx.fillText('Peak', barWidth + barSpacing * 2, canvas.height - 2);
            canvasCtx.fillText('Average', barWidth * 2 + barSpacing * 3, canvas.height - 2);
        };

        draw();
    }, [isRecording, isPaused]);

    // Start recording timer
    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    }, []);

    // Stop recording timer
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Cleanup audio resources
    const cleanupAudioResources = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        stopTimer();
    }, [stopTimer]);

    const transcribeAudio = async (audioBlob: Blob, audioUrl: string) => {
        try {
            const formData = new FormData();
            formData.append('audioFile', audioBlob, 'recording.wav');

            const response = await fetch('/api/transcribe-and-summarize', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            onTranscriptionComplete(
                data.data.transcription,
                data.data.summary || '',
                audioUrl
            );
        } catch (error) {
            console.error('Transcription error:', error);
            alert('Error transcribing audio. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            initializeAudioContext(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                cleanupAudioResources();

                await transcribeAudio(audioBlob, audioUrl);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            startTimer();

            // Start visualizations
            setTimeout(() => {
                drawWaveform();
                drawLevelMeter();
            }, 100);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error accessing microphone. Please check permissions.');
        }
    }, [initializeAudioContext, cleanupAudioResources, transcribeAudio, startTimer, drawWaveform, drawLevelMeter]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            setIsProcessing(true);
            cleanupAudioResources();
        }
    }, [isRecording, cleanupAudioResources]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
        }
    }, [isRecording, isPaused, stopTimer]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
            drawWaveform();
            drawLevelMeter();
        }
    }, [isRecording, isPaused, startTimer, drawWaveform, drawLevelMeter]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAudioResources();
        };
    }, [cleanupAudioResources]);

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto">
            {/* Recording controls */}
            <div className="flex items-center space-x-4">
                {!isRecording ? (
                    <Button
                        size="lg"
                        onClick={startRecording}
                        disabled={isProcessing}
                        className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                            <Mic className="h-8 w-8" />
                        )}
                    </Button>
                ) : (
                    <div className="flex items-center space-x-3">
                        <Button
                            size="lg"
                            onClick={stopRecording}
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                        >
                            <MicOff className="h-6 w-6" />
                        </Button>

                        <Button
                            size="lg"
                            onClick={isPaused ? resumeRecording : pauseRecording}
                            className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600"
                        >
                            {isPaused ? (
                                <Play className="h-6 w-6" />
                            ) : (
                                <Pause className="h-6 w-6" />
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Recording status and time */}
            <div className="text-center">
                <p className="text-lg font-medium">
                    {isProcessing
                        ? 'Processing audio...'
                        : isRecording
                            ? isPaused
                                ? 'Recording paused'
                                : 'Recording...'
                            : 'Click to start recording'}
                </p>
                {isRecording && (
                    <p className="text-2xl font-mono font-bold text-red-500 mt-2">
                        {formatTime(recordingTime)}
                    </p>
                )}
            </div>

            {/* Waveform visualization */}
            {isRecording && (
                <div className="w-full space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Waveform</h3>
                    <canvas
                        ref={waveformCanvasRef}
                        width={600}
                        height={150}
                        className="w-full h-32 border border-gray-300 rounded-lg bg-gray-50"
                    />
                </div>
            )}

            {/* Audio level meter */}
            {isRecording && (
                <div className="w-full space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Audio Levels</h3>
                    <canvas
                        ref={levelMeterCanvasRef}
                        width={600}
                        height={120}
                        className="w-full h-28 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Current: {Math.round(audioLevel.current * 100)}%</span>
                        <span>Peak: {Math.round(audioLevel.peak * 100)}%</span>
                        <span>Average: {Math.round(audioLevel.average * 100)}%</span>
                    </div>
                </div>
            )}

            {/* Audio level progress bars */}
            {isRecording && (
                <div className="w-full space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Current Level</span>
                            <span>{Math.round(audioLevel.current * 100)}%</span>
                        </div>
                        <Progress
                            value={audioLevel.current * 100}
                            className="h-2"
                            indicatorClassName={
                                audioLevel.current > 0.8 ? 'bg-red-500' :
                                    audioLevel.current > 0.5 ? 'bg-yellow-500' :
                                        'bg-green-500'
                            }
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Peak Level</span>
                            <span>{Math.round(audioLevel.peak * 100)}%</span>
                        </div>
                        <Progress value={audioLevel.peak * 100} className="h-2" indicatorClassName="bg-blue-500" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Average Level</span>
                            <span>{Math.round(audioLevel.average * 100)}%</span>
                        </div>
                        <Progress value={audioLevel.average * 100} className="h-2" indicatorClassName="bg-purple-500" />
                    </div>
                </div>
            )}
        </div>
    );
}