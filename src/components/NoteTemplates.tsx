'use client';

import { useState } from 'react';
import { useCreateNote } from '@/hooks/useNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileText,
    Plus,
    Calendar,
    Target,
    Lightbulb,
    Briefcase,
    Users,
    BookOpen,
    Star,
    Clock
} from 'lucide-react';

interface NoteTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    content: string;
    summary?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface NoteTemplatesProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const templates: NoteTemplate[] = [
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Structured template for meeting notes with attendees, agenda, and action items',
        icon: <Users className="h-5 w-5" />,
        category: 'Work',
        content: `# Meeting Notes

## Date & Time
[Insert date and time]

## Attendees
- [Name 1]
- [Name 2]
- [Name 3]

## Agenda
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

## Discussion Points
### [Topic 1]
[Key points and decisions]

### [Topic 2]
[Key points and decisions]

## Action Items
- [ ] [Task 1] - [Assigned to] - [Due date]
- [ ] [Task 2] - [Assigned to] - [Due date]
- [ ] [Task 3] - [Assigned to] - [Due date]

## Next Meeting
[Date and time for next meeting]`,
        tags: ['meeting', 'work', 'action-items'],
        priority: 'medium'
    },
    {
        id: 'project-planning',
        name: 'Project Planning',
        description: 'Template for planning new projects with goals, timeline, and resources',
        icon: <Target className="h-5 w-5" />,
        category: 'Work',
        content: `# Project Plan: [Project Name]

## Overview
[Brief description of the project and its objectives]

## Goals & Objectives
### Primary Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

### Success Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]
- [Metric 3]: [Target]

## Timeline
### Phase 1: [Phase Name]
- Start: [Date]
- End: [Date]
- Deliverables: [List of deliverables]

### Phase 2: [Phase Name]
- Start: [Date]
- End: [Date]
- Deliverables: [List of deliverables]

### Phase 3: [Phase Name]
- Start: [Date]
- End: [Date]
- Deliverables: [List of deliverables]

## Resources
### Human Resources
- [Role 1]: [Name]
- [Role 2]: [Name]
- [Role 3]: [Name]

### Budget
- Total Budget: [Amount]
- Allocation: [Breakdown]

### Tools & Software
- [Tool 1]
- [Tool 2]
- [Tool 3]

## Risks & Mitigation
### Risk 1: [Description]
- Probability: [High/Medium/Low]
- Impact: [High/Medium/Low]
- Mitigation: [Strategy]

## Next Steps
- [ ] [Immediate action 1]
- [ ] [Immediate action 2]
- [ ] [Immediate action 3]`,
        tags: ['project', 'planning', 'work'],
        priority: 'high'
    },
    {
        id: 'daily-journal',
        name: 'Daily Journal',
        description: 'Personal journal template for daily reflections and gratitude',
        icon: <BookOpen className="h-5 w-5" />,
        category: 'Personal',
        content: `# Daily Journal - [Date]

## Morning Reflection
### Today's Intention
[What do you want to accomplish or focus on today?]

### Gratitude
I'm grateful for:
- [Thing 1]
- [Thing 2]
- [Thing 3]

### Affirmation
[Positive affirmation for the day]

## Evening Reflection
### Wins & Accomplishments
- [Accomplishment 1]
- [Accomplishment 2]
- [Accomplishment 3]

### Challenges & Lessons
#### Challenge 1: [Description]
What I learned: [Lesson]

#### Challenge 2: [Description]
What I learned: [Lesson]

### Tomorrow's Focus
[What do you want to focus on tomorrow?]

### Mood & Energy
- Mood: [Scale 1-10 or description]
- Energy Level: [Scale 1-10 or description]
- Sleep Quality: [Scale 1-10 or description]

## Notes & Thoughts
[Additional thoughts, ideas, or notes from the day]`,
        tags: ['journal', 'personal', 'reflection'],
        priority: 'low'
    },
    {
        id: 'brainstorm',
        name: 'Brainstorming Session',
        description: 'Template for capturing and organizing ideas during brainstorming',
        icon: <Lightbulb className="h-5 w-5" />,
        category: 'Ideas',
        content: `# Brainstorming Session - [Topic/Theme]

## Core Idea
[Main concept or problem to explore]

## Mind Map / Free Association
### Central Theme: [Main topic]
- Branch 1: [Idea/Connection]
- Branch 2: [Idea/Connection]
- Branch 3: [Idea/Connection]
- Branch 4: [Idea/Connection]

## Questions to Explore
1. [Question 1]
2. [Question 2]
3. [Question 3]
4. [Question 4]

## Potential Solutions / Approaches
### Option A: [Description]
Pros:
- [Pro 1]
- [Pro 2]
Cons:
- [Con 1]
- [Con 2]

### Option B: [Description]
Pros:
- [Pro 1]
- [Pro 2]
Cons:
- [Con 1]
- [Con 2]

### Option C: [Description]
Pros:
- [Pro 1]
- [Pro 2]
Cons:
- [Con 1]
- [Con 2]

## Next Steps
- [ ] Research [specific area]
- [ ] Test [specific approach]
- [ ] Consult with [person/team]
- [ ] Prototype [solution]
- [ ] Review and refine

## Resources Needed
- [Resource 1]
- [Resource 2]
- [Resource 3]

## Follow-up Actions
- [ ] [Action 1] - [Deadline]
- [ ] [Action 2] - [Deadline]
- [ ] [Action 3] - [Deadline]`,
        tags: ['brainstorm', 'ideas', 'planning'],
        priority: 'medium'
    },
    {
        id: 'book-summary',
        name: 'Book Summary',
        description: 'Template for summarizing books with key insights and takeaways',
        icon: <BookOpen className="h-5 w-5" />,
        category: 'Personal',
        content: `# Book Summary: [Book Title]

## Book Information
**Author:** [Author Name]
**Genre:** [Genre]
**Pages:** [Number of pages]
**Read:** [Start date] to [End date]

## Summary
[Brief summary of the book's main plot or content - 2-3 paragraphs]

## Key Characters / Figures
### [Character 1]
- Role: [Their role in the book]
- Key traits: [Personality traits]
- Development: [How they change]

### [Character 2]
- Role: [Their role in the book]
- Key traits: [Personality traits]
- Development: [How they change]

## Main Themes & Ideas
### Theme 1: [Theme name]
[How it's developed in the book]

### Theme 2: [Theme name]
[How it's developed in the book]

### Theme 3: [Theme name]
[How it's developed in the book]

## Key Insights & Takeaways
### Insight 1
[Important lesson or realization]

### Insight 2
[Important lesson or realization]

### Insight 3
[Important lesson or realization]

## Favorite Quotes
> "[Quote 1]" - [Context or chapter]
> "[Quote 2]" - [Context or chapter]
> "[Quote 3]" - [Context or chapter]

## Personal Impact
### How it changed my perspective
[Personal transformation or new understanding]

### Actions I'll take
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

## Rating
**Overall:** [1-5 stars]
**Recommendation:** [Who would enjoy this book?]
**Would re-read:** [Yes/No/Maybe]`,
        tags: ['book', 'summary', 'reading'],
        priority: 'low'
    },
    {
        id: 'quick-note',
        name: 'Quick Note',
        description: 'Simple template for quick thoughts and reminders',
        icon: <FileText className="h-5 w-5" />,
        category: 'General',
        content: `# Quick Note

## Date & Time
[Current date and time]

## Main Point
[Key thought or reminder]

## Details
[Additional information or context]

## Action Required
- [ ] [Task or action item]
- Due: [Date/time if applicable]

## Tags
[Relevant tags for categorization]`,
        tags: ['quick', 'reminder'],
        priority: 'medium'
    }
];

