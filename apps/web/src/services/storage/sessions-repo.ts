import { SESSION_LIMIT, STORAGE_KEYS } from '@typemaster/contracts';
import { StoredSessionsSchema } from '@typemaster/contracts/storage';
import { readClientCache, writeClientCache } from './json-store';

type SessionRecord = ReturnType<typeof StoredSessionsSchema.parse>[number];

export function loadSessions() {
    return readClientCache(STORAGE_KEYS.sessions, [], StoredSessionsSchema);
}

export function saveSessions(sessions: SessionRecord[]) {
    writeClientCache(STORAGE_KEYS.sessions, sessions.slice(0, SESSION_LIMIT), StoredSessionsSchema);
}

export function appendSession(session: SessionRecord) {
    const current = loadSessions();
    const next = [session, ...current].slice(0, SESSION_LIMIT);
    saveSessions(next);
    return next;
}

export function updateSession(sessionId: string, updater: (session: SessionRecord) => SessionRecord) {
    const next = loadSessions().map((session) => (
        session.id === sessionId ? updater(session) : session
    ));
    saveSessions(next);
    return next;
}
