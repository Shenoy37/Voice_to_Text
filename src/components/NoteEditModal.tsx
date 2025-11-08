'use client';

import { useState, useEffect } from 'react';
import { useUpdateNote, useNote } from '@/hooks/useNotes';
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
import { X, Calendar, Tag as TagIcon, Folder, Star, Bookmark, Flag, Clock, History, Eye } from 'lucide-react';

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

interface NoteEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    noteId: number | null;
}

export default function NoteEditModal({ open, onOpenChange, noteId }: NoteEditModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [status, setStatus] = useState<'draft' | 'published' | 'processing' | 'completed' | 'failed'>('draft');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [reminderAt, setReminderAt] = useState('');
    const [changeDescription, setChangeDescription] = useState('');
    const [activeTab, setActiveTab] = useState('edit');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const updateNoteMutation = useUpdateNote();
    const { data: categoriesData } = useCategories();
    const { data: tagsData } = useTags();
    const { data: noteData, isLoading } = useNote(noteId || 0);

    useEffect(() => {
        if (noteData) {
            // Batch all state updates together to avoid multiple renders
            const updateState = () => {
                setTitle(noteData.title);
                setContent(noteData.content);
                setSummary(noteData.summary || '');
                setStatus(noteData.status);
                setPriority(noteData.priority);
                setIsFavorite(noteData.isFavorite);
                setIsBookmarked(noteData.isBookmarked);
                setSelectedCategory(noteData.categoryId || null);
                setReminderAt(noteData.reminderAt || '');
            };

            // Use setTimeout to batch state updates
            setTimeout(updateState, 0);
        }
    }, [noteData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('Please provide both title and content');
            return;
        }

        if (!noteId) return;

        try {
            await updateNoteMutation.mutateAsync({
                id: noteId,
                title: title.trim(),
                content: content.trim(),
                summary: summary.trim() || undefined,
                status,
                priority,
                isFavorite,
                isBookmarked,
                categoryId: selectedCategory || undefined,
                reminderAt: reminderAt || undefined,
                tagIds: selectedTags.length > 0 ? selectedTags : undefined,
                changeDescription: changeDescription.trim() || undefined,
            });

            onOpenChange(false);
        } catch (error) {
            console.error('Error updating note:', error);
            alert('Failed to update note. Please try again.');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'default';
            case 'draft': return 'secondary';
            case 'processing': return 'outline';
            case 'completed': return 'default';
            case 'failed': return 'destructive';
            default: return 'secondary';
        }
    };

    const calculateWordCount = (text: string) => {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    };

    const wordCount = calculateWordCount(content);
    const readingTime = Math.ceil(wordCount / 200);

    if (isLoading) {
        return <div>Loading note...</div>;
    }

    if (!noteData && noteId) {
        return <div>Note not found</div>;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Edit Note</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                Version {noteData?.version || 1}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="organize">Organize</TabsTrigger>
                            <TabsTrigger value="metadata">Metadata</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4">
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
                                    {isPreviewMode ? (
                                        <div className="border rounded-md p-3 min-h-[200px] bg-muted/50">
                                            <div className="prose prose-sm max-w-none">
                                                {content.split('\n').map((paragraph, index) => (
                                                    <p key={index}>{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <Textarea
                                            id="content"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Enter note content..."
                                            rows={10}
                                            required
                                        />
                                    )}
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>{wordCount} words</span>
                                        <span>~{readingTime} min read</span>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="summary">Summary</Label>
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

                        <TabsContent value="organize" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status */}
                                <div>
                                    <Label>Status</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getStatusColor(status)}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            <DropdownMenuItem onClick={() => setStatus('draft')}>
                                                <Badge variant="secondary">Draft</Badge>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setStatus('published')}>
                                                <Badge variant="default">Published</Badge>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setStatus('processing')}>
                                                <Badge variant="outline">Processing</Badge>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setStatus('completed')}>
                                                <Badge variant="default">Completed</Badge>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

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
                                <div className="md:col-span-2">
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

                        <TabsContent value="metadata" className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="changeDescription">Change Description</Label>
                                    <Textarea
                                        id="changeDescription"
                                        value={changeDescription}
                                        onChange={(e) => setChangeDescription(e.target.value)}
                                        placeholder="Describe what changes you made..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Word Count</Label>
                                        <Input value={wordCount.toString()} disabled />
                                    </div>
                                    <div>
                                        <Label>Reading Time</Label>
                                        <Input value={`${readingTime} minutes`} disabled />
                                    </div>
                                    <div>
                                        <Label>Created</Label>
                                        <Input
                                            value={noteData ? new Date(noteData.createdAt).toLocaleString() : ''}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <Label>Last Updated</Label>
                                        <Input
                                            value={noteData ? new Date(noteData.updatedAt).toLocaleString() : ''}
                                            disabled
                                        />
                                    </div>
                                </div>

                                {noteData?.audioUrl && (
                                    <div>
                                        <Label>Audio Recording</Label>
                                        <div className="flex items-center gap-2 p-2 border rounded">
                                            <Clock className="h-4 w-4" />
                                            <span>Duration: {Math.floor((noteData.duration || 0) / 60)}:{((noteData.duration || 0) % 60).toString().padStart(2, '0')}</span>
                                            <Badge variant="outline">🎤 Voice</Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            <div className="text-center py-8">
                                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium mb-2">Version History</h3>
                                <p className="text-muted-foreground mb-4">
                                    Track changes and view previous versions of this note
                                </p>
                                <Button variant="outline">
                                    View Version History
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
                            disabled={updateNoteMutation.isPending}
                            className="flex-1"
                        >
                            {updateNoteMutation.isPending ? 'Updating...' : 'Update Note'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}