export default function NoteTemplates({ open, onOpenChange }: NoteTemplatesProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
    const [customTitle, setCustomTitle] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const createNoteMutation = useCreateNote();

    const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

    const filteredTemplates = activeCategory === 'all'
        ? templates
        : templates.filter(t => t.category === activeCategory);

    const handleUseTemplate = async (template: NoteTemplate) => {
        try {
            await createNoteMutation.mutateAsync({
                title: customTitle || template.name,
                content: template.content,
                summary: template.description,
                priority: template.priority || 'medium',
                tagIds: [], // Would need to create tags first
            });

            // Reset form
            setSelectedTemplate(null);
            setCustomTitle('');
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating note from template:', error);
            alert('Failed to create note. Please try again.');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Work': return <Briefcase className="h-4 w-4" />;
            case 'Personal': return <Star className="h-4 w-4" />;
            case 'Ideas': return <Lightbulb className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Note Templates</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Category Filter */}
                    <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="all">All</TabsTrigger>
                            {categories.slice(1).map(category => (
                                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                                    {getCategoryIcon(category)}
                                    {category}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="all" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onSelect={() => setSelectedTemplate(template)}
                                        customTitle={customTitle}
                                        onCustomTitleChange={setCustomTitle}
                                    />
                                ))}
                            </div>
                        </TabsContent>

                        {categories.slice(1).map(category => (
                            <TabsContent key={category} value={category} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredTemplates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            onSelect={() => setSelectedTemplate(template)}
                                            customTitle={customTitle}
                                            onCustomTitleChange={setCustomTitle}
                                        />
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Selected Template Detail */}
                    {selectedTemplate && (
                        <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {selectedTemplate.icon}
                                    <div>
                                        <h3 className="font-medium">{selectedTemplate.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    {getCategoryIcon(selectedTemplate.category)}
                                    {selectedTemplate.category}
                                </Badge>
                            </div>

                            {/* Custom Title Input */}
                            <div className="mb-4">
                                <label className="text-sm font-medium mb-2 block">Custom Title (optional)</label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder={selectedTemplate.name}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>

                            {/* Template Preview */}
                            <div className="mb-4">
                                <label className="text-sm font-medium mb-2 block">Preview</label>
                                <div className="border rounded-md p-3 bg-background max-h-40 overflow-y-auto text-sm">
                                    <pre className="whitespace-pre-wrap">{selectedTemplate.content.substring(0, 500)}{selectedTemplate.content.length > 500 ? '...' : ''}</pre>
                                </div>
                            </div>

                            {/* Template Metadata */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{selectedTemplate.content.split(/\s+/).length} words</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedTemplate.priority)}`} />
                                    <span>{selectedTemplate.priority} priority</span>
                                </div>
                                {selectedTemplate.tags && (
                                    <div className="flex gap-1">
                                        {selectedTemplate.tags.map(tag => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedTemplate(null)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleUseTemplate(selectedTemplate)}
                                    disabled={createNoteMutation.isPending}
                                    className="flex-1"
                                >
                                    {createNoteMutation.isPending ? 'Creating...' : 'Use Template'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface TemplateCardProps {
    template: NoteTemplate;
    onSelect: () => void;
    customTitle: string;
    onCustomTitleChange: (title: string) => void;
}

function TemplateCard({ template, onSelect, customTitle, onCustomTitleChange }: TemplateCardProps) {
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onSelect}
        >
            <div className="flex items-start gap-3 mb-3">
                {template.icon}
                <div className="flex-1">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(template.priority)}`} />
            </div>

            <div className="text-xs text-muted-foreground">
                {template.content.split(/\s+/).length} words • {template.category}
            </div>
        </div>
    );
}