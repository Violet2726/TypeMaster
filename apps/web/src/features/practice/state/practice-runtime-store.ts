import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@typemaster/domain';
import {
    NormalizedTrainingConfigSchema,
    SessionSourceTextMetaSchema
} from '@typemaster/contracts/training-state';
import { resolveStoreUpdater, type StoreUpdater } from '../../../store/store-updater';

type TrainingConfig = ReturnType<typeof NormalizedTrainingConfigSchema.parse>;
type SourceTextMeta = ReturnType<typeof SessionSourceTextMetaSchema.parse>;
type AiPracticeStatus = 'idle' | 'loading' | 'ready' | 'stale' | 'error';
type PracticeError = Error | { code?: string, message?: string } | null;
type PracticeDraft = {
    id: string,
    text: string,
    words: string[],
    configSnapshot: TrainingConfig,
    sourceTextMeta?: SourceTextMeta,
};

const INITIAL_CONFIG = NormalizedTrainingConfigSchema.parse(DEFAULT_CONFIG);

type PracticeRuntimeState = {
    config: TrainingConfig,
    currentDraft: PracticeDraft | null,
    aiPracticeStatus: AiPracticeStatus,
    practiceError: PracticeError,
    setConfigState: (next: StoreUpdater<TrainingConfig>) => void,
    setCurrentDraft: (next: StoreUpdater<PracticeDraft | null>) => void,
    setAiPracticeStatus: (next: AiPracticeStatus) => void,
    setPracticeError: (next: StoreUpdater<PracticeError>) => void,
    hydrateRuntimeState: (payload: Partial<Pick<PracticeRuntimeState, 'config' | 'currentDraft' | 'aiPracticeStatus' | 'practiceError'>>) => void,
};

export const usePracticeRuntimeStore = create<PracticeRuntimeState>((set) => ({
    config: INITIAL_CONFIG,
    currentDraft: null,
    aiPracticeStatus: 'idle',
    practiceError: null,
    setConfigState: (next) => set((state) => ({
        config: resolveStoreUpdater(state.config, next)
    })),
    setCurrentDraft: (next) => set((state) => ({
        currentDraft: resolveStoreUpdater(state.currentDraft, next)
    })),
    setAiPracticeStatus: (next) => set({
        aiPracticeStatus: next
    }),
    setPracticeError: (next) => set((state) => ({
        practiceError: resolveStoreUpdater(state.practiceError, next)
    })),
    hydrateRuntimeState: (payload) => set((state) => ({
        config: payload?.config || state.config,
        currentDraft: payload?.currentDraft ?? state.currentDraft,
        aiPracticeStatus: payload?.aiPracticeStatus || state.aiPracticeStatus,
        practiceError: payload?.practiceError ?? state.practiceError
    }))
}));
