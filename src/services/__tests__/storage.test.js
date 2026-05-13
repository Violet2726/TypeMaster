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

describe('storage.js', () => {
    // Mock window and localStorage before each test
    beforeEach(() => {
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: vi.fn((key) => store[key] || null),
                setItem: vi.fn((key, value) => { store[key] = value; }),
                removeItem: vi.fn((key) => { delete store[key]; }),
                clear: vi.fn(() => { store = {}; }),
            };
        })();
        // Mock window as a global object
        global.window = {
            localStorage: localStorageMock
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete global.window;
    });

    describe('readJson and writeJson internal helpers', () => {
        it('should read and write JSON correctly', () => {
            const testKey = 'test:key';
            const testValue = { a: 1, b: 'test' };
            
            // Save
            saveSettings({ ...testValue });
            
            // Verify localStorage was called
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'typemaster:v2:settings',
                expect.stringContaining('"a":1')
            );
        });

        it('should fall back to default on invalid JSON', () => {
            window.localStorage.getItem.mockReturnValue('invalid json');
            const result = loadSessions();
            expect(result).toEqual([]);
        });

        it('should fall back to default on null value', () => {
            window.localStorage.getItem.mockReturnValue(null);
            const result = loadSessions();
            expect(result).toEqual([]);
        });

        it('should not throw on write error', () => {
            window.localStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });
            expect(() => saveSettings({ theme: 'dark' })).not.toThrow();
        });
    });

    describe('loadSettings and saveSettings', () => {
        it('should load default settings when nothing saved', () => {
            const settings = loadSettings();
            expect(settings).toHaveProperty('theme');
            expect(settings).toHaveProperty('lastConfig');
        });

        it('should merge saved settings with defaults', () => {
            const customSettings = { theme: 'dark', fontSize: 18 };
            saveSettings(customSettings);
            const loaded = loadSettings();
            expect(loaded.theme).toBe('dark');
            expect(loaded.fontSize).toBe(18);
            expect(loaded.lastConfig).toHaveProperty('source'); // From defaults
        });

        it('should merge lastConfig properly', () => {
            saveSettings({ lastConfig: { source: 'ai' } });
            const loaded = loadSettings();
            expect(loaded.lastConfig.source).toBe('ai');
            expect(loaded.lastConfig).toHaveProperty('wordCount'); // From defaults
        });
    });

    describe('loadSessions and saveSessions', () => {
        it('should load empty array when no sessions saved', () => {
            expect(loadSessions()).toEqual([]);
        });

        it('should save and load sessions', () => {
            const sessions = [{ id: '1', wpm: 60 }];
            saveSessions(sessions);
            expect(loadSessions()).toEqual(sessions);
        });

        it('should limit sessions to 50 entries', () => {
            const manySessions = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
            saveSessions(manySessions);
            expect(loadSessions().length).toBe(50);
        });
    });

    describe('appendSession', () => {
        it('should append session to front', () => {
            saveSessions([{ id: 'old' }]);
            const result = appendSession({ id: 'new' });
            expect(result[0].id).toBe('new');
            expect(result[1].id).toBe('old');
        });

        it('should limit to 50 entries', () => {
            const initialSessions = Array.from({ length: 49 }, (_, i) => ({ id: String(i) }));
            saveSessions(initialSessions);
            
            const result = appendSession({ id: 'new' });
            expect(result.length).toBe(50);
            
            const result2 = appendSession({ id: 'another' });
            expect(result2.length).toBe(50);
        });
    });

    describe('updateSession', () => {
        it('should update matching session', () => {
            saveSessions([{ id: '1', wpm: 50 }, { id: '2', wpm: 60 }]);
            const result = updateSession('1', (s) => ({ ...s, wpm: 70 }));
            expect(result.find(s => s.id === '1').wpm).toBe(70);
            expect(result.find(s => s.id === '2').wpm).toBe(60);
        });

        it('should not modify other sessions', () => {
            saveSessions([{ id: '1' }, { id: '2' }]);
            const result = updateSession('3', (s) => ({ ...s, modified: true }));
            expect(result.length).toBe(2);
        });
    });

    describe('loadCoachAdvices and saveCoachAdvices', () => {
        it('should load empty array when no advices saved', () => {
            expect(loadCoachAdvices()).toEqual([]);
        });

        it('should save and load advices', () => {
            const advices = [{ id: '1', sessionId: 's1', advice: 'test' }];
            saveCoachAdvices(advices);
            expect(loadCoachAdvices()).toEqual(advices);
        });

        it('should limit to 50 entries', () => {
            const manyAdvices = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
            saveCoachAdvices(manyAdvices);
            expect(loadCoachAdvices().length).toBe(50);
        });
    });

    describe('appendCoachAdvice', () => {
        it('should append advice to front', () => {
            saveCoachAdvices([{ id: 'old', sessionId: 's-old' }]);
            const result = appendCoachAdvice({ id: 'new', sessionId: 's-new' });
            expect(result[0].id).toBe('new');
        });
    });

    describe('getCoachAdviceBySessionId', () => {
        it('should find matching advice', () => {
            const advice = { id: 'a1', sessionId: 's1', advice: 'test' };
            saveCoachAdvices([advice]);
            expect(getCoachAdviceBySessionId('s1')).toEqual(advice);
        });

        it('should return null when not found', () => {
            expect(getCoachAdviceBySessionId('nonexistent')).toBeNull();
        });
    });

    describe('createInitialDraft', () => {
        it('should create draft without crashing', () => {
            const draft = createInitialDraft();
            expect(draft).toHaveProperty('words');
            expect(draft).toHaveProperty('configSnapshot');
        });
    });
});
