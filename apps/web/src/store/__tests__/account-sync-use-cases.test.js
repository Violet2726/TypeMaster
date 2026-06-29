import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
    authSignInMock,
    authSignOutMock,
    listSessionsMock,
    loadSkillProfileMock,
    loadTrainingPlanMock,
    saveActiveSessionContextMock,
    saveCoachAdvicesMock,
    saveDiagnosticJourneyMock,
    saveSessionsMock,
    saveSessionMock,
    saveSettingsMock,
    saveSkillProfileCacheMock,
    saveSkillProfileMock,
    saveTrainingPlanCacheMock,
    saveTrainingPlanMock
} = vi.hoisted(() => ({
    authSignInMock: vi.fn(),
    authSignOutMock: vi.fn(),
    listSessionsMock: vi.fn(),
    loadSkillProfileMock: vi.fn(),
    loadTrainingPlanMock: vi.fn(),
    saveActiveSessionContextMock: vi.fn(),
    saveCoachAdvicesMock: vi.fn(),
    saveDiagnosticJourneyMock: vi.fn(),
    saveSessionsMock: vi.fn(),
    saveSessionMock: vi.fn(() => Promise.resolve({ status: 'synced' })),
    saveSettingsMock: vi.fn(),
    saveSkillProfileCacheMock: vi.fn(),
    saveSkillProfileMock: vi.fn(() => Promise.resolve({ status: 'synced' })),
    saveTrainingPlanCacheMock: vi.fn(),
    saveTrainingPlanMock: vi.fn(() => Promise.resolve({ status: 'synced' }))
}));

vi.mock('../../services/api', () => ({
    authGateway: {
        signIn: authSignInMock,
        signOut: authSignOutMock
    },
    planGateway: {
        loadSkillProfile: loadSkillProfileMock,
        loadTrainingPlan: loadTrainingPlanMock,
        saveSkillProfile: saveSkillProfileMock,
        saveTrainingPlan: saveTrainingPlanMock
    },
    sessionGateway: {
        listSessions: listSessionsMock,
        saveSession: saveSessionMock
    }
}));

vi.mock('../../services/storage', () => ({
    saveActiveSessionContext: saveActiveSessionContextMock,
    saveCoachAdvices: saveCoachAdvicesMock,
    saveDiagnosticJourney: saveDiagnosticJourneyMock,
    saveSessions: saveSessionsMock,
    saveSettings: saveSettingsMock,
    saveSkillProfile: saveSkillProfileCacheMock,
    saveTrainingPlan: saveTrainingPlanCacheMock
}));

import {
    exportTrainingData,
    hydrateAccountFromApi,
    importTrainingData,
    signInToAccount,
    signOutFromAccount
} from '../account-sync-use-cases';

function createConfig(overrides = {}) {
    return {
        source: 'builtin',
        mode: 'time',
        durationSeconds: 30,
        wordCount: 25,
        includeNumbers: false,
        includePunctuation: false,
        aiTemplate: 'daily',
        difficulty: 'medium',
        ...overrides
    };
}

function createSession(id = 'session-1') {
    return {
        id,
        config: createConfig(),
        result: {
            wpm: 72,
            accuracy: 97
        },
        timeline: {
            samples: []
        },
        sourceTextMeta: {
            label: 'Practice text'
        },
        coachAdviceId: null,
        trainingMeta: null
    };
}

function createSkillProfile() {
    return {
        id: 'skill-1',
        level: {
            id: 'builder',
            label: 'Builder'
        },
        summary: 'Focus on accuracy.',
        primaryFocus: 'accuracy',
        weakZones: [],
        topErrorChars: [],
        topErrorWords: [],
        metrics: {
            avgWpm: 72
        }
    };
}

function createTrainingPlan() {
    return {
        id: 'plan-1',
        title: 'Starter plan',
        summary: 'Plan summary',
        status: 'active',
        currentStepIndex: 0,
        steps: [
            {
                id: 'step-1',
                title: 'Reset accuracy',
                summary: 'Round summary',
                config: createConfig(),
                status: 'pending',
                completedSessionId: null
            }
        ]
    };
}

