'use client';

import type { SettingsContract } from '@typerift/contracts';
import { create } from 'zustand';
import { DEFAULT_SETTINGS, readSettings, writeSettings } from '../lib/storage';

type UiState = {
    settingsOpen: boolean;
    profileOpen: boolean;
    settings: SettingsContract;
    hydrated: boolean;
    openSettings: () => void;
    closeSettings: () => void;
    openProfile: () => void;
    closeProfile: () => void;
    hydrate: () => void;
    updateSettings: (patch: Partial<SettingsContract>) => void;
};

export const useUiStore = create<UiState>((set, get) => ({
    settingsOpen: false,
    profileOpen: false,
    settings: DEFAULT_SETTINGS,
    hydrated: false,
    openSettings: () => set({ settingsOpen: true }),
    closeSettings: () => set({ settingsOpen: false }),
    openProfile: () => set({ profileOpen: true }),
    closeProfile: () => set({ profileOpen: false }),
    hydrate: () => set({ settings: readSettings(), hydrated: true }),
    updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        writeSettings(settings);
        set({ settings });
    }
}));
