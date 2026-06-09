import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
    appendCoachAdviceMock,
    buildFallbackCoachAdviceMock,
    generateCoachAdviceMock,
    getCoachAdviceBySessionIdMock,
    updateSessionMock
} = vi.hoisted(() => ({
    appendCoachAdviceMock: vi.fn((record) => [record]),
    buildFallbackCoachAdviceMock: vi.fn(() => ({
        headline: 'Fallback coach',
        summary: 'Keep practicing the current weakness.',
        strengths: [],
        weaknesses: ['accuracy'],
        nextDrill: {
            label: 'Accuracy drill',
            reason: 'Accuracy dipped.',
            configPatch: { source: 'ai', mode: 'words', wordCount: 20 },
            aiPrompt: 'Practice accuracy'
        },
        comparison: {
            label: 'mixed',
            summary: 'Fallback comparison.'
        },
        language: 'en-US'
    })),
    generateCoachAdviceMock: vi.fn(),
    getCoachAdviceBySessionIdMock: vi.fn(() => null),
    updateSessionMock: vi.fn((sessionId, updater) => [updater({ id: sessionId, coachAdviceId: null })])
}));

vi.mock('@typemaster/ai', () => ({
    buildFallbackCoachAdvice: buildFallbackCoachAdviceMock,
    generateCoachAdvice: generateCoachAdviceMock
}));

vi.mock('../../services/storage', () => ({
    appendCoachAdvice: appendCoachAdviceMock,
    getCoachAdviceBySessionId: getCoachAdviceBySessionIdMock,
    updateSession: updateSessionMock
}));

import {
    generateCoachForSession,
    launchNextDrill
} from '../coach-feedback-use-cases';

function createSession(id = 'session-1') {
    return {
        id,
        config: { source: 'builtin', mode: 'time' },
        result: { wpm: 72, accuracy: 97 },
        timeline: { samples: [] },
        sourceTextMeta: { label: 'Practice text' }
    };
}

function createEnvironment(overrides = {}) {
    return {
        coachAdviceRecords: [],
        coachIssueBySessionId: {},
        coachStatusBySessionId: {},
        lastCompletedSession: null,
        sessions: [],
        settings: {
            language: 'en-US'
        },
        setCoachAdviceRecords: vi.fn(),
        setCoachIssueBySessionId: vi.fn(),
        setCoachStatusBySessionId: vi.fn(),
        setSessions: vi.fn(),
        ...overrides
    };
}

describe('coach feedback use cases', () => {
    beforeEach(() => {
        appendCoachAdviceMock.mockClear();
        buildFallbackCoachAdviceMock.mockClear();
        generateCoachAdviceMock.mockReset();
        getCoachAdviceBySessionIdMock.mockClear();
        updateSessionMock.mockClear();
    });

    test('reuses existing ai advice without regenerating unless forced', async () => {
        const existingRecord = {
            id: 'coach-1',
            sessionId: 'session-1',
            source: 'ai',
            headline: 'Already coached'
        };
        const environment = createEnvironment({
            coachAdviceRecords: [existingRecord]
        });

        const record = await generateCoachForSession(environment, 'session-1');
        const statusUpdater = environment.setCoachStatusBySessionId.mock.calls[0][0];

        expect(record).toBe(existingRecord);
        expect(generateCoachAdviceMock).not.toHaveBeenCalled();
        expect(statusUpdater({})).toEqual({
            'session-1': 'success'
        });
    });

    test('saves fallback coach advice when ai generation fails', async () => {
        const session = createSession('session-1');
        const historySession = createSession('session-2');
        const issue = { code: 'missing_config', message: 'Missing AI config' };
        generateCoachAdviceMock.mockRejectedValue(issue);
        const environment = createEnvironment({
            sessions: [session, historySession]
        });

        const record = await generateCoachForSession(environment, 'session-1');
        const savedRecord = appendCoachAdviceMock.mock.calls[0][0];
        const fallbackStatusUpdater = environment.setCoachStatusBySessionId.mock.calls.at(-1)[0];
        const issueUpdater = environment.setCoachIssueBySessionId.mock.calls.at(-1)[0];

        expect(generateCoachAdviceMock).toHaveBeenCalledWith({
            session,
            history: [historySession],
            language: 'en-US'
        });
        expect(buildFallbackCoachAdviceMock).toHaveBeenCalledWith({
            session,
            history: [historySession],
            language: 'en-US'
        });
        expect(record).toBe(savedRecord);
        expect(savedRecord).toMatchObject({
            sessionId: 'session-1',
            source: 'fallback',
            fallbackReasonCode: 'missing_config',
            fallbackReasonMessage: 'Missing AI config'
        });
        expect(environment.setCoachAdviceRecords).toHaveBeenCalledWith([savedRecord]);
        expect(environment.setSessions).toHaveBeenCalledWith([
            expect.objectContaining({
                id: 'session-1',
                coachAdviceId: savedRecord.id
            })
        ]);
        expect(fallbackStatusUpdater({})).toEqual({
            'session-1': 'fallback'
        });
        expect(issueUpdater({})).toEqual({
            'session-1': issue
        });
    });

    test('launches the next drill through the config action boundary', async () => {
        const generateAiPractice = vi.fn().mockResolvedValue({ id: 'draft-1' });
        const result = await launchNextDrill({ generateAiPractice }, {
            nextDrill: {
                aiPrompt: 'Practice accuracy',
                configPatch: {
                    source: 'ai',
                    mode: 'words',
                    wordCount: 20
                }
            }
        });

        expect(result).toEqual({ id: 'draft-1' });
        expect(generateAiPractice).toHaveBeenCalledWith({
            promptOverride: 'Practice accuracy',
            configPatch: {
                source: 'ai',
                mode: 'words',
                wordCount: 20
            }
        });
    });

    test('falls back to an adaptive local drill when ai text generation fails', async () => {
        const failed = new Error('AI unavailable');
        const fallbackDraft = { id: 'adaptive-1' };
        const session = createSession('session-1');
        const generateAiPractice = vi.fn().mockRejectedValue(failed);
        const setAdaptiveDrillDraft = vi.fn().mockReturnValue(fallbackDraft);

        const result = await launchNextDrill({ generateAiPractice, setAdaptiveDrillDraft }, {
            nextDrill: {
                aiPrompt: 'Practice accuracy',
                configPatch: {
                    source: 'ai',
                    mode: 'words',
                    wordCount: 20
                }
            }
        }, session);

        expect(result).toBe(fallbackDraft);
        expect(setAdaptiveDrillDraft).toHaveBeenCalledWith(session);
    });

    test('starts an adaptive local drill when no coach next drill exists', async () => {
        const fallbackDraft = { id: 'adaptive-1' };
        const session = createSession('session-1');
        const generateAiPractice = vi.fn();
        const setAdaptiveDrillDraft = vi.fn().mockReturnValue(fallbackDraft);

        const result = await launchNextDrill({ generateAiPractice, setAdaptiveDrillDraft }, null, session);

        expect(result).toBe(fallbackDraft);
        expect(generateAiPractice).not.toHaveBeenCalled();
        expect(setAdaptiveDrillDraft).toHaveBeenCalledWith(session);
    });
});
