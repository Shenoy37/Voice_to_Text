'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    FileText,
    Clock,
    Star,
    Bookmark,
    TrendingUp,
    Calendar,
    Tag,
    Folder,
    Activity
} from 'lucide-react';

interface AnalyticsData {
    totalNotes: number;
    totalWords: number;
    totalReadingTime: number;
    favoriteNotes: number;
    bookmarkedNotes: number;
    recentNotes: number;
    notesByStatus: Record<string, number>;
    notesByPriority: Record<string, number>;
    notesByCategory: Array<{ name: string; count: number; color: string; icon: string }>;
    topTags: Array<{ name: string; count: number; color: string }>;
    recentActivity: Array<{
        id: number;
        title: string;
        action: string;
        timestamp: string;
    }>;
}

// Mock hook for analytics data (in real app, this would fetch from API)
function useNoteAnalytics() {
    return useQuery({
        queryKey: ['note-analytics'],
        queryFn: async (): Promise<AnalyticsData> => {
            // In a real implementation, this would fetch from your analytics API
            // For now, returning mock data
            return {
                totalNotes: 42,
                totalWords: 15420,
                totalReadingTime: 77, // minutes
                favoriteNotes: 8,
                bookmarkedNotes: 12,
                recentNotes: 5, // notes created in last 7 days
                notesByStatus: {
                    published: 25,
                    draft: 15,
                    processing: 2,
                    completed: 0,
                    failed: 0,
                },
                notesByPriority: {
                    urgent: 3,
                    high: 8,
                    medium: 22,
                    low: 9,
                },
                notesByCategory: [
                    { name: 'Personal', count: 15, color: '#3B82F6', icon: '👤' },
                    { name: 'Work', count: 18, color: '#10B981', icon: '💼' },
                    { name: 'Ideas', count: 9, color: '#F59E0B', icon: '💡' },
                ],
                topTags: [
                    { name: 'important', count: 12, color: '#EF4444' },
                    { name: 'meeting', count: 8, color: '#3B82F6' },
                    { name: 'project', count: 6, color: '#10B981' },
                    { name: 'research', count: 5, color: '#F59E0B' },
                ],
                recentActivity: [
                    { id: 1, title: 'Project Planning', action: 'created', timestamp: '2024-01-15T10:30:00Z' },
                    { id: 2, title: 'Meeting Notes', action: 'updated', timestamp: '2024-01-15T09:15:00Z' },
                    { id: 3, title: 'Research Findings', action: 'favorited', timestamp: '2024-01-14T16:45:00Z' },
                    { id: 4, title: 'Budget Review', action: 'bookmarked', timestamp: '2024-01-14T14:20:00Z' },
                    { id: 5, title: 'Team Updates', action: 'created', timestamp: '2024-01-14T11:00:00Z' },
                ],
            };
        },
    });
}

export default function NoteAnalytics() {
    const [activeTab, setActiveTab] = useState('overview');
    const { data: analytics, isLoading } = useNoteAnalytics();

    if (isLoading) {
        return <div>Loading analytics...</div>;
    }

    if (!analytics) {
        return <div>No analytics data available</div>;
    }

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString();
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'created': return <FileText className="h-4 w-4 text-green-500" />;
            case 'updated': return <Activity className="h-4 w-4 text-blue-500" />;
            case 'favorited': return <Star className="h-4 w-4 text-yellow-500" />;
            case 'bookmarked': return <Bookmark className="h-4 w-4 text-purple-500" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Note Analytics</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="organization">Organization</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.totalNotes}</div>
                                <p className="text-xs text-muted-foreground">
                                    {analytics.recentNotes} created this week
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.totalWords.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    ~{Math.round(analytics.totalWords / analytics.totalNotes)} words per note
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatTime(analytics.totalReadingTime)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total across all notes
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.favoriteNotes}</div>
                                <p className="text-xs text-muted-foreground">
                                    {analytics.bookmarkedNotes} bookmarked
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Status and Priority Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notes by Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(analytics.notesByStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                status === 'published' ? 'default' :
                                                    status === 'draft' ? 'secondary' :
                                                        status === 'processing' ? 'outline' : 'destructive'
                                            }>
                                                {status}
                                            </Badge>
                                        </div>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notes by Priority</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(analytics.notesByPriority).map(([priority, count]) => (
                                    <div key={priority} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={
                                                priority === 'urgent' ? 'bg-red-500 text-white' :
                                                    priority === 'high' ? 'bg-orange-500 text-white' :
                                                        priority === 'medium' ? 'bg-yellow-500 text-white' :
                                                            'bg-green-500 text-white'
                                            }>
                                                {priority}
                                            </Badge>
                                        </div>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Content Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Average Words per Note</span>
                                    <span className="font-medium">
                                        {Math.round(analytics.totalWords / analytics.totalNotes)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Reading Time</span>
                                    <span className="font-medium">{formatTime(analytics.totalReadingTime)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Average Reading Time</span>
                                    <span className="font-medium">
                                        {formatTime(Math.round(analytics.totalReadingTime / analytics.totalNotes))}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Writing Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        <span>Notes created this week: {analytics.recentNotes}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span>Daily average: {Math.round(analytics.recentNotes / 7)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="organization" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notes by Category</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {analytics.notesByCategory.map((category) => (
                                    <div key={category.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span>{category.icon}</span>
                                            <span>{category.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="font-medium">{category.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Top Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {analytics.topTags.map((tag) => (
                                    <div key={tag.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            <span>{tag.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            <span className="font-medium">{tag.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                        {getActionIcon(activity.action)}
                                        <div className="flex-1">
                                            <p className="font-medium">{activity.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {activity.action} on {formatDate(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}