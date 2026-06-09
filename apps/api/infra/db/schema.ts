import {
    index,
    integer,
    jsonb,
    pgTable,
    real,
    text,
    timestamp,
    uniqueIndex
} from 'drizzle-orm/pg-core';

const timestamps = {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    clerkUserId: text('clerk_user_id').notNull(),
    displayName: text('display_name').notNull(),
    email: text('email'),
    profile: jsonb('profile').default({}).notNull(),
    ...timestamps
}, (table) => ({
    clerkUserIdIdx: uniqueIndex('users_clerk_user_id_idx').on(table.clerkUserId)
}));

export const typingSessions = pgTable('typing_sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    draftMeta: jsonb('draft_meta').default({}).notNull(),
    configSnapshot: jsonb('config_snapshot').default({}).notNull(),
    result: jsonb('result').default({}).notNull(),
    timeline: jsonb('timeline').default({}).notNull(),
    trainingContext: jsonb('training_context'),
    challengeContext: jsonb('challenge_context'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    userCreatedIdx: index('typing_sessions_user_created_idx').on(table.userId, table.createdAt)
}));

export const coachFeedback = pgTable('coach_feedback', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull().references(() => typingSessions.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    headline: text('headline'),
    summary: text('summary'),
    strengths: jsonb('strengths').default([]).notNull(),
    weaknesses: jsonb('weaknesses').default([]).notNull(),
    nextDrill: jsonb('next_drill'),
    comparison: jsonb('comparison'),
    providerMeta: jsonb('provider_meta').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    sessionIdx: uniqueIndex('coach_feedback_session_idx').on(table.sessionId),
    userCreatedIdx: index('coach_feedback_user_created_idx').on(table.userId, table.createdAt)
}));

export const skillProfiles = pgTable('skill_profiles', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    level: jsonb('level').default({}).notNull(),
    metrics: jsonb('metrics').default({}).notNull(),
    weakZones: jsonb('weak_zones').default([]).notNull(),
    summary: text('summary'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    userGeneratedIdx: index('skill_profiles_user_generated_idx').on(table.userId, table.generatedAt)
}));

export const trainingPlans = pgTable('training_plans', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    status: text('status').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    progress: jsonb('progress').default({}).notNull(),
    generatedFromProfileId: text('generated_from_profile_id').references(() => skillProfiles.id),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    userStatusIdx: index('training_plans_user_status_idx').on(table.userId, table.status)
}));

export const planSteps = pgTable('plan_steps', {
    id: text('id').primaryKey(),
    planId: text('plan_id').notNull().references(() => trainingPlans.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    config: jsonb('config').default({}).notNull(),
    status: text('status').notNull(),
    text: text('text'),
    completedSessionId: text('completed_session_id').references(() => typingSessions.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    planOrderIdx: uniqueIndex('plan_steps_plan_order_idx').on(table.planId, table.order)
}));

export const dailyChallenges = pgTable('daily_challenges', {
    id: text('id').primaryKey(),
    dateKey: text('date_key').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    draft: jsonb('draft').default({}).notNull(),
    config: jsonb('config').default({}).notNull(),
    leaderboardMeta: jsonb('leaderboard_meta').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    dateKeyIdx: uniqueIndex('daily_challenges_date_key_idx').on(table.dateKey)
}));

export const challengeAttempts = pgTable('challenge_attempts', {
    id: text('id').primaryKey(),
    challengeId: text('challenge_id').notNull().references(() => dailyChallenges.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: text('session_id').notNull(),
    displayName: text('display_name').notNull(),
    levelId: text('level_id'),
    wpm: real('wpm').notNull().default(0),
    accuracy: real('accuracy').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    challengeScoreIdx: index('challenge_attempts_challenge_score_idx').on(table.challengeId, table.wpm, table.accuracy),
    userChallengeIdx: index('challenge_attempts_user_challenge_idx').on(table.userId, table.challengeId)
}));

export const customTextAssets = pgTable('custom_text_assets', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    text: text('text').notNull(),
    sourceMeta: jsonb('source_meta').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
    userCreatedIdx: index('custom_text_assets_user_created_idx').on(table.userId, table.createdAt)
}));

export const schema = {
    challengeAttempts,
    coachFeedback,
    customTextAssets,
    dailyChallenges,
    planSteps,
    skillProfiles,
    trainingPlans,
    typingSessions,
    users
};
