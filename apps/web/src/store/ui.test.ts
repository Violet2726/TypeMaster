import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../lib/storage';
import { useUiStore } from './ui';

describe('short-lived UI store', () => {
    beforeEach(() => {
        localStorage.clear();
        useUiStore.setState({ settings: DEFAULT_SETTINGS, settingsOpen: false, hydrated: false });
    });
    it('opens and closes the settings sheet', () => {
        useUiStore.getState().openSettings();
        expect(useUiStore.getState().settingsOpen).toBe(true);
        useUiStore.getState().closeSettings();
        expect(useUiStore.getState().settingsOpen).toBe(false);
    });
    it('opens and closes the system profile sheet', () => {
        useUiStore.getState().openProfile();
        expect(useUiStore.getState().profileOpen).toBe(true);
        useUiStore.getState().closeProfile();
        expect(useUiStore.getState().profileOpen).toBe(false);
    });
    it('persists v1 settings only', () => {
        useUiStore.getState().updateSettings({ reduceMotion: true, locale: 'en-US' });
        expect(useUiStore.getState().settings.reduceMotion).toBe(true);
        expect(localStorage.getItem('typerift:v1:settings')).toContain('en-US');
    });
    it('hydrates from strict saved settings', () => {
        localStorage.setItem('typerift:v1:settings', JSON.stringify({ ...DEFAULT_SETTINGS, textScale: 1.4 }));
        useUiStore.getState().hydrate();
        expect(useUiStore.getState().settings.textScale).toBe(1.4);
    });
});
