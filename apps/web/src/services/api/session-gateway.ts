import { SessionsResponseSchema, saveSessionRequestSchema } from '@typemaster/contracts/api';
import { getCurrentUserRecord, readApiFallbackCache, writeApiFallbackCache } from './local-cache';
import { requestJson } from './remote';

export class SessionGateway {
    async saveSession(session) {
        try {
            const payload = await requestJson('/sessions', {
                method: 'POST',
                body: { session },
                requestSchema: saveSessionRequestSchema,
                responseSchema: SessionsResponseSchema
            });
            return { status: 'synced', total: payload.sessions.length };
        } catch {
            const state = readApiFallbackCache();
            const currentUser = getCurrentUserRecord(state);

            if (!currentUser) {
                return { status: 'skipped' };
            }

            currentUser.sessions = [session, ...(currentUser.sessions || []).filter((item) => item.id !== session.id)].slice(0, 200);
            currentUser.lastSyncedAt = new Date().toISOString();
            writeApiFallbackCache(state);

            return { status: 'synced', total: currentUser.sessions.length };
        }
    }

    async listSessions() {
        try {
            const payload = await requestJson('/sessions', {
                responseSchema: SessionsResponseSchema
            });
            return payload.sessions || [];
        } catch {
            const state = readApiFallbackCache();
            const currentUser = getCurrentUserRecord(state);
            return currentUser?.sessions || [];
        }
    }
}
