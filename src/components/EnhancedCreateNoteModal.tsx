'use client';

import { useState, useEffect } from 'react';
import { useCreateNote } from '@/hooks/useNotes';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceRecorder from './VoiceRecorder';
import { X, Calendar, Tag as TagIcon, Folder, Star, Bookmark, Flag, Clock } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface EnhancedCreateNoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EnhancedCreateNoteModal({ open, onOpenChange }: EnhancedCreateNoteModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [transcription, setTranscription] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [duration, setDuration] = useState(0);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [reminderAt, setReminderAt] = useState('');
    const [activeTab, setActiveTab] = useState('write');

    const createNoteMutation = useCreateNote();
    const { data: categoriesData } = useCategories();
    const { data: tagsData } = useTags();

    const handleTranscriptionComplete = (
        newTranscription: string,
        newSummary: string,
        newAudioUrl: string,
        newDuration: number
    ) => {
        setTranscription(newTranscription);
        setSummary(newSummary);
        setContent(newTranscription);
        setAudioUrl(newAudioUrl);
        setDuration(newDuration);

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
                priority,
                isFavorite,
                isBookmarked,
                categoryId: selectedCategory || undefined,
                reminderAt: reminderAt || undefined,
                tagIds: selectedTags.length > 0 ? selectedTags : undefined,
            });

            // Reset form
            setTitle('');
            setContent('');
            setSummary('');
            setTranscription('');
            setAudioUrl('');
            setDuration(0);
            setPriority('medium');
            setIsFavorite(false);
            setIsBookmarked(false);
            setSelectedCategory(null);
            setSelectedTags([]);
            setReminderAt('');
            setActiveTab('write');

            onOpenChange(false);
        } catch (error) {
            console.error('Error creating note:', error);
            alert('Failed to create note. Please try again.');
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const calculateWordCount = (text: string) => {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    };

    const wordCount = calculateWordCount(content);
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="write">Write</TabsTrigger>
                            <TabsTrigger value="voice">Voice</TabsTrigger>
                            <TabsTrigger value="organize">Organize</TabsTrigger>
                        </TabsList>

                        <TabsContent value="write" className="space-y-4">
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
                                        rows={8}
                                        required
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>{wordCount} words</span>
                                        <span>~{readingTime} min read</span>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="summary">Summary (Optional)</Label>
                                    <Textarea
                                        id="summary"
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder="Brief summary of your note..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="voice" className="space-y-4">
                            <div className="border rounded-lg p-4 bg-muted/50">
                                <Label className="text-sm font-medium mb-3 block">
                                    Voice Recording
                                </Label>
                                <VoiceRecorder
                                    onTranscriptionComplete={(transcription, summary, audioUrl) =>
                                        handleTranscriptionComplete(transcription, summary, audioUrl, duration)
                                    }
                                />
                                {transcription && (
                                    <div className="mt-4 p-3 bg-background rounded border">
                                        <p className="text-sm text-muted-foreground mb-1">Transcription:</p>
                                        <p className="text-sm">{transcription}</p>
                                        {duration > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                                <Clock className="h-3 w-3" />
                                                Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="organize" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Priority */}
                                <div>
                                    <Label>Priority</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
                                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                </div>
                                                <Flag className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            <DropdownMenuItem onClick={() => setPriority('low')}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                                    Low
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setPriority('medium')}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                                    Medium
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setPriority('high')}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                                    High
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setPriority('urgent')}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                                    Urgent
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Category */}
                                <div>
                                    <Label>Category</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                <div className="flex items-center gap-2">
                                                    {selectedCategory
                                                        ? (() => {
                                                            const category = categoriesData?.categories.find(c => c.id === selectedCategory);
                                                            return category ? (
                                                                <>
                                                                    <span>{category.icon}</span>
                                                                    {category.name}
                                                                </>
                                                            ) : 'No Category';
                                                        })()
                                                        : (
                                                            <>
                                                                <Folder className="h-4 w-4" />
                                                                No Category
                                                            </>
                                                        )}
                                                </div>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                                                No Category
                                            </DropdownMenuItem>
                                            {categoriesData?.categories.map((category: Category) => (
                                                <DropdownMenuItem
                                                    key={category.id}
                                                    onClick={() => setSelectedCategory(category.id)}
                                                >
                                                    <span className="mr-2">{category.icon}</span>
                                                    {category.name}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Reminder */}
                                <div>
                                    <Label htmlFor="reminder">Reminder</Label>
                                    <Input
                                        id="reminder"
                                        type="datetime-local"
                                        value={reminderAt}
                                        onChange={(e) => setReminderAt(e.target.value)}
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <Label>Tags</Label>
                                    <div className="border rounded-md p-2 min-h-[80px]">
                                        <div className="flex flex-wrap gap-2">
                                            {tagsData?.tags.map((tag: Tag) => (
                                                <Badge
                                                    key={tag.id}
                                                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                                                    className="cursor-pointer"
                                                    style={{
                                                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                                                        borderColor: tag.color,
                                                    }}
                                                    onClick={() => handleTagToggle(tag.id)}
                                                >
                                                    <TagIcon className="h-3 w-3 mr-1" />
                                                    {tag.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={isFavorite ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsFavorite(!isFavorite)}
                                    className="flex items-center gap-2"
                                >
                                    <Star className="h-4 w-4" />
                                    {isFavorite ? 'Favorited' : 'Add to Favorites'}
                                </Button>
                                <Button
                                    type="button"
                                    variant={isBookmarked ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsBookmarked(!isBookmarked)}
                                    className="flex items-center gap-2"
                                >
                                    <Bookmark className="h-4 w-4" />
                                    {isBookmarked ? 'Bookmarked' : 'Add Bookmark'}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>

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