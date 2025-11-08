-- Enhanced notes schema migration
-- This migration adds support for categories, tags, favorites, and other enhanced features

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    icon TEXT DEFAULT '📝',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#10B981',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add new columns to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 0;

-- Create note_tags junction table
CREATE TABLE IF NOT EXISTS note_tags (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(note_id, tag_id)
);

-- Create note_versions table for history tracking
CREATE TABLE IF NOT EXISTS note_versions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    change_description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create note_analytics table
CREATE TABLE IF NOT EXISTS note_analytics (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    edit_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_priority ON notes(priority);
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON notes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_notes_is_bookmarked ON notes(is_bookmarked);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_reminder_at ON notes(reminder_at);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_analytics_note_id ON note_analytics(note_id);

-- Insert default categories for existing users
INSERT INTO categories (name, color, icon, user_id)
SELECT 
    'Personal', '#3B82F6', '👤', id
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE user_id = users.id AND name = 'Personal'
);

INSERT INTO categories (name, color, icon, user_id)
SELECT 
    'Work', '#10B981', '💼', id
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE user_id = users.id AND name = 'Work'
);

INSERT INTO categories (name, color, icon, user_id)
SELECT 
    'Ideas', '#F59E0B', '💡', id
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE user_id = users.id AND name = 'Ideas'
);

-- Update word count and reading time for existing notes
UPDATE notes 
SET 
    word_count = ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(content, '\s+'), 1),
    reading_time = CEIL(ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(content, '\s+'), 1) / 200.0)
WHERE word_count = 0 OR reading_time = 0;

-- Create analytics records for existing notes
INSERT INTO note_analytics (note_id, user_id, view_count, edit_count, share_count)
SELECT 
    id, user_id, 0, 0, 0
FROM notes
WHERE NOT EXISTS (
    SELECT 1 FROM note_analytics WHERE note_id = notes.id
);