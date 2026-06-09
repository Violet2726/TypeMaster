import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './schema';

type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

let database: DatabaseClient | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

export function isPostgresConfigured() {
    return Boolean(process.env.DATABASE_URL);
}

export function createDatabaseClient(databaseUrl = process.env.DATABASE_URL) {
    if (!databaseUrl) {
        return null;
    }

    sqlClient = postgres(databaseUrl, {
        max: Number(process.env.POSTGRES_POOL_SIZE || 5),
        prepare: false
    });
    database = drizzle(sqlClient, { schema });

    return database;
}

export function getDatabase() {
    if (!database) {
        return createDatabaseClient();
    }

    return database;
}

export async function closeDatabase() {
    if (sqlClient) {
        await sqlClient.end({ timeout: 1 });
    }

    sqlClient = null;
    database = null;
}
