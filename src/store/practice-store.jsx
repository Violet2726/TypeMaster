/**
 * 练习全局状态仓库。
 *
 * 2.1 版本在这里统一编排：
 * - 多语言 UI 文案
 * - 当前练习配置与草稿
 * - AI 文本状态
 * - 教练建议状态
 * - 本地历史和设置持久化
 */
import { createContext, startTransition, useContext, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_CONFIG,
    buildLocalCoachAdvice,
    createBuiltinDraft,
    deriveComparison,
    doesDraftMatchConfig
} from '../engine';
import { getCopy } from '../i18n';
import { buildFallbackCoachAdvice, generateCoachAdvice, generatePracticeText } from '../services/ai-service';
import { challengeGateway, sessionSyncGateway } from '../services/cloud-contracts';
import {
    appendCoachAdvice,
    appendSession,
    getCoachAdviceBySessionId,
    loadCoachAdvices,
    loadSessions,
    loadSettings,
    saveSettings,
    updateSession
} from '../services/storage';

const PracticeContext = createContext(null);

function normalizeConfig(config) {
    const next = {
        ...DEFAULT_CONFIG,
        ...config
    };

    if (next.mode === 'time') {
        next.durationSeconds = Number(next.durationSeconds || DEFAULT_CONFIG.durationSeconds);
    } else {
        next.wordCount = Number(next.wordCount || DEFAULT_CONFIG.wordCount);
    }

    return next;
}

function getCoachStatusFromRecord(record) {
    if (!record) return 'idle';
    return record.source === 'ai' ? 'success' : 'fallback';
}

function normalizeAiIssue(error) {
    return {
        code: error?.code || 'unknown',
        message: error?.message || 'Unknown error'
    };
}

function relabelDraft(draft, language) {
    if (!draft) return draft;

    if (draft.sourceTextMeta?.generatedBy === 'builtin') {
        return {
            ...draft,
            sourceTextMeta: {
                ...draft.sourceTextMeta,
                label: language === 'en-US' ? 'Built-in word bank' : '标准词库训练'
            }
        };
    }

    if (draft.sourceTextMeta?.generatedBy === 'ai') {
        const template = draft.sourceTextMeta.template;
        const difficulty = draft.sourceTextMeta.difficulty;
        const templateLabel = template
            ? (language === 'en-US'
                ? {
                    daily: 'Daily conversation',
                    business: 'Business English',
                    tech: 'Tech writing',
                    developer: 'Developer workflow'
                }[template]
                : {
                    daily: '日常对话',
                    business: '商务英语',
                    tech: '科技写作',
                    developer: '开发者常用语'
                }[template])
            : null;
        const difficultyLabel = difficulty
            ? (language === 'en-US'
                ? { easy: 'Easy', medium: 'Medium', hard: 'Hard' }[difficulty]
                : { easy: '入门', medium: '进阶', hard: '挑战' }[difficulty])
            : null;

        return {
            ...draft,
            sourceTextMeta: {
                ...draft.sourceTextMeta,
                label: templateLabel && difficultyLabel
                    ? `${templateLabel} · ${difficultyLabel}`
                    : draft.sourceTextMeta.label
            }
        };
    }

    return draft;
}

