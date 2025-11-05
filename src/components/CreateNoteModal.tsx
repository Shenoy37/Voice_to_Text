'use client';

import { useState } from 'react';
import { useCreateNote } from '@/hooks/useNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import VoiceRecorder from './VoiceRecorder';
import { X } from 'lucide-react';

interface CreateNoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateNoteModal({ open, onOpenChange }: CreateNoteModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [transcription, setTranscription] = useState('');
    const [summary, setSummary] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [duration, setDuration] = useState(0);

    const createNoteMutation = useCreateNote();

    const handleTranscriptionComplete = (
        newTranscription: string,
        newSummary: string,
        newAudioUrl: string
    ) => {
        setTranscription(newTranscription);
        setSummary(newSummary);
        setContent(newTranscription);
        setAudioUrl(newAudioUrl);

        // Generate title from first few words of transcription
        const words = newTranscription.split(' ').slice(0, 5).join(' ');
        setTitle(words || 'New Note');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('Please provide both title and content');
            return;
        }

        try {
            await createNoteMutation.mutateAsync({
                title: title.trim(),
                content: content.trim(),
                summary: summary.trim() || undefined,
                transcription: transcription.trim() || undefined,
                audioUrl,
                duration,
            });

            // Reset form
            setTitle('');
            setContent('');
            setTranscription('');
            setSummary('');
            setAudioUrl('');
            setDuration(0);

            onOpenChange(false);
        } catch (error) {
            console.error('Error creating note:', error);
            alert('Failed to create note. Please try again.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Create New Note</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Voice Recorder Section */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                        <Label className="text-sm font-medium mb-3 block">
                            Voice Recording
                        </Label>
                        <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                        {transcription && (
                            <div className="mt-4 p-3 bg-background rounded border">
                                <p className="text-sm text-muted-foreground mb-1">Transcription:</p>
                                <p className="text-sm">{transcription}</p>
                            </div>
                        )}
                    </div>

                    {/* Text Input Section */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter note title..."
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter note content..."
                                rows={6}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createNoteMutation.isPending}
                            className="flex-1"
                        >
                            {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}