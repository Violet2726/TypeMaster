CREATE TABLE "challenge_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_id" text NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"display_name" text NOT NULL,
	"level_id" text,
	"wpm" real DEFAULT 0 NOT NULL,
	"accuracy" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"headline" text,
	"summary" text,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weaknesses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"next_drill" jsonb,
	"comparison" jsonb,
	"provider_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_text_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"source_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"date_key" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"draft" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"leaderboard_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text NOT NULL,
	"text" text,
	"completed_session_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"level" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"weak_zones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_from_profile_id" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"draft_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timeline" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"training_context" jsonb,
	"challenge_context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_challenge_id_daily_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."daily_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_feedback" ADD CONSTRAINT "coach_feedback_session_id_typing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."typing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_feedback" ADD CONSTRAINT "coach_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_text_assets" ADD CONSTRAINT "custom_text_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_steps" ADD CONSTRAINT "plan_steps_plan_id_training_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_steps" ADD CONSTRAINT "plan_steps_completed_session_id_typing_sessions_id_fk" FOREIGN KEY ("completed_session_id") REFERENCES "public"."typing_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_profiles" ADD CONSTRAINT "skill_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_generated_from_profile_id_skill_profiles_id_fk" FOREIGN KEY ("generated_from_profile_id") REFERENCES "public"."skill_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_sessions" ADD CONSTRAINT "typing_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_attempts_challenge_score_idx" ON "challenge_attempts" USING btree ("challenge_id","wpm","accuracy");--> statement-breakpoint
CREATE INDEX "challenge_attempts_user_challenge_idx" ON "challenge_attempts" USING btree ("user_id","challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coach_feedback_session_idx" ON "coach_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "coach_feedback_user_created_idx" ON "coach_feedback" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "custom_text_assets_user_created_idx" ON "custom_text_assets" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_challenges_date_key_idx" ON "daily_challenges" USING btree ("date_key");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_steps_plan_order_idx" ON "plan_steps" USING btree ("plan_id","order");--> statement-breakpoint
CREATE INDEX "skill_profiles_user_generated_idx" ON "skill_profiles" USING btree ("user_id","generated_at");--> statement-breakpoint
CREATE INDEX "training_plans_user_status_idx" ON "training_plans" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "typing_sessions_user_created_idx" ON "typing_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");