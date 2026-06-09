import { SESSION_LIMIT, STORAGE_KEYS } from '@typemaster/contracts';
import { StoredCoachAdviceRecordsSchema } from '@typemaster/contracts/storage';
import { readClientCache, writeClientCache } from './json-store';

type CoachAdviceRecord = ReturnType<typeof StoredCoachAdviceRecordsSchema.parse>[number];

export function loadCoachAdvices() {
    return readClientCache(STORAGE_KEYS.coachAdvices, [], StoredCoachAdviceRecordsSchema);
}

export function saveCoachAdvices(records: CoachAdviceRecord[]) {
    writeClientCache(STORAGE_KEYS.coachAdvices, records.slice(0, SESSION_LIMIT), StoredCoachAdviceRecordsSchema);
}

export function appendCoachAdvice(record: CoachAdviceRecord) {
    const next = [record, ...loadCoachAdvices()].slice(0, SESSION_LIMIT);
    saveCoachAdvices(next);
    return next;
}

export function getCoachAdviceBySessionId(sessionId: string) {
    return loadCoachAdvices().find((record) => record.sessionId === sessionId) || null;
}
