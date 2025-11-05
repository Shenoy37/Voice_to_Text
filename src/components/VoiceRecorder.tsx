'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
    onTranscriptionComplete: (transcription: string, summary: string, audioUrl: string) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Send to backend for transcription
                await transcribeAudio(audioBlob, audioUrl);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error accessing microphone. Please check permissions.');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    }, [isRecording]);

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

    return (
        <div className="flex flex-col items-center space-y-4">
            <Button
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-24 h-24 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''
                    }`}
            >
                {isProcessing ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                ) : isRecording ? (
                    <MicOff className="h-8 w-8" />
                ) : (
                    <Mic className="h-8 w-8" />
                )}
            </Button>

            <p className="text-sm text-muted-foreground">
                {isProcessing
                    ? 'Processing audio...'
                    : isRecording
                        ? 'Recording... Click to stop'
                        : 'Click to start recording'}
            </p>
        </div>
    );
}