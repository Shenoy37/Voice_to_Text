import { pgTable, serial, text, timestamp, integer, pgEnum, boolean, jsonb, decimal, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const noteStatusEnum = pgEnum('note_status', ['draft', 'published', 'processing', 'completed', 'failed']);
export const notePriorityEnum = pgEnum('note_priority', ['low', 'medium', 'high', 'urgent']);

// Better Auth Tables
export const authenticators = pgTable("authenticators", {
    id: text("id").notNull().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountName: text("account_name"),
    credentialID: text("credential_id").notNull().unique(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type"),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: text("id").notNull().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users',
    {
        id: text('id').primaryKey(), // Changed from serial to text to match Better Auth
        email: text('email').notNull().unique(),
        name: text('name').notNull(),
        image: text('image'),
        emailVerified: boolean('email_verified').default(false),
        email_verified: boolean('email_verified').default(false), // Add snake_case for Better Auth compatibility
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    });

export const accounts = pgTable("accounts", {
    id: text("id").notNull().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    compoundKey: primaryKey({ columns: [table.providerId, table.accountId] }),
}));

export const verifications = pgTable("verifications", {
    id: text("id").notNull().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});


// Categories table
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull().default('#3B82F6'), // Hex color code
    icon: text('icon').default('📝'), // Emoji icon
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tags table
export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull().default('#10B981'), // Hex color code
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Notes table (enhanced)
export const notes = pgTable('notes', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    summary: text('summary'),
    transcription: text('transcription'),
    audioUrl: text('audio_url'),
    duration: integer('duration'), // Audio duration in seconds
    status: noteStatusEnum('status').default('draft'),
    priority: notePriorityEnum('priority').default('medium'),
    isFavorite: boolean('is_favorite').default(false),
    isBookmarked: boolean('is_bookmarked').default(false),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    reminderAt: timestamp('reminder_at', { withTimezone: true }), // For reminders
    version: integer('version').default(1), // For versioning
    metadata: jsonb('metadata'), // For additional metadata
    wordCount: integer('word_count').default(0),
    readingTime: integer('reading_time').default(0), // Estimated reading time in minutes
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note tags junction table
export const noteTags = pgTable('note_tags', {
    id: serial('id').primaryKey(),
    noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note versions table for history tracking
export const noteVersions = pgTable('note_versions', {
    id: serial('id').primaryKey(),
    noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    summary: text('summary'),
    changeDescription: text('change_description'), // Description of what changed
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note analytics table
export const noteAnalytics = pgTable('note_analytics', {
    id: serial('id').primaryKey(),
    noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    viewCount: integer('view_count').default(0),
    editCount: integer('edit_count').default(0),
    shareCount: integer('share_count').default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    lastEditedAt: timestamp('last_edited_at', { withTimezone: true }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    notes: many(notes),
    categories: many(categories),
    tags: many(tags),
    noteVersions: many(noteVersions),
    noteAnalytics: many(noteAnalytics),
    accounts: many(accounts),
    sessions: many(sessions),
    verifications: many(verifications),
    authenticators: many(authenticators),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, {
        fields: [categories.userId],
        references: [users.id],
    }),
    notes: many(notes),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
    user: one(users, {
        fields: [verifications.identifier],
        references: [users.id],
    }),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
    user: one(users, {
        fields: [authenticators.userId],
        references: [users.id],
    }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
    user: one(users, {
        fields: [tags.userId],
        references: [users.id],
    }),
    noteTags: many(noteTags),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
    user: one(users, {
        fields: [notes.userId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [notes.categoryId],
        references: [categories.id],
    }),
    noteTags: many(noteTags),
    noteVersions: many(noteVersions),
    noteAnalytics: one(noteAnalytics),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
    note: one(notes, {
        fields: [noteTags.noteId],
        references: [notes.id],
    }),
    tag: one(tags, {
        fields: [noteTags.tagId],
        references: [tags.id],
    }),
}));

export const noteVersionsRelations = relations(noteVersions, ({ one }) => ({
    note: one(notes, {
        fields: [noteVersions.noteId],
        references: [notes.id],
    }),
    user: one(users, {
        fields: [noteVersions.userId],
        references: [users.id],
    }),
}));

export const noteAnalyticsRelations = relations(noteAnalytics, ({ one }) => ({
    note: one(notes, {
        fields: [noteAnalytics.noteId],
        references: [notes.id],
    }),
    user: one(users, {
        fields: [noteAnalytics.userId],
        references: [users.id],
    }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type NoteTag = typeof noteTags.$inferSelect;
export type NewNoteTag = typeof noteTags.$inferInsert;
export type NoteVersion = typeof noteVersions.$inferSelect;
export type NewNoteVersion = typeof noteVersions.$inferInsert;
export type NoteAnalytics = typeof noteAnalytics.$inferSelect;
export type NewNoteAnalytics = typeof noteAnalytics.$inferInsert;