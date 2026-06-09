import { create } from 'zustand';
import { SessionRecordSchema } from '@typemaster/contracts/training-state';
import { resolveStoreUpdater, type StoreUpdater } from '../../../store/store-updater';

type SessionRecord = ReturnType<typeof SessionRecordSchema.parse>;
type CoachStatus = 'idle' | 'loading' | 'success' | 'fallback' | 'error';
type CoachIssue = { code?: string, message?: string };

type HistoryUiState = {
    lastCompletedSession: SessionRecord | null,
    coachStatusBySessionId: Record<string, CoachStatus>,
    coachIssueBySessionId: Record<string, CoachIssue | null>,
    setLastCompletedSession: (next: StoreUpdater<SessionRecord | null>) => void,
    setCoachStatusBySessionId: (next: StoreUpdater<Record<string, CoachStatus>>) => void,
    setCoachIssueBySessionId: (next: StoreUpdater<Record<string, CoachIssue | null>>) => void,
    hydrateHistoryUiState: (payload: Partial<Pick<HistoryUiState, 'lastCompletedSession' | 'coachStatusBySessionId' | 'coachIssueBySessionId'>>) => void,
};

export const useHistoryUiStore = create<HistoryUiState>((set) => ({
    lastCompletedSession: null,
    coachStatusBySessionId: {},
    coachIssueBySessionId: {},
    setLastCompletedSession: (next) => set((state) => ({
        lastCompletedSession: resolveStoreUpdater(state.lastCompletedSession, next)
    })),
    setCoachStatusBySessionId: (next) => set((state) => ({
        coachStatusBySessionId: resolveStoreUpdater(state.coachStatusBySessionId, next)
    })),
    setCoachIssueBySessionId: (next) => set((state) => ({
        coachIssueBySessionId: resolveStoreUpdater(state.coachIssueBySessionId, next)
    })),
    hydrateHistoryUiState: (payload) => set((state) => ({
        lastCompletedSession: payload?.lastCompletedSession ?? state.lastCompletedSession,
        coachStatusBySessionId: payload?.coachStatusBySessionId ?? state.coachStatusBySessionId,
        coachIssueBySessionId: payload?.coachIssueBySessionId ?? state.coachIssueBySessionId
    }))
}));
