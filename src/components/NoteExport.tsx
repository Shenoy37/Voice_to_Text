'use client';

import { useState } from 'react';
import { useNote } from '@/hooks/useNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Download,
    FileText,
    Code,
    File,
    Mail,
    Share2,
    Check,
    Copy
} from 'lucide-react';

interface Note {
    id: number;
    title: string;
    content: string;
    summary?: string;
    transcription?: string;
    audioUrl?: string;
    duration?: number;
    status: 'draft' | 'published' | 'processing' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isFavorite: boolean;
    isBookmarked: boolean;
    categoryId?: number;
    reminderAt?: string;
    version: number;
    metadata?: Record<string, unknown>;
    wordCount: number;
    readingTime: number;
    createdAt: string;
    updatedAt: string;
}

interface NoteExportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    noteId: number | null;
}

export default function NoteExport({ open, onOpenChange, noteId }: NoteExportProps) {
    const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'pdf' | 'txt' | 'html'>('markdown');
    const [includeMetadata, setIncludeMetadata] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    const { data: noteData } = useNote(noteId || 0);

    const exportAsMarkdown = (note: Note) => {
        let markdown = `# ${note.title}\n\n`;

        if (includeMetadata) {
            markdown += `> **Created:** ${new Date(note.createdAt).toLocaleDateString()}\n`;
            markdown += `> **Updated:** ${new Date(note.updatedAt).toLocaleDateString()}\n`;
            markdown += `> **Status:** ${note.status}\n`;
            markdown += `> **Priority:** ${note.priority}\n`;
            if (note.categoryId) {
                markdown += `> **Category:** [Category ID: ${note.categoryId}]\n`;
            }
            markdown += `> **Word Count:** ${note.wordCount}\n`;
            markdown += `> **Reading Time:** ${note.readingTime} minutes\n\n`;
        }

        if (note.summary) {
            markdown += `## Summary\n\n${note.summary}\n\n`;
        }

        markdown += `## Content\n\n${note.content}\n`;

        if (note.transcription) {
            markdown += `\n## Transcription\n\n${note.transcription}\n`;
        }

        return markdown;
    };

    const exportAsText = (note: Note) => {
        let text = `${note.title}\n`;
        text += `${'='.repeat(note.title.length)}\n\n`;

        if (includeMetadata) {
            text += `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;
            text += `Updated: ${new Date(note.updatedAt).toLocaleDateString()}\n`;
            text += `Status: ${note.status}\n`;
            text += `Priority: ${note.priority}\n`;
            text += `Word Count: ${note.wordCount}\n`;
            text += `Reading Time: ${note.readingTime} minutes\n\n`;
        }

        if (note.summary) {
            text += `Summary:\n${note.summary}\n\n`;
        }

        text += `Content:\n${note.content}\n`;

        if (note.transcription) {
            text += `\nTranscription:\n${note.transcription}\n`;
        }

        return text;
    };

    const exportAsHTML = (note: Note) => {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .metadata-item { margin: 5px 0; }
        .summary { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3; }
        .content { margin: 20px 0; }
        .transcription { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #03a9f4; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>`;

        if (includeMetadata) {
            html += `
    <div class="metadata">
        <div class="metadata-item"><strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()}</div>
        <div class="metadata-item"><strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}</div>
        <div class="metadata-item"><strong>Status:</strong> ${note.status}</div>
        <div class="metadata-item"><strong>Priority:</strong> ${note.priority}</div>
        <div class="metadata-item"><strong>Word Count:</strong> ${note.wordCount}</div>
        <div class="metadata-item"><strong>Reading Time:</strong> ${note.readingTime} minutes</div>
    </div>`;
        }

        if (note.summary) {
            html += `
    <div class="summary">
        <h2>Summary</h2>
        <p>${note.summary}</p>
    </div>`;
        }

        html += `
    <div class="content">
        <h2>Content</h2>
        <p>${note.content.replace(/\n/g, '<br>')}</p>
    </div>`;

        if (note.transcription) {
            html += `
    <div class="transcription">
        <h2>Transcription</h2>
        <p>${note.transcription.replace(/\n/g, '<br>')}</p>
    </div>`;
        }

        html += `
</body>
</html>`;

        return html;
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        if (!noteData) return;

        setIsExporting(true);
        setExportSuccess(false);

        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const baseFilename = `${noteData.title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}`;

            switch (selectedFormat) {
                case 'markdown':
                    const markdown = exportAsMarkdown(noteData);
                    downloadFile(markdown, `${baseFilename}.md`, 'text/markdown');
                    break;
                case 'txt':
                    const text = exportAsText(noteData);
                    downloadFile(text, `${baseFilename}.txt`, 'text/plain');
                    break;
                case 'html':
                    const html = exportAsHTML(noteData);
                    downloadFile(html, `${baseFilename}.html`, 'text/html');
                    break;
                case 'pdf':
                    // For PDF export, we would need a library like jsPDF
                    // For now, we'll show a message
                    alert('PDF export requires additional setup. Please use another format for now.');
                    break;
            }

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const copyToClipboard = async () => {
        if (!noteData) return;

        try {
            let content = '';
            switch (selectedFormat) {
                case 'markdown':
                    content = exportAsMarkdown(noteData);
                    break;
                case 'txt':
                    content = exportAsText(noteData);
                    break;
                case 'html':
                    content = exportAsHTML(noteData);
                    break;
            }

            await navigator.clipboard.writeText(content);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error('Copy error:', error);
            alert('Failed to copy to clipboard.');
        }
    };

    const shareNote = async () => {
        if (!noteData) return;

        try {
            const shareData = {
                title: noteData.title,
                text: noteData.summary || noteData.content.substring(0, 200) + '...',
                url: window.location.href + `/notes/${noteData.id}`
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await copyToClipboard();
            }
        } catch (error) {
            console.error('Share error:', error);
            alert('Sharing failed. Please try again.');
        }
    };

    if (!noteData) {
        return <div>Loading note...</div>;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Export Note</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Note Preview */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                        <h3 className="font-medium mb-2">{noteData.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {noteData.summary || noteData.content.substring(0, 150) + '...'}
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Badge variant="outline">{noteData.status}</Badge>
                            <Badge variant="outline">{noteData.priority}</Badge>
                            <Badge variant="outline">{noteData.wordCount} words</Badge>
                        </div>
                    </div>

                    {/* Export Format Selection */}
                    <Tabs value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'markdown' | 'pdf' | 'txt' | 'html')}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="markdown" className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                Markdown
                            </TabsTrigger>
                            <TabsTrigger value="txt" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Text
                            </TabsTrigger>
                            <TabsTrigger value="html" className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                HTML
                            </TabsTrigger>
                            <TabsTrigger value="pdf" className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                PDF
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="markdown" className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Export as Markdown format with proper formatting and metadata.
                            </div>
                        </TabsContent>
                        <TabsContent value="txt" className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Export as plain text format with basic structure.
                            </div>
                        </TabsContent>
                        <TabsContent value="html" className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Export as HTML format with styling and structure.
                            </div>
                        </TabsContent>
                        <TabsContent value="pdf" className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Export as PDF format for printing and sharing.
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Export Options */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="includeMetadata"
                                checked={includeMetadata}
                                onChange={(e) => setIncludeMetadata(e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor="includeMetadata" className="text-sm">
                                Include metadata (creation date, status, etc.)
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={copyToClipboard}
                            className="flex-1"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                        </Button>
                        <Button
                            variant="outline"
                            onClick={shareNote}
                            className="flex-1"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex-1"
                        >
                            {isExporting ? (
                                <>Exporting...</>
                            ) : exportSuccess ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Exported!
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}