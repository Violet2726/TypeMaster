# TypeRift Data Retirement

TypeMaster Studio does not import TypeRift or the retired Pulsefield arcade progress. The browser performs a one-time cleanup of the known TypeMaster, Typing Raid, TypeRift, and Pulsefield local-storage prefixes and IndexedDB databases. It preserves unrelated keys on the same origin and retries if an old tab blocks database deletion.

The old local JSON stores in `apps/api/.data` and `apps/api/data/server-state.json` have been removed from this checkout. The retirement SQL in `scripts/purge-typerift-data.sql` drops only the five TypeRift tables and intentionally avoids `CASCADE`, so unexpected references stop the operation rather than remove other objects.

## Online cleanup

1. Verify the target Postgres database belongs to TypeRift, then run the SQL script with that database’s authorized `psql` connection. It removes `coach_reports`, `mission_progress`, `runs`, `player_progress`, and `players`; it does not touch other tables or the Drizzle migration ledger.
2. In the TypeRift-owned Clerk instance, delete its user records or retire the instance. Do not remove accounts from a tenant shared with another application.
3. Remove retired database, Clerk, Redis, Inngest, and AI variables from the old deployment after the data cleanup. If online backups are in scope, remove the project’s provider-managed snapshots through that provider’s control plane.
4. Verify the five tables and the TypeRift Clerk users are absent before reporting the online purge complete.

## Execution status

The repository and app-local JSON data were cleaned, but the online purge could not be run from this environment: no `DATABASE_URL` or Clerk key is configured, and the linked Vercel CLI session rejects its token. The SQL is ready for the TypeRift database owner; Clerk records and provider-managed backups still require access to their project control planes.
