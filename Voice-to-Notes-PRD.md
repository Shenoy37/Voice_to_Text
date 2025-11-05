# Voice-to-Notes Application - Complete PRD & Implementation Guide

## Project Overview

Build a voice-to-notes application with the following tech stack:
- **Frontend**: Next.js 14+ with TypeScript
- **Backend**: Next.js API routes
- **Database**: Postgres with Neon
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **UI**: ShadCN with neutral gray theme
- **State Management**: TanStack Query for pagination
- **Voice Processing**: OpenAI Whisper API
- **Deployment**: Vercel (recommended)

## Core Features

1. **User Authentication** with Google OAuth via Better Auth
2. **Voice Recording & Transcription** using OpenAI Whisper API
3. **AI-powered Summarization** of transcriptions
4. **CRUD Operations** for notes (Create, Read, Update, Delete)
5. **Paginated Notes Display** with TanStack Query
6. **Beautiful Neutral UI** with ShadCN components
7. **Incremental Text Editing** after initial voice recording

---

## Step-by-Step Implementation Guide

### Phase 1: Project Setup

#### 1.1 Initialize Next.js TypeScript Project

```bash
# Create new Next.js app with TypeScript
npx create-next-app@latest voice-to-notes --typescript --tailwind --eslint --app
cd voice-to-notes

# Install additional dependencies
npm install @types/node
```

#### 1.2 Environment Variables Setup

Create `.env.local`:
```env
# Database
DATABASE_URL="your_neon_database_url_here"

# OpenAI
OPENAI_API_KEY="your_openai_api_key_here"

# Better Auth
BETTER_AUTH_SECRET="your_auth_secret_here"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

Create `.env.example`:
```env
DATABASE_URL=""
OPENAI_API_KEY=""
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

#### 1.3 Install Core Dependencies

```bash
# Database & ORM
npm install drizzle-orm drizzle-kit @neondatabase/serverless

# Authentication
npm install better-auth

# UI Components
npm install @radix-ui/react-icons lucide-react
npx shadcn@latest init

# State Management
npm install @tanstack/react-query

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# File Upload & Audio
npm install react-dropzone

# Date handling
npm install date-fns
```

---

### Phase 2: Database Setup with Drizzle ORM

#### 2.1 Configure Drizzle

