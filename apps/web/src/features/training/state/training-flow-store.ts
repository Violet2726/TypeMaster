import { create } from 'zustand';
import {
    ActiveSessionContextSchema,
    DiagnosticJourneySchema
} from '@typemaster/contracts/training-state';
import { resolveStoreUpdater, type StoreUpdater } from '../../../store/store-updater';

type DiagnosticJourney = ReturnType<typeof DiagnosticJourneySchema.parse> | null;
type ActiveSessionContext = ReturnType<typeof ActiveSessionContextSchema.parse> | null;

type TrainingFlowState = {
    diagnosticJourney: DiagnosticJourney,
    activeSessionContext: ActiveSessionContext,
    setDiagnosticJourney: (next: StoreUpdater<DiagnosticJourney>) => void,
    setActiveSessionContext: (next: StoreUpdater<ActiveSessionContext>) => void,
    hydrateTrainingFlowState: (payload: Partial<Pick<TrainingFlowState, 'diagnosticJourney' | 'activeSessionContext'>>) => void,
};

export const useTrainingFlowStore = create<TrainingFlowState>((set) => ({
    diagnosticJourney: null,
    activeSessionContext: null,
    setDiagnosticJourney: (next) => set((state) => ({
        diagnosticJourney: resolveStoreUpdater(state.diagnosticJourney, next)
    })),
    setActiveSessionContext: (next) => set((state) => ({
        activeSessionContext: resolveStoreUpdater(state.activeSessionContext, next)
    })),
    hydrateTrainingFlowState: (payload) => set((state) => ({
        diagnosticJourney: payload?.diagnosticJourney ?? state.diagnosticJourney,
        activeSessionContext: payload?.activeSessionContext ?? state.activeSessionContext
    }))
}));
