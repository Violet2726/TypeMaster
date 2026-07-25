import { boolean, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
    id: text('id').primaryKey(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const playerProgress = pgTable('player_progress', {
    playerId: text('player_id')
        .primaryKey()
        .references(() => players.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const runs = pgTable(
    'runs',
    {
        id: text('id').primaryKey(),
        playerId: text('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        mode: text('mode').notNull(),
        difficulty: text('difficulty').notNull(),
        seed: text('seed').notNull(),
        contentVersion: integer('content_version').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        signature: text('signature').notNull(),
        status: text('status').notNull().default('started'),
        result: jsonb('result'),
        verified: boolean('verified').notNull().default(false),
        completedAt: timestamp('completed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
    },
    (table) => [
        index('runs_player_completed_idx').on(table.playerId, table.completedAt),
        index('runs_daily_rank_idx').on(table.mode, table.verified, table.completedAt)
    ]
);

export const missionProgress = pgTable('mission_progress', {
    playerId: text('player_id')
        .primaryKey()
        .references(() => players.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const coachReports = pgTable('coach_reports', {
    runId: text('run_id')
        .primaryKey()
        .references(() => runs.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
        .notNull()
        .references(() => players.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