Create `drizzle.config.ts`:
```typescript
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### 2.2 Create Database Schema

Create `src/db/schema.ts`:
```typescript
import { pgTable, serial, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const noteStatusEnum = pgEnum('note_status', ['draft', 'published']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Notes table
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  transcription: text('transcription'),
  audioUrl: text('audio_url'),
  duration: integer('duration'), // Audio duration in seconds
  status: noteStatusEnum('status').default('draft'),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
```

#### 2.3 Database Connection

Create `src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

#### 2.4 Run Migrations

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Or for development (push schema directly)
npx drizzle-kit push
```

---

### Phase 3: Authentication Setup with Better Auth

#### 3.1 Configure Better Auth

Create `src/lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { neonAdapter } from "better-auth/adapters/neon";
import { db } from "@/db";
import { users } from "@/db/schema";

export const auth = betterAuth({
  database: neonAdapter(db, {
    provider: "neon",
    schema: {
      users: users,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

#### 3.2 Create Auth API Routes

Create `src/app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler;
```

#### 3.3 Auth Client Configuration

Create `src/lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
```

---

### Phase 4: ShadCN UI Setup with Neutral Theme

#### 4.1 Initialize ShadCN

```bash
npx shadcn@latest init
```

During initialization, select:
- **TypeScript**: Yes
- **Style**: Default
- **Base Color**: Zinc (for neutral theme)
- **Global CSS file**: `./src/app/globals.css`
- **CSS variables**: Yes

#### 4.2 Install Required Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add pagination
npx shadcn@latest add dialog
npx shadcn@latest add separator
npx shadcn@latest add badge
npx shadcn@latest add dropdown-menu
npx shadcn@latest add scroll-area
npx shadcn@latest add sheet
```

#### 4.3 Configure Neutral Theme

Update `src/app/globals.css`:
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}
```

---

### Phase 5: Voice Recording & Transcription

#### 5.1 Create Voice Recorder Component

Create `src/components/VoiceRecorder.tsx`:
```typescript
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
        className={`w-24 h-24 rounded-full ${
          isRecording ? 'bg-red-500 hover:bg-red-600' : ''
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
```

#### 5.2 Create Transcription API Route

Create `src/app/api/transcribe-and-summarize/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure temp directory exists
async function ensureTempDir() {
  const tempDir = join(process.cwd(), 'temp');
  await mkdir(tempDir, { recursive: true });
}

export async function POST(request: NextRequest) {
  await ensureTempDir();

  try {
    const data = await request.formData();
    const file: File | null = data.get('audioFile') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a',
      'audio/wav', 'audio/webm', 'audio/flac', 'audio/aac', 'audio/ogg'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Create temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const tempPath = join(process.cwd(), 'temp', `${uniqueId}-${file.name}`);

    await writeFile(tempPath, buffer);

    try {
      // Transcribe audio
      const transcription = await openai.audio.transcriptions.create({
        file: require('fs').createReadStream(tempPath),
        model: 'whisper-1',
        response_format: 'json',
        language: 'en',
        temperature: 0.0,
      });

      const transcriptionText = transcription.text;

      // Generate summary
      let summary = '';
      if (transcriptionText.trim()) {
        const summaryResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates concise, accurate summaries of transcribed audio content. Create a summary that is 2-4 sentences long and captures the key information.'
            },
            {
              role: 'user',
              content: `Please summarize this text:\n\n"${transcriptionText}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
        });

        summary = summaryResponse.choices[0]?.message?.content || '';
      }

      // Clean up temporary file
      await unlink(tempPath);

      return NextResponse.json({
        success: true,
        data: {
          transcription: transcriptionText,
          summary: summary,
        }
      });

    } catch (openaiError) {
      // Clean up temporary file on error
      await unlink(tempPath).catch(() => {});
      throw openaiError;
    }

  } catch (error) {
    console.error('Transcription error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

---

### Phase 6: Notes CRUD Operations

#### 6.1 Create Notes API Routes

Create `src/app/api/notes/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET - Fetch user's notes with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const userNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        summary: notes.summary,
        transcription: notes.transcription,
        audioUrl: notes.audioUrl,
        duration: notes.duration,
        status: notes.status,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(eq(notes.userId, parseInt(session.user.id)))
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: notes.id })
      .from(notes)
      .where(eq(notes.userId, parseInt(session.user.id)));

    return NextResponse.json({
      notes: userNotes,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        hasMore: offset + userNotes.length < totalCount.length,
      },
    });

  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new note
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, summary, transcription, audioUrl, duration } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const [newNote] = await db.insert(notes)
      .values({
        title,
        content,
        summary,
        transcription,
        audioUrl,
        duration,
        userId: parseInt(session.user.id),
      })
      .returning();

    return NextResponse.json({ note: newNote }, { status: 201 });

  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/notes/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// PUT - Update note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, status } = await request.json();
    const noteId = parseInt(params.id);

    const [updatedNote] = await db.update(notes)
      .set({
        title,
        content,
        status,
        updatedAt: new Date(),
      })
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, parseInt(session.user.id))
      ))
      .returning();

    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ note: updatedNote });

  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteId = parseInt(params.id);

    const deletedNote = await db.delete(notes)
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, parseInt(session.user.id))
      ))
      .returning();

    if (!deletedNote.length) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted successfully' });

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Phase 7: Frontend Components with TanStack Query

#### 7.1 Setup Query Provider

Create `src/components/QueryProvider.tsx`:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 7.2 Create Notes Hook

Create `src/hooks/useNotes.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Note {
  id: number;
  title: string;
  content: string;
  summary?: string;
  transcription?: string;
  audioUrl?: string;
  duration?: number;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function useNotes(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['notes', page, limit],
    queryFn: async (): Promise<NotesResponse> => {
      const response = await fetch(`/api/notes?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      return response.json();
    },
    keepPreviousData: true,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      title: string;
      content: string;
      summary?: string;
      transcription?: string;
      audioUrl?: string;
      duration?: number;
    }) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      status
    }: {
      id: number;
      title: string;
      content: string;
      status?: 'draft' | 'published';
    }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
