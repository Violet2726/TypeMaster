import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@typemaster/domain';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { resolveStoreUpdater, type StoreUpdater } from '../../../store/store-updater';

type Settings = ReturnType<typeof StoredSettingsSchema.parse>;

type ShellState = {
    settings: Settings,
    setSettingsState: (next: StoreUpdater<Settings>) => void,
    updateSettings: (patch: Record<string, unknown>) => void,
    hydrateSettings: (settings: Settings | null) => void,
};

export const useShellStore = create<ShellState>((set) => ({
    settings: DEFAULT_SETTINGS,
    setSettingsState: (next) => set((state) => ({
        settings: resolveStoreUpdater(state.settings, next)
    })),
    updateSettings: (patch) => set((state) => ({
        settings: {
            ...state.settings,
            ...patch
        }
    })),
    hydrateSettings: (settings) => set({
        settings: settings || DEFAULT_SETTINGS
    })
}));
