import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createBuiltinDraft } from '@typemaster/domain';
import { STORAGE_KEYS } from '@typemaster/contracts';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { readLocalPreference, writeLocalPreference } from './json-store';

type StoredSettings = ReturnType<typeof StoredSettingsSchema.parse>;
type DraftOptions = {
    language?: string,
};

export function loadSettings() {
    const saved = readLocalPreference(STORAGE_KEYS.settings, null, StoredSettingsSchema.nullable());
    return {
        ...DEFAULT_SETTINGS,
        ...(saved || {}),
        lastConfig: {
            ...DEFAULT_CONFIG,
            ...((saved && saved.lastConfig) || {})
        }
    };
}

export function saveSettings(settings: StoredSettings) {
    writeLocalPreference(STORAGE_KEYS.settings, settings, StoredSettingsSchema);
}

export function createInitialDraft(config: StoredSettings['lastConfig'], options: DraftOptions = {}) {
    return createBuiltinDraft(config || DEFAULT_CONFIG, options);
}