```

#### 7.3 Create Notes List Component

Create `src/components/NotesList.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useNotes, useDeleteNote } from '@/hooks/useNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotesList() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useNotes(currentPage, 10);
  const deleteNoteMutation = useDeleteNote();

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNoteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleEditNote = (note: any) => {
    // This would open an edit dialog/modal
    console.log('Edit note:', note);
  };

  if (isLoading) return <div>Loading notes...</div>;
  if (error) return <div>Error loading notes</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.notes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">
                  {note.title}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditNote(note)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={deleteNoteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={note.status === 'published' ? 'default' : 'secondary'}>
                  {note.status}
                </Badge>
                {note.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {Math.floor(note.duration / 60)}:{(note.duration % 60).toString().padStart(2, '0')}
                  </div>
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
                {note.audioUrl && (
                  <Badge variant="outline" className="text-xs">
                    🎤 Voice
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.total > 10 && (
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

            {Array.from({ length: Math.ceil(data.pagination.total / 10) }, (_, i) => i + 1).map((page) => (
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
```

---

### Phase 8: Main Application Layout

#### 8.1 Create Note Creation Modal

Create `src/components/CreateNoteModal.tsx`:
```typescript
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
```

#### 8.2 Update Main Layout

Update `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice to Notes',
  description: 'Transform your voice into organized notes with AI-powered transcription and summarization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

#### 8.3 Create Main Page

Update `src/app/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'better-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateNoteModal from '@/components/CreateNoteModal';
import NotesList from '@/components/NotesList';
import { Plus, LogIn, LogOut, Mic, FileText } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: session, isPending } = useSession();

  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
  };

  const handleLogout = async () => {
    await authClient.signOut();
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
                <Mic className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Voice to Notes
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Transform your voice into organized notes with AI-powered transcription and summarization.
                Record, transcribe, and organize your thoughts effortlessly.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Record your voice using our intuitive interface.
                    Supports multiple audio formats for maximum flexibility.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    AI Transcription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Powered by OpenAI Whisper for accurate transcription
                    and intelligent summarization of your recordings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Organize & Edit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Edit and organize your notes with our beautiful interface.
                    Search, paginate, and manage your thoughts efficiently.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleLogin}
              size="lg"
              className="px-8"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Voice to Notes</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={session.user.image || ''}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Notes</h2>
              <p className="text-gray-600 mt-1">
                Manage your voice-recorded notes and transcriptions
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <NotesList />
      </main>

      {/* Create Note Modal */}
      <CreateNoteModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
```

---

### Phase 9: Final Setup & Configuration

#### 9.1 Create Auth Provider

Create `src/components/AuthProvider.tsx`:
```typescript
'use client';

import { BetterAuthProvider  } from 'better-auth/react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <BetterAuthProvider >
      {children}
    </BetterAuthProvider >
  );
}
```

#### 9.2 Update package.json Scripts

Update your `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

#### 9.3 Add TypeScript Configuration

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Testing & Development

### Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** in `.env.local`:
   ```env
   DATABASE_URL="your_neon_database_url"
   OPENAI_API_KEY="your_openai_api_key"
   BETTER_AUTH_SECRET="your_auth_secret"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

3. **Run database migrations**:
   ```bash
   npm run db:push  // done
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

### Key Features Testing

1. **Authentication**: Test Google OAuth login/logout
2. **Voice Recording**: Test microphone access and recording
3. **Transcription**: Test audio-to-text conversion
4. **CRUD Operations**: Test create, read, update, delete notes
5. **Pagination**: Test notes pagination with multiple pages
6. **UI/UX**: Test responsive design and dark mode

---

## Deployment Guide

### Vercel Deployment (Recommended)

1. **Create Vercel account** and connect your GitHub repository

2. **Set environment variables** in Vercel dashboard:
   ```
   DATABASE_URL=your_neon_database_url
   OPENAI_API_KEY=your_openai_api_key
   BETTER_AUTH_SECRET=your_auth_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.vercel.app
   ```

3. **Configure domain** and deploy

### Alternative Deployment Options

- **Netlify**: Similar setup with environment variables
- **Railway**: Full-stack deployment with database
- **DigitalOcean App Platform**: Custom deployment
- **Self-hosted**: VPS with Docker

---

## Future Enhancements

### Potential Features
1. **Real-time collaboration** on notes
2. **Advanced search** with filters and tags
3. **Note categories** and folders
4. **Export functionality** (PDF, Markdown, etc.)
5. **Mobile app** (React Native)
6. **Offline support** with service workers
7. **Advanced AI features** (note analysis, suggestions)
8. **Voice commands** for navigation
9. **Integration** with other productivity tools
10. **Team features** and sharing

### Performance Optimizations
1. **Audio compression** before upload
2. **Caching** for transcriptions
3. **Lazy loading** for notes
4. **Background processing** for transcription
5. **Database indexing** optimization

---

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Check browser permissions
   - Use HTTPS in production

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Neon database status

3. **OpenAI API Errors**
   - Verify API key and credits
   - Check rate limits

4. **Authentication Issues**
   - Verify Google OAuth configuration
   - Check callback URLs

5. **Build Errors**
   - Check TypeScript configuration
   - Verify all dependencies installed

### Debugging Tips

1. Check browser console for errors
2. Use React Query DevTools for state debugging
3. Check Network tab for API calls
4. Use Drizzle Studio for database debugging
5. Enable verbose logging in development

---

## Conclusion

This PRD provides a comprehensive guide to building a voice-to-notes application with modern web technologies. The application leverages AI for voice transcription and summarization, provides a beautiful and intuitive user interface, and includes all essential features for personal note management.

The architecture is scalable and maintainable, with clear separation of concerns and proper error handling throughout. The neutral gray theme with ShadCN components provides a professional and distraction-free environment for users to focus on their content.

With this implementation, users can efficiently capture their thoughts through voice recording, have them automatically transcribed and summarized, and organize them in a clean, paginated interface.