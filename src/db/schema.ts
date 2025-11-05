import { pgTable, serial, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const noteStatusEnum = pgEnum('note_status', ['draft', 'published']);

// Users table
export const users = pgTable('users',
    {
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