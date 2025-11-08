-- Fix users table ID type for Better Auth compatibility
-- This migration changes the users.id from integer to text to match Better Auth requirements

-- First, drop all foreign key constraints that reference users.id
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_users_id_fk;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_user_id_users_id_fk;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_users_id_fk;
ALTER TABLE note_tags DROP CONSTRAINT IF EXISTS note_tags_note_id_notes_fk;
ALTER TABLE note_tags DROP CONSTRAINT IF EXISTS note_tags_tag_id_tags_fk;
ALTER TABLE note_versions DROP CONSTRAINT IF EXISTS note_versions_user_id_users_id_fk;
ALTER TABLE note_analytics DROP CONSTRAINT IF EXISTS note_analytics_user_id_users_id_fk;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_id_users_id_fk;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_users_id_fk;
ALTER TABLE authenticators DROP CONSTRAINT IF EXISTS authenticators_user_id_users_id_fk;
ALTER TABLE verifications DROP CONSTRAINT IF EXISTS verifications_identifier_users_id_fk;

-- Create a temporary text column for user IDs
ALTER TABLE users ADD COLUMN temp_id TEXT;

-- Update the temp_id column with string values of the existing integer IDs
UPDATE users SET temp_id = id::text;

-- Drop the old integer id column
ALTER TABLE users DROP COLUMN id;

-- Rename temp_id to id
ALTER TABLE users RENAME COLUMN temp_id TO id;

-- Make the new id column the primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Add the missing email_verified column for Better Auth compatibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Recreate all foreign key constraints with the new text type
ALTER TABLE categories ADD CONSTRAINT categories_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tags ADD CONSTRAINT tags_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notes ADD CONSTRAINT notes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE note_versions ADD CONSTRAINT note_versions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE note_analytics ADD CONSTRAINT note_analytics_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE authenticators ADD CONSTRAINT authenticators_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE verifications ADD CONSTRAINT verifications_identifier_users_id_fk FOREIGN KEY (identifier) REFERENCES users(id) ON DELETE CASCADE;