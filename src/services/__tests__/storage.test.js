import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

const SETTINGS_KEY = 'typemaster:v2:settings';
const SESSIONS_KEY = 'typemaster:v2:sessions';
const COACH_ADVICES_KEY = 'typemaster:v2:coach-advices';

const DEFAULT_SETTINGS = {
    theme: 'serika-dark',
    fontScale: 'md',
    focusMode: false,
    soundEffects: false,
    language: 'zh-CN'
};

const DEFAULT_CONFIG = {
    mode: 'time',
    durationSeconds: 30,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false,
    source: 'builtin',
    aiTemplate: 'daily',
    difficulty: 'medium'
};

const MOCK_STORAGE = {};

const mockLocalStorage = {
    getItem: vi.fn((key) => MOCK_STORAGE[key] ?? null),
    setItem: vi.fn((key, value) => {
        MOCK_STORAGE[key] = value;
    }),
    removeItem: vi.fn((key) => {
        delete MOCK_STORAGE[key];
    }),
    clear: vi.fn(() => {
        Object.keys(MOCK_STORAGE).forEach((key) => delete MOCK_STORAGE[key]);
    })
};

function setupGlobalLocalStorage() {
    if (typeof global.window === 'undefined') {
        global.window = {};
    }
    Object.defineProperty(global.window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
    });
}

function clearMockStorage() {
    Object.keys(MOCK_STORAGE).forEach((key) => delete MOCK_STORAGE[key]);
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
}

setupGlobalLocalStorage();