export function PracticeProvider({ children }) {
    const initialSettings = loadSettings();
    const initialConfig = normalizeConfig(initialSettings.lastConfig || DEFAULT_CONFIG);

    const [settings, setSettingsState] = useState(initialSettings);
    const [config, setConfigState] = useState(initialConfig);
    const [sessions, setSessions] = useState(loadSessions());
    const [coachAdviceRecords, setCoachAdviceRecords] = useState(loadCoachAdvices());
    const [currentDraft, setCurrentDraft] = useState(() => createBuiltinDraft(initialConfig, { language: initialSettings.language }));
    const [aiPracticeStatus, setAiPracticeStatus] = useState(initialConfig.source === 'ai' ? 'idle' : 'idle');
    const [practiceError, setPracticeError] = useState(null);
    const [lastCompletedSession, setLastCompletedSession] = useState(() => loadSessions()[0] || null);
    const [coachStatusBySessionId, setCoachStatusBySessionId] = useState({});
    const [coachIssueBySessionId, setCoachIssueBySessionId] = useState({});

    useEffect(() => {
        saveSettings({
            ...settings,
            lastConfig: config
        });
    }, [settings, config]);

    useEffect(() => {
        setCurrentDraft((previous) => relabelDraft(previous, settings.language));
    }, [settings.language]);

    const copy = useMemo(() => getCopy(settings.language), [settings.language]);

    const updateSettings = (patch) => {
        setSettingsState((previous) => ({
            ...previous,
            ...patch
        }));
    };

    const setBuiltinDraft = (nextConfig) => {
        setCurrentDraft(createBuiltinDraft({ ...nextConfig, source: 'builtin' }, { language: settings.language }));
        setPracticeError(null);
        setAiPracticeStatus('idle');
    };

    const updateConfig = (patch) => {
        let nextConfig;
        setConfigState((previous) => {
            nextConfig = normalizeConfig({ ...previous, ...patch });
            return nextConfig;
        });

        if (!nextConfig) {
            return;
        }

        if ((patch.source || nextConfig.source) === 'builtin') {
            startTransition(() => {
                setBuiltinDraft({ ...nextConfig, source: 'builtin' });
            });
            return;
        }

        setPracticeError(null);
        if (currentDraft?.sourceTextMeta?.source === 'ai' && doesDraftMatchConfig(nextConfig, currentDraft)) {
            setAiPracticeStatus('ready');
            return;
        }

        setAiPracticeStatus(currentDraft?.sourceTextMeta?.source === 'ai' ? 'stale' : 'idle');
    };

    function restoreAiDraftConfig() {
        if (!currentDraft?.configSnapshot || currentDraft.sourceTextMeta?.source !== 'ai') {
            return;
        }

        const restored = normalizeConfig({
            ...currentDraft.configSnapshot,
            source: 'ai'
        });

        setConfigState(restored);
        setPracticeError(null);
        setAiPracticeStatus('ready');
    }

    async function generateAiPractice({ promptOverride = '', configPatch = {} } = {}) {
        const nextConfig = normalizeConfig({
            ...config,
            ...configPatch,
            source: 'ai'
        });

        setConfigState(nextConfig);
        setAiPracticeStatus('loading');
        setPracticeError(null);

        try {
            const draft = await generatePracticeText(nextConfig, promptOverride, {
                language: settings.language
            });
            setCurrentDraft(draft);
            setAiPracticeStatus('ready');
            return draft;
        } catch (error) {
            console.error('Failed to generate AI practice', error);
            setPracticeError(normalizeAiIssue(error));
            setAiPracticeStatus('error');
            throw error;
        }
    }

    function resetPracticeToBuiltin() {
        const nextConfig = normalizeConfig({
            ...config,
            source: 'builtin'
        });

        setConfigState(nextConfig);
        setBuiltinDraft(nextConfig);
    }

    function completePractice({ result, timeline }) {
        const session = {
            id: crypto.randomUUID(),
            config,
            result,
            timeline,
            sourceTextMeta: currentDraft?.sourceTextMeta || {
                source: config.source || 'builtin',
                label: settings.language === 'en-US' ? 'Practice text' : '训练文本'
            },
            coachAdviceId: null
        };

        const nextSessions = appendSession(session);
        setSessions(nextSessions);
        setLastCompletedSession(session);

        sessionSyncGateway.syncSession(session).catch(() => {});
        return session;
    }

    function saveCoachRecord(sessionId, advice, source) {
        const record = {
            id: crypto.randomUUID(),
            sessionId,
            source,
            createdAt: new Date().toISOString(),
            ...advice
        };

        const nextRecords = appendCoachAdvice(record);
        const nextSessions = updateSession(sessionId, (session) => ({
            ...session,
            coachAdviceId: record.id
        }));

        setCoachAdviceRecords(nextRecords);
        setSessions(nextSessions);
        return record;
    }

    function getAdviceForSession(sessionId) {
        if (!sessionId) return null;
        return coachAdviceRecords.find((record) => record.sessionId === sessionId)
            || getCoachAdviceBySessionId(sessionId);
    }

    function getCoachStatusForSession(sessionId) {
        if (!sessionId) return 'idle';
        return coachStatusBySessionId[sessionId] || getCoachStatusFromRecord(getAdviceForSession(sessionId));
    }

    function getCoachIssueForSession(sessionId) {
        if (!sessionId) return null;
        return coachIssueBySessionId[sessionId] || null;
    }

    async function generateCoachForSession(sessionId, options = {}) {
        const { force = false } = options;
        const existing = getAdviceForSession(sessionId);
        if (existing && !force && existing.source === 'ai') {
            setCoachStatusBySessionId((previous) => ({
                ...previous,
                [sessionId]: 'success'
            }));
            return existing;
        }

        const session = sessions.find((item) => item.id === sessionId) || lastCompletedSession;
        if (!session) {
            setCoachStatusBySessionId((previous) => ({
                ...previous,
                [sessionId]: 'error'
            }));
            return null;
        }

        const history = sessions.filter((item) => item.id !== session.id);

        setCoachStatusBySessionId((previous) => ({
            ...previous,
            [sessionId]: 'loading'
        }));
        setCoachIssueBySessionId((previous) => ({
            ...previous,
            [sessionId]: null
        }));

        try {
            const advice = await generateCoachAdvice({
                session,
                history,
                language: settings.language
            });

            const record = saveCoachRecord(session.id, advice, 'ai');
            setCoachStatusBySessionId((previous) => ({
                ...previous,
                [sessionId]: 'success'
            }));
            return record;
        } catch (error) {
            console.error('Failed to generate AI coach advice', error);
            const issue = normalizeAiIssue(error);

            try {
                const fallback = buildFallbackCoachAdvice({
                    session,
                    history,
                    language: settings.language
                });
                const record = saveCoachRecord(session.id, {
                    ...fallback,
                    fallbackReasonCode: issue.code,
                    fallbackReasonMessage: issue.message
                }, 'fallback');
                setCoachStatusBySessionId((previous) => ({
                    ...previous,
                    [sessionId]: 'fallback'
                }));
                setCoachIssueBySessionId((previous) => ({
                    ...previous,
                    [sessionId]: issue
                }));
                return record;
            } catch (fallbackError) {
                setCoachStatusBySessionId((previous) => ({
                    ...previous,
                    [sessionId]: 'error'
                }));
                setCoachIssueBySessionId((previous) => ({
                    ...previous,
                    [sessionId]: issue
                }));
                throw fallbackError;
            }
        }
    }

    async function launchNextDrill(adviceRecord) {
        const nextDrill = adviceRecord?.nextDrill;
        if (!nextDrill) {
            return null;
        }

        return generateAiPractice({
            promptOverride: nextDrill.aiPrompt,
            configPatch: nextDrill.configPatch
        });
    }

    const latestCoachAdvice = coachAdviceRecords[0] || null;
    const latestComparison = lastCompletedSession
        ? deriveComparison(sessions, lastCompletedSession.id, lastCompletedSession.result, settings.language)
        : null;

    const value = useMemo(() => ({
        settings,
        language: settings.language,
        copy,
        updateSettings,
        config,
        updateConfig,
        sessions,
        coachAdviceRecords,
        currentDraft,
        setCurrentDraft,
        aiPracticeStatus,
        practiceError,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        setPracticeError,
        resetPracticeToBuiltin,
        restoreAiDraftConfig,
        generateAiPractice,
        completePractice,
        getAdviceForSession,
        getCoachStatusForSession,
        getCoachIssueForSession,
        generateCoachForSession,
        launchNextDrill,
        challengeGateway,
        sessionSyncGateway,
        buildLocalCoachAdvice
    }), [
        aiPracticeStatus,
        coachAdviceRecords,
        config,
        copy,
        currentDraft,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        practiceError,
        sessions,
        settings
    ]);

    return (
        <PracticeContext.Provider value={value}>
            {children}
        </PracticeContext.Provider>
    );
}

export function usePracticeStore() {
    const context = useContext(PracticeContext);
    if (!context) {
        throw new Error('usePracticeStore must be used within PracticeProvider');
    }
    return context;
}

