CREATE TABLE "players" (
    "id" text PRIMARY KEY NOT NULL,
    "data" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_progress" (
    "player_id" text PRIMARY KEY NOT NULL,
    "data" jsonb NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
    "id" text PRIMARY KEY NOT NULL,
    "player_id" text NOT NULL,
    "mode" text NOT NULL,
    "difficulty" text NOT NULL,
    "seed" text NOT NULL,
    "content_version" integer NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "signature" text NOT NULL,
    "status" text DEFAULT 'started' NOT NULL,
    "result" jsonb,
    "verified" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_progress" (
    "player_id" text PRIMARY KEY NOT NULL,
    "data" jsonb NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_reports" (
    "run_id" text PRIMARY KEY NOT NULL,
    "player_id" text NOT NULL,
    "data" jsonb NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_progress" ADD CONSTRAINT "player_progress_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "mission_progress" ADD CONSTRAINT "mission_progress_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "coach_reports" ADD CONSTRAINT "coach_reports_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "coach_reports" ADD CONSTRAINT "coach_reports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "runs_player_completed_idx" ON "runs" USING btree ("player_id", "completed_at");
--> statement-breakpoint
CREATE INDEX "runs_daily_rank_idx" ON "runs" USING btree ("mode", "verified", "completed_at");
