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
    createInitialDraft,
    loadSkillProfile,
    saveSkillProfile,
    loadTrainingPlan,
    saveTrainingPlan,
    loadDiagnosticJourney,
    saveDiagnosticJourney,
    loadActiveSessionContext,
    saveActiveSessionContext,
    hydrateClientCache,
    readClientCache,
    readLocalPreference,
    resetClientCacheForTests,
    writeClientCache,
    writeLocalPreference
} from '../storage';
import { STORAGE_KEYS } from '@typemaster/contracts';
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from '@typemaster/domain';

describe('storage', () => {
    // Mock window.localStorage in the Node test environment.
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

    let warnSpy;

    beforeEach(() => {
        resetClientCacheForTests();
        mockLocalStorage.clear();
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        global.window = {
            localStorage: mockLocalStorage
        };
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    describe('local preference and client cache helpers', () => {
        it('should read and write valid JSON', () => {
            writeLocalPreference('test-key', { foo: 'bar' });
            expect(readLocalPreference('test-key', null)).toEqual({ foo: 'bar' });
        });

        it('should handle invalid JSON gracefully', () => {
            window.localStorage.setItem('test-key', 'invalid-json');
            expect(readLocalPreference('test-key', null)).toBeNull();
        });

        it('should handle missing keys', () => {
            expect(readLocalPreference('missing-key', null)).toBeNull();
        });

        it('should keep client cache outside localStorage writes', () => {
            writeClientCache('typemaster:v5:sessions-cache', [{ id: 'session-1' }]);

            expect(readClientCache('typemaster:v5:sessions-cache', [])).toEqual([{ id: 'session-1' }]);
            expect(window.localStorage.getItem('typemaster:v5:sessions-cache')).toBeNull();
        });

        it('should ignore and remove obsolete localStorage client cache keys', async () => {
            window.localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify([{ id: 'legacy-session' }]));

            await hydrateClientCache();

            expect(loadSessions()).toEqual([]);
            expect(window.localStorage.getItem(STORAGE_KEYS.sessions)).toBeNull();
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
            window.localStorage.setItem('typemaster:v5:preferences', JSON.stringify(savedSettings));
            
            const settings = loadSettings();
            expect(settings.theme).toBe('serika-light');
            expect(settings.lastConfig.mode).toBe('words');
            expect(settings.lastConfig.wordCount).toBe(100);
            expect(settings.language).toBe(DEFAULT_SETTINGS.language);
        });

        it('should handle invalid JSON in localStorage', () => {
            window.localStorage.setItem('typemaster:v5:preferences', 'invalid-json');
            
            const settings = loadSettings();
            expect(settings).toEqual({
                ...DEFAULT_SETTINGS,
                lastConfig: {
                    ...DEFAULT_CONFIG
                }
            });
        });

        it('should handle null in localStorage', () => {
            window.localStorage.setItem('typemaster:v5:preferences', 'null');
            
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
            window.localStorage.setItem('typemaster:v5:preferences', JSON.stringify(savedSettings));
            
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
            
            const saved = JSON.parse(window.localStorage.getItem('typemaster:v5:preferences'));
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
            const sessions = [{
                id: 'session-1',
                result: {
                    accuracy: 0,
                    consistency: 0,
                    correctChars: 0,
                    durationSeconds: 0,
                    errors: 0,
                    extraChars: 0,
                    incorrectChars: 0,
                    missedChars: 0,
                    rawWpm: 0,
                    wpm: 60,
                    topErrorChars: [],
                    topErrorWords: []
                }
            }];
            writeClientCache(STORAGE_KEYS.sessions, sessions);
            
            const loaded = loadSessions();
            expect(loaded).toEqual(sessions);
        });

        it('should fall back when cached sessions are not an array', () => {
            writeClientCache(STORAGE_KEYS.sessions, 'invalid-cache-payload');
            
            const sessions = loadSessions();
            expect(sessions).toEqual([]);
        });

        it('should fall back when stored sessions break the shared contract', () => {
            writeClientCache(STORAGE_KEYS.sessions, [{ result: { wpm: 60 } }]);

            const sessions = loadSessions();
            expect(sessions).toEqual([]);
        });
    });

    describe('saveSessions', () => {
        it('should save sessions to client cache', () => {
            const sessions = [
                {
                    id: 'session-1',
                    result: {
                        accuracy: 0,
                        consistency: 0,
                        correctChars: 0,
                        durationSeconds: 0,
                        errors: 0,
                        extraChars: 0,
                        incorrectChars: 0,
                        missedChars: 0,
                        rawWpm: 0,
                        wpm: 60,
                        topErrorChars: [],
                        topErrorWords: []
                    }
                },
                {
                    id: 'session-2',
                    result: {
                        accuracy: 0,
                        consistency: 0,
                        correctChars: 0,
                        durationSeconds: 0,
                        errors: 0,
                        extraChars: 0,
                        incorrectChars: 0,
                        missedChars: 0,
                        rawWpm: 0,
                        wpm: 70,
                        topErrorChars: [],
                        topErrorWords: []
                    }
                }
            ];
            
            saveSessions(sessions);
            
            const saved = loadSessions();
            expect(saved).toEqual(sessions);
        });

        it('should trim sessions to 50 items', () => {
            const sessions = [];
            for (let i = 0; i < 60; i++) {
                sessions.push({ id: `session-${i}` });
            }
            
            saveSessions(sessions);
            
            const saved = loadSessions();
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
            writeClientCache(STORAGE_KEYS.sessions, existingSessions);
            
            const newSession = { id: 'session-new' };
            const result = appendSession(newSession);
            
            expect(result.length).toBe(50);
            expect(result[0].id).toBe('session-new');
            expect(result[49].id).toBe('session-48');
            
            const saved = loadSessions();
            expect(saved).toEqual(result);
        });

        it('should prepend new sessions to the front', () => {
            const session1 = { id: 'session-1' };
            writeClientCache(STORAGE_KEYS.sessions, [session1]);
            
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
            writeClientCache(STORAGE_KEYS.sessions, sessions);
            
            const result = updateSession('session-1', (session) => ({
                ...session,
                result: { ...session.result, wpm: 80 }
            }));
            
            expect(result[0].result.wpm).toBe(80);
            expect(result[1].result.wpm).toBe(70);
            
            const saved = loadSessions();
            expect(saved).toEqual(result);
        });

        it('should return unchanged if session is not found', () => {
            const sessions = [
                {
                    id: 'session-1',
                    result: {
                        accuracy: 0,
                        consistency: 0,
                        correctChars: 0,
                        durationSeconds: 0,
                        errors: 0,
                        extraChars: 0,
                        incorrectChars: 0,
                        missedChars: 0,
                        rawWpm: 0,
                        wpm: 60,
                        topErrorChars: [],
                        topErrorWords: []
                    }
                }
            ];
            writeClientCache(STORAGE_KEYS.sessions, sessions);
            
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
            const advices = [{ id: 'advice-1', sessionId: 'session-1', strengths: [], weaknesses: [] }];
            writeClientCache(STORAGE_KEYS.coachAdvices, advices);
            
            const loaded = loadCoachAdvices();
            expect(loaded).toEqual([{
                id: 'advice-1',
                sessionId: 'session-1',
                status: 'complete',
                strengths: [],
                weaknesses: [],
                providerMeta: {}
            }]);
        });

        it('should fall back when cached coach advices are not an array', () => {
            writeClientCache(STORAGE_KEYS.coachAdvices, 'invalid-cache-payload');
            
            const advices = loadCoachAdvices();
            expect(advices).toEqual([]);
        });

        it('should fall back when coach advice records break the shared contract', () => {
            writeClientCache(STORAGE_KEYS.coachAdvices, [{ source: 'ai' }]);

            const advices = loadCoachAdvices();
            expect(advices).toEqual([]);
        });
    });

    describe('saveCoachAdvices', () => {
        it('should save coach advices to client cache', () => {
            const advices = [
                { id: 'advice-1', sessionId: 'session-1', strengths: [], weaknesses: [] },
                { id: 'advice-2', sessionId: 'session-2', strengths: [], weaknesses: [] }
            ];
            
            saveCoachAdvices(advices);
            
            const saved = loadCoachAdvices();
            expect(saved).toEqual([
                {
                    id: 'advice-1',
                    sessionId: 'session-1',
                    status: 'complete',
                    strengths: [],
                    weaknesses: [],
                    providerMeta: {}
                },
                {
                    id: 'advice-2',
                    sessionId: 'session-2',
                    status: 'complete',
                    strengths: [],
                    weaknesses: [],
                    providerMeta: {}
                }
            ]);
        });

        it('should trim advices to 50 items', () => {
            const advices = [];
            for (let i = 0; i < 60; i++) {
                advices.push({ id: `advice-${i}`, sessionId: `session-${i}` });
            }
            
            saveCoachAdvices(advices);
            
            const saved = loadCoachAdvices();
            expect(saved.length).toBe(50);
        });
    });

    describe('appendCoachAdvice', () => {
        it('should append a new advice and trim to 50 items', () => {
            const existingAdvices = [];
            for (let i = 0; i < 49; i++) {
                existingAdvices.push({ id: `advice-${i}`, sessionId: `session-${i}` });
            }
            writeClientCache(STORAGE_KEYS.coachAdvices, existingAdvices);
            
            const newAdvice = { id: 'advice-new', sessionId: 'session-new' };
            const result = appendCoachAdvice(newAdvice);
            
            expect(result.length).toBe(50);
            expect(result[0].id).toBe('advice-new');
        });
    });

    describe('getCoachAdviceBySessionId', () => {
        it('should find advice by session id', () => {
            const advices = [
                { id: 'advice-1', sessionId: 'session-1', strengths: [], weaknesses: [] },
                { id: 'advice-2', sessionId: 'session-2', strengths: [], weaknesses: [] }
            ];
            writeClientCache(STORAGE_KEYS.coachAdvices, advices);
            
            const advice = getCoachAdviceBySessionId('session-1');
            expect(advice).toEqual({
                id: 'advice-1',
                sessionId: 'session-1',
                status: 'complete',
                strengths: [],
                weaknesses: [],
                providerMeta: {}
            });
        });

        it('should return null if not found', () => {
            const advices = [{ id: 'advice-1', sessionId: 'session-1' }];
            writeClientCache(STORAGE_KEYS.coachAdvices, advices);
            
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

    describe('v4 training state', () => {
        it('should save and load skill profile', () => {
            const profile = {
                id: 'skill-1',
                createdAt: '2026-06-08T00:00:00.000Z',
                level: { id: 'builder', label: 'Builder' },
                primaryFocus: 'accuracy',
                weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
                metrics: { avgAccuracy: 92, avgConsistency: 84 }
            };

            saveSkillProfile(profile);

            expect(loadSkillProfile()).toMatchObject(profile);
        });

        it('should save and load training plan', () => {
            const plan = {
                id: 'plan-1',
                title: 'Starter plan',
                summary: 'Reset the clearest weakness first.',
                status: 'active',
                currentStepIndex: 0,
                steps: [{
                    id: 'step-1',
                    title: 'Reset accuracy',
                    summary: 'Round summary',
                    status: 'pending',
                    config: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 45,
                        wordCount: 25,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                }]
            };

            saveTrainingPlan(plan);

            expect(loadTrainingPlan()).toEqual(plan);
        });

        it('should save and load diagnostic journey', () => {
            const journey = {
                id: 'diagnostic-1',
                title: '3-minute assessment',
                summary: 'Three short rounds.',
                status: 'active',
                currentStepIndex: 0,
                steps: [{
                    id: 'diagnostic-accuracy',
                    title: 'Accuracy baseline',
                    summary: 'Round summary',
                    status: 'pending',
                    config: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 60,
                        wordCount: 25,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                }]
            };

            saveDiagnosticJourney(journey);

            expect(loadDiagnosticJourney()).toEqual(journey);
        });

        it('should save and load active session context', () => {
            const context = {
                type: 'plan',
                planId: 'plan-1',
                stepId: 'step-1'
            };

            saveActiveSessionContext(context);

            expect(loadActiveSessionContext()).toEqual(context);
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
            expect(() => saveSkillProfile({ id: 'skill-1' })).not.toThrow();
            expect(() => saveTrainingPlan({ id: 'plan-1' })).not.toThrow();
            expect(() => saveDiagnosticJourney({ id: 'diagnostic-1' })).not.toThrow();
            expect(() => saveActiveSessionContext({ type: 'plan' })).not.toThrow();
            
            window.localStorage.setItem = originalSetItem;
        });
    });
});
