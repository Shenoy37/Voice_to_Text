'use client';

import { useState, useMemo } from 'react';
import { useNotes, useToggleFavorite, useToggleBookmark, useDeleteNote } from '@/hooks/useNotes';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Edit,
    Trash2,
    Clock,
    FileText,
    Star,
    Bookmark,
    StarOff,
    Filter,
    Search,
    SortAsc,
    SortDesc,
    MoreHorizontal,
    Tag,
    Folder,
    Calendar,
    BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export default function EnhancedNotesList() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedPriority, setSelectedPriority] = useState<string>('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [activeTab, setActiveTab] = useState('all');

    const { data, isLoading, error } = useNotes({
        page: currentPage,
        limit: 12,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
        isFavorite: showFavoritesOnly || undefined,
        isBookmarked: showBookmarksOnly || undefined,
        sortBy,
        sortOrder,
    });

    const { data: categoriesData } = useCategories();
    const { data: tagsData } = useTags({ includeUsageCount: true });

    const toggleFavoriteMutation = useToggleFavorite();
    const toggleBookmarkMutation = useToggleBookmark();
    const deleteNoteMutation = useDeleteNote();

    const handleToggleFavorite = async (noteId: number, isFavorite: boolean) => {
        try {
            await toggleFavoriteMutation.mutateAsync({ id: noteId, isFavorite: !isFavorite });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleToggleBookmark = async (noteId: number, isBookmarked: boolean) => {
        try {
            await toggleBookmarkMutation.mutateAsync({ id: noteId, isBookmarked: !isBookmarked });
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const handleDeleteNote = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNoteMutation.mutateAsync(id);
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const handleEditNote = (note: Note) => {
        // This would open an edit dialog/modal
        console.log('Edit note:', note);
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

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory(null);
        setSelectedTags([]);
        setSelectedStatus('');
        setSelectedPriority('');
        setShowFavoritesOnly(false);
        setShowBookmarksOnly(false);
        setActiveTab('all');
    };

    if (isLoading) return <div>Loading notes...</div>;
    if (error) return <div>Error loading notes</div>;

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search & Filter
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Quick Filters */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">All Notes</TabsTrigger>
                            <TabsTrigger value="favorites">Favorites</TabsTrigger>
                            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                            <TabsTrigger value="recent">Recent</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Advanced Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {selectedCategory
                                            ? categoriesData?.categories.find(c => c.id === selectedCategory)?.name
                                            : 'All Categories'}
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                                        All Categories
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

                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {selectedStatus || 'All Status'}
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuItem onClick={() => setSelectedStatus('')}>
                                        All Status
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus('draft')}>
                                        Draft
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus('published')}>
                                        Published
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus('processing')}>
                                        Processing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus('completed')}>
                                        Completed
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Priority</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {selectedPriority || 'All Priority'}
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuItem onClick={() => setSelectedPriority('')}>
                                        All Priority
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedPriority('low')}>
                                        Low
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedPriority('medium')}>
                                        Medium
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedPriority('high')}>
                                        High
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedPriority('urgent')}>
                                        Urgent
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Sort By</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {sortBy === 'createdAt' ? 'Created' :
                                            sortBy === 'updatedAt' ? 'Updated' :
                                                sortBy === 'title' ? 'Title' :
                                                    sortBy === 'priority' ? 'Priority' :
                                                        sortBy === 'wordCount' ? 'Word Count' : sortBy}
                                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuItem onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); }}>
                                        Created (Newest)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortBy('createdAt'); setSortOrder('asc'); }}>
                                        Created (Oldest)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortBy('updatedAt'); setSortOrder('desc'); }}>
                                        Updated (Recent)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); }}>
                                        Title (A-Z)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('desc'); }}>
                                        Title (Z-A)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortBy('priority'); setSortOrder('desc'); }}>
                                        Priority (High to Low)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSortBy('wordCount'); setSortOrder('desc'); }}>
                                        Word Count (High to Low)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Reset Filters */}
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                        Reset Filters
                    </Button>
                </CardContent>
            </Card>

            {/* Notes Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data?.notes.map((note: Note) => (
                    <Card key={note.id} className="hover:shadow-lg transition-shadow relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg line-clamp-2 pr-2">
                                    {note.title}
                                </CardTitle>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggleFavorite(note.id, note.isFavorite)}
                                        className="h-8 w-8"
                                    >
                                        {note.isFavorite ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggleBookmark(note.id, note.isBookmarked)}
                                        className="h-8 w-8"
                                    >
                                        {note.isBookmarked ? <Bookmark className="h-4 w-4 fill-blue-400 text-blue-400" /> : <Bookmark className="h-4 w-4" />}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEditNote(note)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={getStatusColor(note.status)}>
                                    {note.status}
                                </Badge>
                                <Badge variant="outline" className={`text-white ${getPriorityColor(note.priority)}`}>
                                    {note.priority}
                                </Badge>
                                {note.duration && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatDuration(note.duration)}
                                    </div>
                                )}
                                {note.reminderAt && (
                                    <Badge variant="outline" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Reminder
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {note.summary && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {note.summary}
                                </p>
                            )}
                            <p className="text-sm line-clamp-3 mb-3">
                                {note.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{note.wordCount} words</span>
                                    <span>{note.readingTime} min read</span>
                                    {note.audioUrl && (
                                        <Badge variant="outline" className="text-xs">
                                            🎤 Voice
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.total > 12 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={
                                    currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>

                        {Array.from({ length: Math.ceil(data.pagination.total / 12) }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(p => p + 1)}
                                className={
                                    !data.pagination.hasMore ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}