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

describe('storage', () => {
    // 在 Node 环境中模拟 window.localStorage
    const mockLocalStorage = {
        data: {},
        getItem(key) {
            return this.data[key] || null;
        },
        setItem(key, value) {
            this.data[key] = value;
        },
        removeItem(key) {
            delete this.data[key];
        },
        clear() {
            this.data = {};
        }
    };

    beforeEach(() => {
        mockLocalStorage.clear();
        global.window = {
            localStorage: mockLocalStorage
        };
    });

    describe('readJson / writeJson (internal helper)', () => {
        it('should read and write valid JSON', () => {
            window.localStorage.setItem('test-key', JSON.stringify({ foo: 'bar' }));
            expect(JSON.parse(window.localStorage.getItem('test-key'))).toEqual({ foo: 'bar' });
        });

        it('should handle invalid JSON gracefully', () => {
            window.localStorage.setItem('test-key', 'invalid-json');
            const raw = window.localStorage.getItem('test-key');
            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch {
                parsed = null;
            }
            expect(parsed).toBeNull();
        });

        it('should handle missing keys', () => {
            expect(window.localStorage.getItem('missing-key')).toBeNull();
        });
    });

    describe('loadSettings', () => {
        it('should return default settings when nothing is saved', () => {
            const settings = loadSettings();
            expect(settings).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: {
                    ...DEFAULT_CONFIG
                }
            });
        });

        it('should load saved settings and merge with defaults', () => {
            const savedSettings = {
                theme: 'serika-light',
                lastConfig: {
                    mode: 'words',
                    wordCount: 100
                }
            };
            window.localStorage.setItem('typemaster:v2:settings', JSON.stringify(savedSettings));
            
            const settings = loadSettings();
            expect(settings.theme).toBe('serika-light');
            expect(settings.lastConfig.mode).toBe('words');
            expect(settings.lastConfig.wordCount).toBe(100);
            expect(settings.language).toBe(DEFAULT_SETTINGS.language);
        });

        it('should handle invalid JSON in localStorage', () => {
            window.localStorage.setItem('typemaster:v2:settings', 'invalid-json');
            
            const settings = loadSettings();
            expect(settings).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: {
                    ...DEFAULT_CONFIG
                }
            });
        });

        it('should handle null in localStorage', () => {
            window.localStorage.setItem('typemaster:v2:settings', 'null');
            
            const settings = loadSettings();
            expect(settings).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: {
                    ...DEFAULT_CONFIG
                }
            });
        });

        it('should handle partial settings', () => {
            const savedSettings = {
                language: 'en-US'
            };
            window.localStorage.setItem('typemaster:v2:settings', JSON.stringify(savedSettings));
            
            const settings = loadSettings();
            expect(settings.language).toBe('en-US');
            expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
        });
    });

    describe('saveSettings', () => {
        it('should save settings to localStorage', () => {
            const settings = {
                ...DEFAULT_SETTINGS,
                theme: 'serika-light',
                lastConfig: {
                    ...DEFAULT_CONFIG,
                    mode: 'words'
                }
            };
            
            saveSettings(settings);
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:settings'));
            expect(saved).toEqual(settings);
        });

        it('should handle localStorage errors gracefully', () => {
            const originalSetItem = window.localStorage.setItem;
            window.localStorage.setItem = vi.fn().mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });
            
            expect(() => saveSettings({ ...DEFAULT_SETTINGS })).not.toThrow();
            
            window.localStorage.setItem = originalSetItem;
        });
    });

    describe('loadSessions', () => {
        it('should return empty array when nothing is saved', () => {
            const sessions = loadSessions();
            expect(sessions).toEqual([]);
        });

        it('should load saved sessions', () => {
            const sessions = [{ id: 'session-1', result: { wpm: 60 } }];
            window.localStorage.setItem('typemaster:v2:sessions', JSON.stringify(sessions));
            
            const loaded = loadSessions();
            expect(loaded).toEqual(sessions);
        });

        it('should handle invalid JSON', () => {
            window.localStorage.setItem('typemaster:v2:sessions', 'invalid-json');
            
            const sessions = loadSessions();
            expect(sessions).toEqual([]);
        });
    });

    describe('saveSessions', () => {
        it('should save sessions to localStorage', () => {
            const sessions = [
                { id: 'session-1', result: { wpm: 60 } },
                { id: 'session-2', result: { wpm: 70 } }
            ];
            
            saveSessions(sessions);
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:sessions'));
            expect(saved).toEqual(sessions);
        });

        it('should trim sessions to 50 items', () => {
            const sessions = [];
            for (let i = 0; i < 60; i++) {
                sessions.push({ id: `session-${i}` });
            }
            
            saveSessions(sessions);
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:sessions'));
            expect(saved.length).toBe(50);
            expect(saved[0].id).toBe('session-0');
            expect(saved[49].id).toBe('session-49');
        });
    });

    describe('appendSession', () => {
        it('should append a new session and trim to 50 items', () => {
            const existingSessions = [];
            for (let i = 0; i < 49; i++) {
                existingSessions.push({ id: `session-${i}` });
            }
            window.localStorage.setItem('typemaster:v2:sessions', JSON.stringify(existingSessions));
            
            const newSession = { id: 'session-new' };
            const result = appendSession(newSession);
            
            expect(result.length).toBe(50);
            expect(result[0].id).toBe('session-new');
            expect(result[49].id).toBe('session-48');
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:sessions'));
            expect(saved).toEqual(result);
        });

        it('should prepend new sessions to the front', () => {
            const session1 = { id: 'session-1' };
            window.localStorage.setItem('typemaster:v2:sessions', JSON.stringify([session1]));
            
            const session2 = { id: 'session-2' };
            const result = appendSession(session2);
            
            expect(result[0].id).toBe('session-2');
            expect(result[1].id).toBe('session-1');
        });

        it('should handle when there are no existing sessions', () => {
            const session = { id: 'session-1' };
            const result = appendSession(session);
            
            expect(result).toEqual([session]);
        });
    });

    describe('updateSession', () => {
        it('should update a specific session', () => {
            const sessions = [
                { id: 'session-1', result: { wpm: 60 } },
                { id: 'session-2', result: { wpm: 70 } }
            ];
            window.localStorage.setItem('typemaster:v2:sessions', JSON.stringify(sessions));
            
            const result = updateSession('session-1', (session) => ({
                ...session,
                result: { ...session.result, wpm: 80 }
            }));
            
            expect(result[0].result.wpm).toBe(80);
            expect(result[1].result.wpm).toBe(70);
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:sessions'));
            expect(saved).toEqual(result);
        });

        it('should return unchanged if session is not found', () => {
            const sessions = [
                { id: 'session-1', result: { wpm: 60 } }
            ];
            window.localStorage.setItem('typemaster:v2:sessions', JSON.stringify(sessions));
            
            const result = updateSession('session-not-found', (session) => ({
                ...session,
                updated: true
            }));
            
            expect(result).toEqual(sessions);
        });
    });

    describe('loadCoachAdvices', () => {
        it('should return empty array when nothing is saved', () => {
            const advices = loadCoachAdvices();
            expect(advices).toEqual([]);
        });

        it('should load saved coach advices', () => {
            const advices = [{ id: 'advice-1', sessionId: 'session-1' }];
            window.localStorage.setItem('typemaster:v2:coach-advices', JSON.stringify(advices));
            
            const loaded = loadCoachAdvices();
            expect(loaded).toEqual(advices);
        });

        it('should handle invalid JSON', () => {
            window.localStorage.setItem('typemaster:v2:coach-advices', 'invalid-json');
            
            const advices = loadCoachAdvices();
            expect(advices).toEqual([]);
        });
    });

    describe('saveCoachAdvices', () => {
        it('should save coach advices to localStorage', () => {
            const advices = [
                { id: 'advice-1', sessionId: 'session-1' },
                { id: 'advice-2', sessionId: 'session-2' }
            ];
            
            saveCoachAdvices(advices);
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:coach-advices'));
            expect(saved).toEqual(advices);
        });

        it('should trim advices to 50 items', () => {
            const advices = [];
            for (let i = 0; i < 60; i++) {
                advices.push({ id: `advice-${i}` });
            }
            
            saveCoachAdvices(advices);
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v2:coach-advices'));
            expect(saved.length).toBe(50);
        });
    });

    describe('appendCoachAdvice', () => {
        it('should append a new advice and trim to 50 items', () => {
            const existingAdvices = [];
            for (let i = 0; i < 49; i++) {
                existingAdvices.push({ id: `advice-${i}` });
            }
            window.localStorage.setItem('typemaster:v2:coach-advices', JSON.stringify(existingAdvices));
            
            const newAdvice = { id: 'advice-new' };
            const result = appendCoachAdvice(newAdvice);
            
            expect(result.length).toBe(50);
            expect(result[0].id).toBe('advice-new');
        });
    });

    describe('getCoachAdviceBySessionId', () => {
        it('should find advice by session id', () => {
            const advices = [
                { id: 'advice-1', sessionId: 'session-1' },
                { id: 'advice-2', sessionId: 'session-2' }
            ];
            window.localStorage.setItem('typemaster:v2:coach-advices', JSON.stringify(advices));
            
            const advice = getCoachAdviceBySessionId('session-1');
            expect(advice).toEqual({ id: 'advice-1', sessionId: 'session-1' });
        });

        it('should return null if not found', () => {
            const advices = [{ id: 'advice-1', sessionId: 'session-1' }];
            window.localStorage.setItem('typemaster:v2:coach-advices', JSON.stringify(advices));
            
            const advice = getCoachAdviceBySessionId('session-not-found');
            expect(advice).toBeNull();
        });
    });

    describe('createInitialDraft', () => {
        it('should create initial draft with default config', () => {
            const draft = createInitialDraft();
            expect(draft).toBeDefined();
            expect(draft.words).toBeDefined();
        });

        it('should create initial draft with custom config', () => {
            const config = { mode: 'words', wordCount: 50 };
            const draft = createInitialDraft(config);
            expect(draft).toBeDefined();
        });
    });

    describe('localStorage error handling', () => {
        it('should handle QuotaExceededError when saving', () => {
            const originalSetItem = window.localStorage.setItem;
            window.localStorage.setItem = vi.fn().mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });
            
            expect(() => saveSettings({ ...DEFAULT_SETTINGS })).not.toThrow();
            expect(() => saveSessions([])).not.toThrow();
            expect(() => saveCoachAdvices([])).not.toThrow();
            
            window.localStorage.setItem = originalSetItem;
        });
    });
});
