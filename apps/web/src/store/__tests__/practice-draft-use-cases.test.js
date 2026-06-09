import { beforeEach, describe, expect, test, vi } from 'vitest';

const { generatePracticeTextMock } = vi.hoisted(() => ({
    generatePracticeTextMock: vi.fn()
}));

vi.mock('@typemaster/ai', () => ({
    generatePracticeText: generatePracticeTextMock
}));

import {
    applyCustomWordBank,
    generateAiPractice,
    updateConfig
} from '../practice-draft-use-cases';

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

function createEnvironment(overrides = {}) {
    const environment = {
        activeSessionContext: null,
        aiPracticeStatus: 'idle',
        config: createConfig(),
        currentDraft: null,
        settings: {
            language: 'en-US',
            customWordBankText: ''
        },
        setActiveSessionContext: vi.fn(),
        setAiPracticeStatus: vi.fn(),
        setConfigState: vi.fn((next) => {
            environment.config = typeof next === 'function' ? next(environment.config) : next;
        }),
        setCurrentDraft: vi.fn((next) => {
            environment.currentDraft = next;
        }),
        setPracticeError: vi.fn(),
        setSettingsState: vi.fn((next) => {
            environment.settings = next;
        }),
        ...overrides
    };

    return environment;
}

describe('practice draft use cases', () => {
    beforeEach(() => {
        generatePracticeTextMock.mockReset();
    });

    test('applies a custom word bank and clears the active training context', () => {
        const environment = createEnvironment();
        const text = applyCustomWordBank(environment, 'alpha beta gamma');
        const draft = environment.setCurrentDraft.mock.calls[0][0];

        expect(text).toBe('alpha beta gamma');
        expect(environment.setSettingsState).toHaveBeenCalledWith(expect.objectContaining({
            customWordBankText: 'alpha beta gamma'
        }));
        expect(environment.setConfigState).toHaveBeenCalledWith(expect.objectContaining({
            source: 'custom'
        }));
        expect(draft.words).toEqual(['alpha', 'beta', 'gamma']);
        expect(draft.sourceTextMeta.source).toBe('custom');
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
    });

    test('updates builtin config through the scheduled draft update boundary', () => {
        const environment = createEnvironment({
            currentDraft: {
                sourceTextMeta: { source: 'ai' }
            }
        });
        const scheduleDraftUpdate = vi.fn((callback) => callback());

        updateConfig(environment, {
            source: 'builtin',
            mode: 'words',
            wordCount: 5
        }, scheduleDraftUpdate);

        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
        expect(environment.config).toMatchObject({
            source: 'builtin',
            mode: 'words',
            wordCount: 5
        });
        expect(scheduleDraftUpdate).toHaveBeenCalledTimes(1);
        expect(environment.currentDraft.words).toHaveLength(5);
        expect(environment.currentDraft.sourceTextMeta.source).toBe('builtin');
    });

    test('generates an ai draft and marks it ready', async () => {
        const aiDraft = {
            id: 'draft-1',
            words: ['alpha'],
            sourceTextMeta: { source: 'ai' }
        };
        generatePracticeTextMock.mockResolvedValue(aiDraft);
        const environment = createEnvironment();

        const result = await generateAiPractice(environment, {
            promptOverride: 'Practice calm accuracy',
            configPatch: {
                mode: 'words',
                wordCount: 10
            }
        });

        expect(result).toBe(aiDraft);
        expect(generatePracticeTextMock).toHaveBeenCalledWith(expect.objectContaining({
            source: 'ai',
            mode: 'words',
            wordCount: 10
        }), 'Practice calm accuracy', {
            language: 'en-US'
        });
        expect(environment.setAiPracticeStatus).toHaveBeenNthCalledWith(1, 'loading');
        expect(environment.setAiPracticeStatus).toHaveBeenLastCalledWith('ready');
        expect(environment.setCurrentDraft).toHaveBeenCalledWith(aiDraft);
    });

    test('captures ai generation issues before rethrowing', async () => {
        const issue = { code: 'missing_config', message: 'AI proxy disabled' };
        generatePracticeTextMock.mockRejectedValue(issue);
        const environment = createEnvironment();

        await expect(generateAiPractice(environment)).rejects.toBe(issue);

        expect(environment.setPracticeError).toHaveBeenLastCalledWith(issue);
        expect(environment.setAiPracticeStatus).toHaveBeenLastCalledWith('error');
    });
});