function createEnvironment(overrides = {}) {
    return {
        account: null,
        achievements: [],
        activeSessionContext: null,
        coachAdviceRecords: [],
        config: createConfig(),
        diagnosticJourney: null,
        sessionStreak: 0,
        sessions: [],
        settings: {
            language: 'en-US',
            theme: 'serika-dark'
        },
        skillProfile: null,
        trainingPlan: null,
        weeklyGoal: {
            target: 3,
            completed: 0,
            percent: 0
        },
        setAccountStatus: vi.fn(),
        setActiveSessionContext: vi.fn(),
        setCoachAdviceRecords: vi.fn(),
        setConfigState: vi.fn(),
        setCurrentDraft: vi.fn(),
        setDiagnosticJourney: vi.fn(),
        setLastCompletedSession: vi.fn(),
        setSessions: vi.fn(),
        setSettingsState: vi.fn(),
        setSkillProfile: vi.fn(),
        setTrainingPlan: vi.fn(),
        updateCurrentUser: vi.fn(),
        ...overrides
    };
}

describe('account sync use cases', () => {
    beforeEach(() => {
        authSignInMock.mockReset();
        authSignOutMock.mockReset();
        listSessionsMock.mockReset();
        loadSkillProfileMock.mockReset();
        loadTrainingPlanMock.mockReset();
        saveActiveSessionContextMock.mockClear();
        saveCoachAdvicesMock.mockClear();
        saveDiagnosticJourneyMock.mockClear();
        saveSessionsMock.mockClear();
        saveSessionMock.mockClear();
        saveSettingsMock.mockClear();
        saveSkillProfileCacheMock.mockClear();
        saveSkillProfileMock.mockClear();
        saveTrainingPlanCacheMock.mockClear();
        saveTrainingPlanMock.mockClear();
    });

    test('hydrates account data from api and mirrors remote state into local cache', async () => {
        const user = { id: 'user-1', displayName: 'Ada' };
        const session = createSession();
        const skillProfile = createSkillProfile();
        const trainingPlan = createTrainingPlan();
        listSessionsMock.mockResolvedValue([session]);
        loadSkillProfileMock.mockResolvedValue(skillProfile);
        loadTrainingPlanMock.mockResolvedValue(trainingPlan);
        const environment = createEnvironment();

        const result = await hydrateAccountFromApi(environment, user);

        expect(result).toBe(user);
        expect(saveSessionsMock).toHaveBeenCalledWith([session]);
        expect(environment.setSessions).toHaveBeenCalledWith([
            expect.objectContaining({
                id: session.id,
                result: expect.objectContaining({
                    wpm: 72,
                    accuracy: 97
                })
            })
        ]);
        expect(environment.setLastCompletedSession).toHaveBeenCalledWith(expect.objectContaining({
            id: session.id
        }));
        expect(saveSkillProfileCacheMock).toHaveBeenCalledWith(skillProfile);
        expect(environment.setSkillProfile).toHaveBeenCalledWith(skillProfile);
        expect(saveTrainingPlanCacheMock).toHaveBeenCalledWith(trainingPlan);
        expect(environment.setTrainingPlan).toHaveBeenCalledWith(trainingPlan);
        expect(saveSessionMock).not.toHaveBeenCalled();
    });

    test('pushes local state when api has no account data yet', async () => {
        const session = createSession();
        const skillProfile = createSkillProfile();
        const trainingPlan = createTrainingPlan();
        listSessionsMock.mockResolvedValue([]);
        loadSkillProfileMock.mockResolvedValue(null);
        loadTrainingPlanMock.mockResolvedValue(null);
        const environment = createEnvironment({
            achievements: [{ id: 'first', unlocked: true }],
            sessions: [session],
            sessionStreak: 2,
            skillProfile,
            trainingPlan
        });

        await hydrateAccountFromApi(environment, { id: 'user-1', displayName: 'Ada' });

        expect(saveSessionMock).toHaveBeenCalledWith(session);
        expect(saveSkillProfileMock).toHaveBeenCalledWith(skillProfile, {
            achievements: environment.achievements,
            streakState: {
                current: 2,
                weeklyGoal: environment.weeklyGoal
            }
        });
        expect(saveTrainingPlanMock).toHaveBeenCalledWith(trainingPlan);
        expect(environment.setSessions).not.toHaveBeenCalled();
    });

    test('signs in, marks the account connected, and hydrates account data', async () => {
        const user = { id: 'user-1', displayName: 'Ada' };
        authSignInMock.mockResolvedValue(user);
        listSessionsMock.mockResolvedValue([]);
        loadSkillProfileMock.mockResolvedValue(null);
        loadTrainingPlanMock.mockResolvedValue(null);
        const environment = createEnvironment();

        const result = await signInToAccount(environment, 'Ada');

        expect(result).toBe(user);
        expect(environment.setAccountStatus).toHaveBeenNthCalledWith(1, 'loading');
        expect(authSignInMock).toHaveBeenCalledWith({ displayName: 'Ada' });
        expect(environment.updateCurrentUser).toHaveBeenCalledWith(user);
        expect(environment.setAccountStatus).toHaveBeenLastCalledWith('connected');
        expect(listSessionsMock).toHaveBeenCalled();
    });

    test('signs out and returns account status to idle', async () => {
        authSignOutMock.mockResolvedValue(true);
        const environment = createEnvironment();

        await signOutFromAccount(environment);

        expect(environment.setAccountStatus).toHaveBeenNthCalledWith(1, 'loading');
        expect(authSignOutMock).toHaveBeenCalled();
        expect(environment.updateCurrentUser).toHaveBeenCalledWith(null);
        expect(environment.setAccountStatus).toHaveBeenLastCalledWith('idle');
    });

    test('exports and imports a normalized training data bundle', () => {
        const session = createSession();
        const skillProfile = createSkillProfile();
        const trainingPlan = createTrainingPlan();
        const environment = createEnvironment({
            account: { id: 'user-1', displayName: 'Ada' },
            coachAdviceRecords: [{
                id: 'coach-1',
                sessionId: session.id,
                source: 'ai',
                headline: 'Keep going'
            }],
            diagnosticJourney: null,
            sessions: [session],
            skillProfile,
            trainingPlan
        });
        const exported = exportTrainingData(environment);
        const importedPayload = JSON.parse(exported);

        importTrainingData(environment, {
            ...importedPayload,
            settings: {
                language: 'en-US',
                theme: 'serika-dark',
                lastConfig: createConfig({ mode: 'words', wordCount: 5 })
            },
            activeSessionContext: {
                type: 'plan',
                planId: trainingPlan.id,
                stepId: 'step-1'
            }
        });

        expect(environment.setSettingsState).toHaveBeenCalledWith(expect.objectContaining({
            language: 'en-US',
            lastConfig: expect.objectContaining({
                mode: 'words',
                wordCount: 5
            })
        }));
        expect(environment.setConfigState).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'words',
            wordCount: 5
        }));
        expect(environment.setSessions).toHaveBeenCalledWith([
            expect.objectContaining({
                id: session.id,
                result: expect.objectContaining({
                    wpm: 72,
                    accuracy: 97
                })
            })
        ]);
        expect(environment.setLastCompletedSession).toHaveBeenCalledWith(expect.objectContaining({
            id: session.id
        }));
        expect(environment.setSkillProfile).toHaveBeenCalledWith(skillProfile);
        expect(environment.setTrainingPlan).toHaveBeenCalledWith(trainingPlan);
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
        expect(saveSettingsMock).toHaveBeenCalled();
        expect(saveSessionsMock).toHaveBeenCalledWith([
            expect.objectContaining({
                id: session.id
            })
        ]);
        expect(saveSkillProfileCacheMock).toHaveBeenCalledWith(skillProfile);
        expect(saveTrainingPlanCacheMock).toHaveBeenCalledWith(trainingPlan);
        expect(saveSessionMock).toHaveBeenCalledWith(expect.objectContaining({
            id: session.id
        }));
        expect(saveSkillProfileMock).toHaveBeenCalledWith(skillProfile, {
            achievements: environment.achievements,
            streakState: {
                current: environment.sessionStreak,
                weeklyGoal: environment.weeklyGoal
            }
        });
        expect(saveTrainingPlanMock).toHaveBeenCalledWith(trainingPlan);
    });
});