describe('storage.js', () => {
    beforeEach(() => {
        clearMockStorage();
    });

    describe('loadSettings / saveSettings', () => {
        it('returns default settings when localStorage is empty', () => {
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
            expect(result.fontScale).toBe(DEFAULT_SETTINGS.fontScale);
            expect(result.focusMode).toBe(DEFAULT_SETTINGS.focusMode);
            expect(result.soundEffects).toBe(DEFAULT_SETTINGS.soundEffects);
            expect(result.language).toBe(DEFAULT_SETTINGS.language);
        });

        it('returns default settings when localStorage contains null', () => {
            mockLocalStorage.getItem.mockReturnValueOnce(null);
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
        });

        it('returns saved settings when localStorage has valid data', () => {
            const saved = {
                theme: 'nord',
                fontScale: 'lg',
                focusMode: true,
                soundEffects: true,
                language: 'en-US',
                lastConfig: { mode: 'words', durationSeconds: 60 }
            };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(saved));
            const result = loadSettings();
            expect(result.theme).toBe('nord');
            expect(result.fontScale).toBe('lg');
            expect(result.focusMode).toBe(true);
            expect(result.soundEffects).toBe(true);
            expect(result.language).toBe('en-US');
            expect(result.lastConfig.mode).toBe('words');
            expect(result.lastConfig.durationSeconds).toBe(60);
        });

        it('merges missing fields with defaults', () => {
            const saved = { theme: 'monokai' };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(saved));
            const result = loadSettings();
            expect(result.theme).toBe('monokai');
            expect(result.fontScale).toBe(DEFAULT_SETTINGS.fontScale);
            expect(result.focusMode).toBe(DEFAULT_SETTINGS.focusMode);
            expect(result.language).toBe(DEFAULT_SETTINGS.language);
        });

        it('merges missing lastConfig fields with defaults', () => {
            const saved = { theme: 'monokai', lastConfig: { mode: 'words' } };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(saved));
            const result = loadSettings();
            expect(result.lastConfig.mode).toBe('words');
            expect(result.lastConfig.durationSeconds).toBe(DEFAULT_CONFIG.durationSeconds);
            expect(result.lastConfig.wordCount).toBe(DEFAULT_CONFIG.wordCount);
            expect(result.lastConfig.source).toBe(DEFAULT_CONFIG.source);
        });

        it('returns default settings for invalid JSON', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('{ invalid json }');
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
            expect(result.fontScale).toBe(DEFAULT_SETTINGS.fontScale);
        });

        it('returns default settings when JSON parse throws', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('trailing comma {"a":1,}');
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
        });

        it('handles empty string as fallback', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('');
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
        });

        it('handles partial corrupted data gracefully', () => {
            const partial = { theme: null };
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(partial));
            const result = loadSettings();
            expect(result.theme).toBe(null);
            expect(result.fontScale).toBe(DEFAULT_SETTINGS.fontScale);
        });

        it('saves settings successfully', () => {
            const settings = { theme: 'nord', language: 'en-US' };
            saveSettings(settings);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                SETTINGS_KEY,
                JSON.stringify(settings)
            );
        });

        it('swallows QuotaExceededError when saving', () => {
            const quotaError = new Error('QuotaExceededError');
            quotaError.name = 'QuotaExceededError';
            mockLocalStorage.setItem.mockImplementationOnce(() => {
                throw quotaError;
            });
            expect(() => saveSettings({ theme: 'test' })).not.toThrow();
        });

        it('swallows generic error when saving', () => {
            mockLocalStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Unknown storage error');
            });
            expect(() => saveSettings({ theme: 'test' })).not.toThrow();
        });
    });

    describe('loadSessions / saveSessions', () => {
        it('returns empty array when no sessions', () => {
            const result = loadSessions();
            expect(result).toEqual([]);
        });

        it('loads saved sessions array', () => {
            const sessions = [
                { id: 's1', result: { wpm: 50, accuracy: 95 } },
                { id: 's2', result: { wpm: 60, accuracy: 97 } }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(sessions));
            const result = loadSessions();
            expect(result).toEqual(sessions);
        });

        it('returns empty array for invalid JSON', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('not valid json');
            const result = loadSessions();
            expect(result).toEqual([]);
        });

        it('saves sessions and trims to 50 items', () => {
            const sessions = Array.from({ length: 60 }, (_, i) => ({
                id: `s${i}`,
                result: { wpm: i, accuracy: 90 }
            }));
            saveSessions(sessions);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const setCall = mockLocalStorage.setItem.mock.calls[0];
            const saved = JSON.parse(setCall[1]);
            expect(saved.length).toBe(50);
            expect(saved[0].id).toBe('s0');
            expect(saved[49].id).toBe('s49');
        });

        it('saves exactly 50 items when under limit', () => {
            const sessions = Array.from({ length: 30 }, (_, i) => ({
                id: `s${i}`
            }));
            saveSessions(sessions);
            const setCall = mockLocalStorage.setItem.mock.calls[0];
            const saved = JSON.parse(setCall[1]);
            expect(saved.length).toBe(30);
        });
    });

    describe('appendSession', () => {
        it('appends new session to empty list', () => {
            const session = { id: 's1', result: { wpm: 50, accuracy: 95 } };
            const result = appendSession(session);
            expect(result).toEqual([session]);
        });

        it('prepends new session to existing list', () => {
            const existing = [
                { id: 's1', result: { wpm: 50, accuracy: 95 } },
                { id: 's2', result: { wpm: 60, accuracy: 97 } }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(existing));
            const newSession = { id: 's3', result: { wpm: 70, accuracy: 98 } };
            const result = appendSession(newSession);
            expect(result[0].id).toBe('s3');
            expect(result[1].id).toBe('s1');
            expect(result[2].id).toBe('s2');
        });

        it('trims list to 50 items when exceeding limit', () => {
            const existing = Array.from({ length: 50 }, (_, i) => ({
                id: `s${i}`,
                result: { wpm: i }
            }));
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(existing));
            const newSession = { id: 's-new', result: { wpm: 100 } };
            const result = appendSession(newSession);
            expect(result.length).toBe(50);
            expect(result[0].id).toBe('s-new');
            expect(result[49].id).toBe('s48');
            expect(result.some((s) => s.id === 's49')).toBe(false);
        });
    });

    describe('updateSession', () => {
        it('updates matching session by id', () => {
            const sessions = [
                { id: 's1', result: { wpm: 50, accuracy: 95 } },
                { id: 's2', result: { wpm: 60, accuracy: 97 } }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(sessions));
            const result = updateSession('s1', (s) => ({ ...s, result: { ...s.result, wpm: 55 } }));
            expect(result[0].result.wpm).toBe(55);
            expect(result[1].result.wpm).toBe(60);
        });

        it('returns unchanged list when session id not found', () => {
            const sessions = [
                { id: 's1', result: { wpm: 50 } }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(sessions));
            const result = updateSession('s-not-exist', (s) => ({ ...s, updated: true }));
            expect(result).toEqual(sessions);
        });

        it('handles empty sessions gracefully', () => {
            const result = updateSession('s1', (s) => ({ ...s, updated: true }));
            expect(result).toEqual([]);
        });
    });

    describe('loadCoachAdvices / saveCoachAdvices', () => {
        it('returns empty array when no coach advices', () => {
            const result = loadCoachAdvices();
            expect(result).toEqual([]);
        });

        it('loads saved coach advices', () => {
            const advices = [
                { sessionId: 's1', advice: 'Try to maintain a steady pace.' },
                { sessionId: 's2', advice: 'Focus on accuracy over speed.' }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(advices));
            const result = loadCoachAdvices();
            expect(result).toEqual(advices);
        });

        it('returns empty array for invalid JSON', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('corrupted data');
            const result = loadCoachAdvices();
            expect(result).toEqual([]);
        });

        it('saves and trims coach advices to 50 items', () => {
            const advices = Array.from({ length: 60 }, (_, i) => ({
                sessionId: `s${i}`,
                advice: `Advice ${i}`
            }));
            saveCoachAdvices(advices);
            const setCall = mockLocalStorage.setItem.mock.calls[0];
            const saved = JSON.parse(setCall[1]);
            expect(saved.length).toBe(50);
        });
    });

    describe('appendCoachAdvice', () => {
        it('appends new advice to empty list', () => {
            const advice = { sessionId: 's1', advice: 'Keep practicing!' };
            const result = appendCoachAdvice(advice);
            expect(result).toEqual([advice]);
        });

        it('prepends new advice to existing list', () => {
            const existing = [
                { sessionId: 's1', advice: 'First advice' },
                { sessionId: 's2', advice: 'Second advice' }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(existing));
            const newAdvice = { sessionId: 's3', advice: 'New advice' };
            const result = appendCoachAdvice(newAdvice);
            expect(result[0].sessionId).toBe('s3');
            expect(result[1].sessionId).toBe('s1');
        });

        it('trims to 50 items when exceeding limit', () => {
            const existing = Array.from({ length: 50 }, (_, i) => ({
                sessionId: `s${i}`,
                advice: `Advice ${i}`
            }));
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(existing));
            const newAdvice = { sessionId: 's-new', advice: 'New' };
            const result = appendCoachAdvice(newAdvice);
            expect(result.length).toBe(50);
            expect(result[0].sessionId).toBe('s-new');
        });
    });

    describe('getCoachAdviceBySessionId', () => {
        it('returns null when no coach advices', () => {
            const result = getCoachAdviceBySessionId('s1');
            expect(result).toBeNull();
        });

        it('returns matching coach advice by session id', () => {
            const advices = [
                { sessionId: 's1', advice: 'Advice for s1' },
                { sessionId: 's2', advice: 'Advice for s2' }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(advices));
            const result = getCoachAdviceBySessionId('s2');
            expect(result).toEqual({ sessionId: 's2', advice: 'Advice for s2' });
        });

        it('returns null when session id not found', () => {
            const advices = [
                { sessionId: 's1', advice: 'Advice for s1' }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(advices));
            const result = getCoachAdviceBySessionId('s-not-exist');
            expect(result).toBeNull();
        });

        it('returns first match when duplicate session ids exist', () => {
            const advices = [
                { sessionId: 's1', advice: 'First match' },
                { sessionId: 's1', advice: 'Second match' }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(advices));
            const result = getCoachAdviceBySessionId('s1');
            expect(result.advice).toBe('First match');
        });

        it('handles corrupted JSON gracefully', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('not valid json');
            const result = getCoachAdviceBySessionId('s1');
            expect(result).toBeNull();
        });
    });

    describe('createInitialDraft', () => {
        it('creates draft with default config when no config provided', () => {
            const draft = createInitialDraft();
            expect(draft).toBeDefined();
            expect(draft.words).toBeDefined();
            expect(Array.isArray(draft.words)).toBe(true);
        });

        it('creates draft with provided config', () => {
            const config = { source: 'builtin', wordCount: 50 };
            const draft = createInitialDraft(config);
            expect(draft).toBeDefined();
            expect(draft.words).toBeDefined();
        });

        it('creates draft with custom options', () => {
            const draft = createInitialDraft(null, { seed: 123 });
            expect(draft).toBeDefined();
            expect(draft.words).toBeDefined();
        });

        it('sets sourceTextMeta with builtin source', () => {
            const draft = createInitialDraft();
            expect(draft.sourceTextMeta).toBeDefined();
            expect(draft.sourceTextMeta.generatedBy).toBe('builtin');
        });
    });

    describe('edge cases', () => {
        it('handles localStorage.getItem throwing error', () => {
            mockLocalStorage.getItem.mockImplementationOnce(() => {
                throw new Error('Security error');
            });
            const result = loadSettings();
            expect(result).toBeDefined();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
        });

        it('handles localStorage.setItem throwing SecurityError', () => {
            mockLocalStorage.setItem.mockImplementationOnce(() => {
                const error = new Error('SecurityError');
                error.name = 'SecurityError';
                throw error;
            });
            expect(() => saveSettings({ theme: 'test' })).not.toThrow();
        });

        it('handles null value in localStorage', () => {
            mockLocalStorage.getItem.mockImplementationOnce(() => null);
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
        });

        it('handles undefined key returning null', () => {
            mockLocalStorage.getItem.mockImplementationOnce(() => undefined);
            const result = loadSettings();
            expect(result).toBeDefined();
        });

        it('handles numeric value in localStorage (non-string parse)', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('12345');
            const result = loadSettings();
            expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
        });

        it('handles boolean value in localStorage', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('true');
            const result = loadSettings();
            expect(result).toBeDefined();
        });
    });
});
