import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    loadSettings,
    saveSettings,
    loadSessions,
    saveSessions,
    appendSession,
    updateSession,
    loadCoachAdvices,
    saveCoachAdvices,
    appendCoachAdvice,
    getCoachAdviceBySessionId,
    createInitialDraft
} from '../storage';
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from '../../engine';

const MOCK_SETTINGS_KEY = 'typemaster:v2:settings';
const MOCK_SESSIONS_KEY = 'typemaster:v2:sessions';
const MOCK_COACH_KEY = 'typemaster:v2:coach-advices';

function createMockLocalStorage() {
    const store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        }),
        _getStore: () => store,
        _setItem: (key, value) => {
            store[key] = value;
        },
        _reset: () => {
            Object.keys(store).forEach(key => delete store[key]);
        }
    };
}

describe('storage.js', () => {
    let mockLocalStorage;
    let getItemSpy;
    let setItemSpy;

    beforeEach(() => {
        mockLocalStorage = createMockLocalStorage();
        getItemSpy = vi.spyOn(mockLocalStorage, 'getItem');
        setItemSpy = vi.spyOn(mockLocalStorage, 'setItem');

        vi.stubGlobal('window', {
            localStorage: mockLocalStorage
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadSettings', () => {
        it('returns default settings when localStorage is empty', () => {
            const result = loadSettings();
            expect(result).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: DEFAULT_CONFIG
            });
        });

        it('returns saved settings when they exist', () => {
            const saved = {
                theme: 'dark',
                fontSize: 20,
                lastConfig: { source: 'ai', difficulty: 'hard' }
            };
            mockLocalStorage._setItem(MOCK_SETTINGS_KEY, JSON.stringify(saved));

            const result = loadSettings();
            expect(result.theme).toBe('dark');
            expect(result.fontSize).toBe(20);
            expect(result.lastConfig.source).toBe('ai');
            expect(result.lastConfig.difficulty).toBe('hard');
        });

        it('merges missing fields with defaults', () => {
            const saved = { theme: 'dark' };
            mockLocalStorage._setItem(MOCK_SETTINGS_KEY, JSON.stringify(saved));

            const result = loadSettings();
            expect(result.theme).toBe('dark');
            expect(result.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
        });

        it('falls back to defaults when localStorage contains invalid JSON', () => {
            mockLocalStorage._setItem(MOCK_SETTINGS_KEY, '{ invalid json }');

            const result = loadSettings();
            expect(result).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: DEFAULT_CONFIG
            });
        });

        it('falls back to defaults when localStorage contains null', () => {
            mockLocalStorage._setItem(MOCK_SETTINGS_KEY, 'null');

            const result = loadSettings();
            expect(result).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: DEFAULT_CONFIG
            });
        });

        it('falls back to defaults when localStorage contains undefined string', () => {
            mockLocalStorage._setItem(MOCK_SETTINGS_KEY, 'undefined');

            const result = loadSettings();
            expect(result).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: DEFAULT_CONFIG
            });
        });

        it('falls back to defaults when localStorage throws QuotaExceededError', () => {
            getItemSpy.mockImplementationOnce(() => {
                throw new Error('QuotaExceededError');
            });

            const result = loadSettings();
            expect(result).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: DEFAULT_CONFIG
            });
        });

        it('handles partial lastConfig correctly', () => {
            const saved = {
                theme: 'light',
                lastConfig: { source: 'ai' }
            };
            mockLocalStorage._setItem(MOCK_SETTINGS_KEY, JSON.stringify(saved));

            const result = loadSettings();
            expect(result.lastConfig.source).toBe('ai');
            expect(result.lastConfig.difficulty).toBe(DEFAULT_CONFIG.difficulty);
        });
    });

    describe('saveSettings', () => {
        it('saves settings to localStorage successfully', () => {
            const settings = { theme: 'dark', fontSize: 18 };
            saveSettings(settings);

            expect(setItemSpy).toHaveBeenCalledWith(
                MOCK_SETTINGS_KEY,
                JSON.stringify(settings)
            );
        });

        it('handles QuotaExceededError gracefully', () => {
            setItemSpy.mockImplementationOnce(() => {
                throw new Error('QuotaExceededError: DOM Exception 22');
            });

            expect(() => saveSettings({ theme: 'dark' })).not.toThrow();
        });

        it('handles generic storage error gracefully', () => {
            setItemSpy.mockImplementationOnce(() => {
                throw new Error('Unknown storage error');
            });

            expect(() => saveSettings({ theme: 'dark' })).not.toThrow();
        });
    });

    describe('loadSessions', () => {
        it('returns empty array when localStorage is empty', () => {
            const result = loadSessions();
            expect(result).toEqual([]);
        });

        it('returns saved sessions when they exist', () => {
            const sessions = [
                { id: '1', wpm: 50 },
                { id: '2', wpm: 60 }
            ];
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, JSON.stringify(sessions));

            const result = loadSessions();
            expect(result).toEqual(sessions);
        });

        it('falls back to empty array when localStorage contains invalid JSON', () => {
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, 'not valid json');

            const result = loadSessions();
            expect(result).toEqual([]);
        });

        it('falls back to empty array when localStorage contains null', () => {
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, 'null');

            const result = loadSessions();
            expect(result).toEqual([]);
        });
    });

    describe('saveSessions', () => {
        it('saves sessions to localStorage successfully', () => {
            const sessions = [{ id: '1', wpm: 50 }];
            saveSessions(sessions);

            expect(setItemSpy).toHaveBeenCalledWith(
                MOCK_SESSIONS_KEY,
                JSON.stringify(sessions)
            );
        });

        it('trims sessions to 50 items', () => {
            const sessions = Array.from({ length: 60 }, (_, i) => ({
                id: `session-${i}`,
                wpm: i
            }));
            saveSessions(sessions);

            const saved = JSON.parse(mockLocalStorage._getStore()[MOCK_SESSIONS_KEY]);
            expect(saved.length).toBe(50);
            expect(saved[0].id).toBe('session-0');
            expect(saved[49].id).toBe('session-49');
        });

        it('handles QuotaExceededError gracefully', () => {
            setItemSpy.mockImplementationOnce(() => {
                throw new Error('QuotaExceededError');
            });

            expect(() => saveSessions([{ id: '1' }])).not.toThrow();
        });
    });

    describe('appendSession', () => {
        it('appends new session at the beginning', () => {
            const existing = [{ id: '1', wpm: 50 }];
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, JSON.stringify(existing));

            const newSession = { id: '2', wpm: 60 };
            const result = appendSession(newSession);

            expect(result[0]).toEqual(newSession);
            expect(result[1].id).toBe('1');
        });

        it('trims to 50 sessions when exceeding limit', () => {
            const existing = Array.from({ length: 50 }, (_, i) => ({
                id: `existing-${i}`
            }));
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, JSON.stringify(existing));

            const newSession = { id: 'new-session' };
            const result = appendSession(newSession);

            expect(result.length).toBe(50);
            expect(result[0].id).toBe('new-session');
            expect(result[49].id).toBe('existing-48');
        });

        it('returns empty array when no sessions exist and creates one', () => {
            const newSession = { id: 'new-session' };
            const result = appendSession(newSession);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('new-session');
        });

        it('handles empty localStorage gracefully', () => {
            const newSession = { id: 'first-session' };
            const result = appendSession(newSession);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('first-session');
        });
    });

    describe('updateSession', () => {
        it('updates the session with matching id', () => {
            const sessions = [
                { id: '1', wpm: 50 },
                { id: '2', wpm: 60 }
            ];
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, JSON.stringify(sessions));

            const result = updateSession('1', (s) => ({ ...s, wpm: 55 }));

            expect(result[0].wpm).toBe(55);
            expect(result[1].wpm).toBe(60);
        });

        it('returns unchanged array when no session matches id', () => {
            const sessions = [{ id: '1', wpm: 50 }];
            mockLocalStorage._setItem(MOCK_SESSIONS_KEY, JSON.stringify(sessions));

            const result = updateSession('non-existent', (s) => ({ ...s, wpm: 99 }));

            expect(result).toEqual(sessions);
        });

        it('handles empty sessions array', () => {
            const result = updateSession('1', (s) => ({ ...s, wpm: 99 }));

            expect(result).toEqual([]);
        });
    });

    describe('loadCoachAdvices', () => {
        it('returns empty array when localStorage is empty', () => {
            const result = loadCoachAdvices();
            expect(result).toEqual([]);
        });

        it('returns saved coach advices when they exist', () => {
            const advices = [
                { sessionId: '1', advice: 'First' },
                { sessionId: '2', advice: 'Second' }
            ];
            mockLocalStorage._setItem(MOCK_COACH_KEY, JSON.stringify(advices));

            const result = loadCoachAdvices();
            expect(result).toEqual(advices);
        });

        it('falls back to empty array when localStorage contains invalid JSON', () => {
            mockLocalStorage._setItem(MOCK_COACH_KEY, '{ broken json }');

            const result = loadCoachAdvices();
            expect(result).toEqual([]);
        });
    });

    describe('saveCoachAdvices', () => {
        it('saves coach advices to localStorage successfully', () => {
            const advices = [{ sessionId: '1', advice: 'Test' }];
            saveCoachAdvices(advices);

            expect(setItemSpy).toHaveBeenCalledWith(
                MOCK_COACH_KEY,
                JSON.stringify(advices)
            );
        });

        it('trims advices to 50 items', () => {
            const advices = Array.from({ length: 60 }, (_, i) => ({
                sessionId: `session-${i}`,
                advice: `advice-${i}`
            }));
            saveCoachAdvices(advices);

            const saved = JSON.parse(mockLocalStorage._getStore()[MOCK_COACH_KEY]);
            expect(saved.length).toBe(50);
        });
    });

    describe('appendCoachAdvice', () => {
        it('appends new advice at the beginning', () => {
            const existing = [
                { sessionId: '1', advice: 'First' }
            ];
            mockLocalStorage._setItem(MOCK_COACH_KEY, JSON.stringify(existing));

            const newAdvice = { sessionId: '2', advice: 'Second' };
            const result = appendCoachAdvice(newAdvice);

            expect(result[0]).toEqual(newAdvice);
            expect(result[1].sessionId).toBe('1');
        });

        it('trims to 50 advices when exceeding limit', () => {
            const existing = Array.from({ length: 50 }, (_, i) => ({
                sessionId: `existing-${i}`,
                advice: `advice-${i}`
            }));
            mockLocalStorage._setItem(MOCK_COACH_KEY, JSON.stringify(existing));

            const newAdvice = { sessionId: 'new', advice: 'new advice' };
            const result = appendCoachAdvice(newAdvice);

            expect(result.length).toBe(50);
            expect(result[0].sessionId).toBe('new');
        });
    });

    describe('getCoachAdviceBySessionId', () => {
        it('returns advice when sessionId matches', () => {
            const advices = [
                { sessionId: '1', advice: 'First' },
                { sessionId: '2', advice: 'Second' }
            ];
            mockLocalStorage._setItem(MOCK_COACH_KEY, JSON.stringify(advices));

            const result = getCoachAdviceBySessionId('1');
            expect(result.advice).toBe('First');
        });

        it('returns null when no sessionId matches', () => {
            const advices = [{ sessionId: '1', advice: 'First' }];
            mockLocalStorage._setItem(MOCK_COACH_KEY, JSON.stringify(advices));

            const result = getCoachAdviceBySessionId('non-existent');
            expect(result).toBeNull();
        });

        it('returns null when localStorage is empty', () => {
            const result = getCoachAdviceBySessionId('1');
            expect(result).toBeNull();
        });
    });

    describe('createInitialDraft', () => {
        it('creates draft using builtin draft generator', () => {
            const config = { ...DEFAULT_CONFIG };
            const draft = createInitialDraft(config);

            expect(draft).toBeDefined();
            expect(draft.text).toBeDefined();
            expect(draft.words).toBeDefined();
            expect(Array.isArray(draft.words)).toBe(true);
        });

        it('uses default config when none provided', () => {
            const draft = createInitialDraft();

            expect(draft).toBeDefined();
            expect(draft.text).toBeDefined();
        });

        it('passes options to draft generator', () => {
            const config = { ...DEFAULT_CONFIG };
            const options = { seed: 12345 };
            const draft = createInitialDraft(config, options);

            expect(draft).toBeDefined();
        });
    });
});
