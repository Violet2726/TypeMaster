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
    advanceJourney,
    advanceTrainingPlan,
    buildAchievements,
    buildLocalCoachAdvice,
    buildSkillProfile,
    calculateSessionStreak,
    calculateWeeklySessions,
    createChallengeEntryPreview,
    createBuiltinDraft,
    createCustomDraft,
    createDiagnosticJourney,
    createDraftFromTrainingStep,
    createDraftFromText,
    createStarterTrainingPlan,
    deriveComparison,
    doesDraftMatchConfig,
    getActiveJourneyStep,
    getActiveTrainingStep,
    getTrainingPlanProgress,
    mergeChallengeLeaderboardEntries
} from '../engine';
import { getCopy } from '../i18n';
import { buildFallbackCoachAdvice, generateCoachAdvice, generatePracticeText } from '../services/ai-service';
import { authGateway, challengeGateway, planSyncGateway, sessionSyncGateway } from '../services/cloud-contracts';
import { buildAchievementDomain } from './domains/achievement-domain';
import { buildAccountDomain } from './domains/account-domain';
import { buildConfigDomain } from './domains/config-domain';
import { buildHistoryDomain } from './domains/history-domain';
import { buildPlanDomain } from './domains/plan-domain';
import { buildSessionDomain } from './domains/session-domain';
import {
    loadActiveSessionContext,
    appendCoachAdvice,
    appendSession,
    getCoachAdviceBySessionId,
    loadCoachAdvices,
    loadDiagnosticJourney,
    loadSkillProfile,
    loadSessions,
    loadSettings,
    loadTrainingPlan,
    saveCoachAdvices,
    saveSessions,
    saveActiveSessionContext,
    saveDiagnosticJourney,
    saveSettings,
    saveSkillProfile,
    saveTrainingPlan,
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

    if (draft.sourceTextMeta?.generatedBy === 'custom') {
        return {
            ...draft,
            sourceTextMeta: {
                ...draft.sourceTextMeta,
                label: language === 'en-US' ? 'Custom word bank' : '自定义词库'
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

function buildTrainingTaskFromState(activeSessionContext, diagnosticJourney, trainingPlan, dailyChallenge) {
    if (!activeSessionContext) {
        return null;
    }

    if (activeSessionContext.type === 'diagnostic') {
        return diagnosticJourney?.steps?.find((step) => step.id === activeSessionContext.stepId) || null;
    }

    if (activeSessionContext.type === 'plan') {
        return trainingPlan?.steps?.find((step) => step.id === activeSessionContext.stepId) || null;
    }

    if (activeSessionContext.type === 'challenge') {
        return dailyChallenge && dailyChallenge.id === activeSessionContext.challengeId
            ? {
                id: dailyChallenge.id,
                order: 1,
                title: dailyChallenge.title,
                summary: dailyChallenge.summary
            }
            : null;
    }

    return null;
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
    const [skillProfile, setSkillProfile] = useState(loadSkillProfile());
    const [trainingPlan, setTrainingPlan] = useState(loadTrainingPlan());
    const [diagnosticJourney, setDiagnosticJourney] = useState(loadDiagnosticJourney());
    const [activeSessionContext, setActiveSessionContext] = useState(loadActiveSessionContext());
    const [account, setAccount] = useState(null);
    const [accountStatus, setAccountStatus] = useState('idle');
    const [dailyChallenge, setDailyChallenge] = useState(null);
    const sessionStreak = calculateSessionStreak(sessions);
    const weeklySessions = calculateWeeklySessions(sessions);
    const weeklyGoal = {
        target: 3,
        completed: weeklySessions,
        percent: Math.min(100, Math.round((weeklySessions / 3) * 100))
    };
    const achievements = buildAchievements({
        sessions,
        sessionStreak,
        weeklyGoal,
        skillProfile
    });

    useEffect(() => {
        saveSettings({
            ...settings,
            lastConfig: config
        });
    }, [settings, config]);

    useEffect(() => {
        saveSkillProfile(skillProfile);
    }, [skillProfile]);

    useEffect(() => {
        saveTrainingPlan(trainingPlan);
    }, [trainingPlan]);

    useEffect(() => {
        saveDiagnosticJourney(diagnosticJourney);
    }, [diagnosticJourney]);

    useEffect(() => {
        saveActiveSessionContext(activeSessionContext);
    }, [activeSessionContext]);

    useEffect(() => {
        setCurrentDraft((previous) => relabelDraft(previous, settings.language));
    }, [settings.language]);

    useEffect(() => {
        let active = true;

        authGateway.getCurrentUser()
            .then((user) => {
                if (!active) {
                    return;
                }

                setAccount(user);
                setAccountStatus(user ? 'connected' : 'idle');
                if (user) {
                    hydrateFromCloud(user).catch(() => {});
                }
            })
            .catch(() => {
                if (active) {
                    setAccount(null);
                    setAccountStatus('error');
                }
            });

        challengeGateway.getDailyChallenge(settings.language)
            .then((challenge) => {
                if (active) {
                    setDailyChallenge(challenge);
                }
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [settings.language]);

    useEffect(() => {
        if (!account) {
            return;
        }

        planSyncGateway.syncSkillProfile(skillProfile, {
            achievements,
            streakState: { current: sessionStreak, weeklyGoal }
        }).catch(() => {});
    }, [account, achievements, sessionStreak, skillProfile, weeklyGoal]);

    useEffect(() => {
        if (!account) {
            return;
        }

        planSyncGateway.syncTrainingPlan(trainingPlan).catch(() => {});
    }, [account, trainingPlan]);

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

    const setCustomDraft = (nextConfig, text = settings.customWordBankText) => {
        const nextDraft = createCustomDraft(text, { ...nextConfig, source: 'custom' }, { language: settings.language });
        setCurrentDraft(nextDraft);
        setPracticeError(null);
        setAiPracticeStatus('idle');
        return nextDraft;
    };

    const applyTrainingTask = (task, context) => {
        if (!task) {
            return null;
        }

        const nextConfig = normalizeConfig(task.config);
        const draft = createDraftFromTrainingStep(task, settings.language);

        setConfigState(nextConfig);
        setCurrentDraft(draft);
        setPracticeError(null);
        setAiPracticeStatus('idle');
        setActiveSessionContext(context || null);

        return draft;
    };

    const createOrRefreshTrainingPlan = (profile = skillProfile) => {
        if (!profile) {
            return null;
        }

        const nextPlan = createStarterTrainingPlan(profile, settings.language);
        setTrainingPlan(nextPlan);
        return nextPlan;
    };

    const startDiagnosticJourney = () => {
        const existingJourney = diagnosticJourney?.status === 'active'
            ? diagnosticJourney
            : createDiagnosticJourney(settings.language);
        const activeStep = getActiveJourneyStep(existingJourney);

        setDiagnosticJourney(existingJourney);
        applyTrainingTask(activeStep, {
            type: 'diagnostic',
            journeyId: existingJourney.id,
            stepId: activeStep?.id || null
        });

        return existingJourney;
    };

    const startTrainingPlanStep = () => {
        const nextPlan = trainingPlan?.status === 'active'
            ? trainingPlan
            : createOrRefreshTrainingPlan(skillProfile);
        const activeStep = getActiveTrainingStep(nextPlan);

        if (!activeStep) {
            return null;
        }

        applyTrainingTask(activeStep, {
            type: 'plan',
            planId: nextPlan.id,
            stepId: activeStep.id
        });

        return activeStep;
    };

    const startRecommendedSession = () => {
        if (!skillProfile) {
            startDiagnosticJourney();
            return 'diagnostic';
        }

        startTrainingPlanStep();
        return 'plan';
    };

    const applyCustomWordBank = (text, options = {}) => {
        const nextText = String(text || '');
        const nextSettings = {
            ...settings,
            customWordBankText: nextText
        };
        const nextConfig = normalizeConfig({
            ...config,
            source: 'custom'
        });

        setSettingsState(nextSettings);
        setConfigState(nextConfig);
        setCustomDraft(nextConfig, nextText);

        if (options.activate !== false) {
            setActiveSessionContext(null);
        }

        return nextText;
    };

    const hydrateFromCloud = async (user) => {
        if (!user) {
            return null;
        }

        const [remoteSessions, remoteProfile, remotePlan] = await Promise.all([
            sessionSyncGateway.pullSessions(),
            planSyncGateway.pullSkillProfile(),
            planSyncGateway.pullTrainingPlan()
        ]);

        if (remoteSessions.length) {
            saveSessions(remoteSessions);
            setSessions(remoteSessions);
            setLastCompletedSession(remoteSessions[0] || null);
        } else if (sessions.length) {
            await Promise.all(sessions.map((session) => sessionSyncGateway.syncSession(session)));
        }

        if (remoteProfile) {
            setSkillProfile(remoteProfile);
        } else if (skillProfile) {
            await planSyncGateway.syncSkillProfile(skillProfile, {
                achievements,
                streakState: { current: sessionStreak, weeklyGoal }
            });
        }

        if (remotePlan) {
            setTrainingPlan(remotePlan);
        } else if (trainingPlan) {
            await planSyncGateway.syncTrainingPlan(trainingPlan);
        }

        return user;
    };

    const signInToCloud = async (displayName) => {
        setAccountStatus('loading');

        try {
            const user = await authGateway.signIn({ displayName });
            setAccount(user);
            setAccountStatus('connected');
            await hydrateFromCloud(user);
            return user;
        } catch (error) {
            setAccountStatus('error');
            throw error;
        }
    };

    const signOutFromCloud = async () => {
        await authGateway.signOut();
        setAccount(null);
        setAccountStatus('idle');
    };

    const exportTrainingData = () => JSON.stringify({
        exportedAt: new Date().toISOString(),
        settings,
        sessions,
        coachAdviceRecords,
        skillProfile,
        trainingPlan,
        diagnosticJourney,
        activeSessionContext
    }, null, 2);

    const importTrainingData = (rawPayload) => {
        const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
        const nextSettings = payload?.settings || settings;
        const nextSessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
        const nextCoachAdviceRecords = Array.isArray(payload?.coachAdviceRecords) ? payload.coachAdviceRecords : [];
        const nextConfig = normalizeConfig(nextSettings.lastConfig || config);

        setSettingsState(nextSettings);
        setConfigState(nextConfig);
        setCurrentDraft(createBuiltinDraft(nextConfig, { language: nextSettings.language || settings.language }));
        setSessions(nextSessions);
        setLastCompletedSession(nextSessions[0] || null);
        setCoachAdviceRecords(nextCoachAdviceRecords);
        setSkillProfile(payload?.skillProfile || null);
        setTrainingPlan(payload?.trainingPlan || null);
        setDiagnosticJourney(payload?.diagnosticJourney || null);
        setActiveSessionContext(payload?.activeSessionContext || null);

        saveSettings(nextSettings);
        saveSessions(nextSessions);
        saveCoachAdvices(nextCoachAdviceRecords);
        saveSkillProfile(payload?.skillProfile || null);
        saveTrainingPlan(payload?.trainingPlan || null);
        saveDiagnosticJourney(payload?.diagnosticJourney || null);
        saveActiveSessionContext(payload?.activeSessionContext || null);

        if (account) {
            Promise.all(nextSessions.map((session) => sessionSyncGateway.syncSession(session))).catch(() => {});
            planSyncGateway.syncSkillProfile(payload?.skillProfile || null, {
                achievements,
                streakState: { current: sessionStreak, weeklyGoal }
            }).catch(() => {});
            planSyncGateway.syncTrainingPlan(payload?.trainingPlan || null).catch(() => {});
        }
    };

    const refreshDailyChallenge = async () => {
        const challenge = await challengeGateway.getDailyChallenge(settings.language);
        setDailyChallenge(challenge);
        return challenge;
    };

    const startDailyChallenge = async () => {
        const challenge = dailyChallenge || await refreshDailyChallenge();
        const nextConfig = normalizeConfig(challenge.config);
        const nextDraft = createDraftFromText(challenge.text, nextConfig, {
            label: challenge.title,
            generatedBy: 'builtin',
            language: settings.language
        });

        setConfigState(nextConfig);
        setCurrentDraft(nextDraft);
        setPracticeError(null);
        setAiPracticeStatus('idle');
        setActiveSessionContext({
            type: 'challenge',
            challengeId: challenge.id,
            stepId: challenge.id
        });

        return challenge;
    };

    const updateConfig = (patch) => {
        setActiveSessionContext(null);
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

        if ((patch.source || nextConfig.source) === 'custom') {
            startTransition(() => {
                setCustomDraft({ ...nextConfig, source: 'custom' });
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
        setActiveSessionContext(null);
    }

    function legacyCompletePractice({ result, timeline }) {
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

    function completePractice({ result, timeline }) {
        const currentTrainingTask = buildTrainingTaskFromState(activeSessionContext, diagnosticJourney, trainingPlan, dailyChallenge);
        const session = {
            id: crypto.randomUUID(),
            config,
            result,
            timeline,
            sourceTextMeta: currentDraft?.sourceTextMeta || {
                source: config.source || 'builtin',
                label: 'Practice text'
            },
            coachAdviceId: null,
            trainingMeta: currentTrainingTask
                ? {
                    type: activeSessionContext?.type || 'free',
                    stepId: currentTrainingTask.id,
                    title: currentTrainingTask.title
                }
                : null
        };

        const nextSessions = appendSession(session);
        setSessions(nextSessions);
        setLastCompletedSession(session);

        if (activeSessionContext?.type === 'diagnostic' && diagnosticJourney) {
            const updatedJourney = advanceJourney(diagnosticJourney, session.id);
            setDiagnosticJourney(updatedJourney);
            setActiveSessionContext(null);

            if (updatedJourney.status === 'complete') {
                const diagnosticSessionIds = updatedJourney.steps
                    .map((step) => step.completedSessionId)
                    .filter(Boolean);
                const diagnosticSessions = nextSessions.filter((item) => diagnosticSessionIds.includes(item.id));
                const nextProfile = buildSkillProfile(diagnosticSessions, settings.language);
                setSkillProfile(nextProfile);
                setTrainingPlan(createStarterTrainingPlan(nextProfile, settings.language));
            }
        } else if (activeSessionContext?.type === 'plan' && trainingPlan) {
            const updatedPlan = advanceTrainingPlan(trainingPlan, session.id);
            setTrainingPlan(updatedPlan);
            setActiveSessionContext(null);
        } else if (activeSessionContext?.type === 'challenge') {
            const previewEntry = createChallengeEntryPreview({
                account,
                skillProfile,
                sessionId: session.id,
                result
            });
            setDailyChallenge((previous) => (
                previous && previous.id === activeSessionContext.challengeId
                    ? {
                        ...previous,
                        leaderboard: mergeChallengeLeaderboardEntries(previous.leaderboard || [], previewEntry)
                    }
                    : previous
            ));
            challengeGateway.submitChallengeResult({
                challengeId: activeSessionContext.challengeId,
                sessionId: session.id,
                result
            }).then((entry) => {
                setDailyChallenge((previous) => (
                    previous && previous.id === activeSessionContext.challengeId
                        ? {
                            ...previous,
                            leaderboard: mergeChallengeLeaderboardEntries(previous.leaderboard || [], entry)
                        }
                        : previous
                ));
            }).catch(() => {});
            setActiveSessionContext(null);
        } else {
            setActiveSessionContext(null);
        }

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
    const activeTrainingStep = getActiveTrainingStep(trainingPlan);
    const activeDiagnosticStep = getActiveJourneyStep(diagnosticJourney);
    const currentTrainingTask = buildTrainingTaskFromState(activeSessionContext, diagnosticJourney, trainingPlan, dailyChallenge);
    const trainingPlanProgress = getTrainingPlanProgress(trainingPlan);
    const configState = buildConfigDomain({
        settings,
        updateSettings,
        config,
        updateConfig,
        applyCustomWordBank
    });
    const sessionState = buildSessionDomain({
        currentDraft,
        setCurrentDraft,
        aiPracticeStatus,
        practiceError,
        setPracticeError,
        currentTrainingTask,
        generateAiPractice,
        restoreAiDraftConfig,
        resetPracticeToBuiltin,
        completePractice,
        startDailyChallenge
    });
    const planState = buildPlanDomain({
        skillProfile,
        trainingPlan,
        diagnosticJourney,
        dailyChallenge,
        activeTrainingStep,
        activeDiagnosticStep,
        currentTrainingTask,
        trainingPlanProgress,
        startDiagnosticJourney,
        startTrainingPlanStep,
        startRecommendedSession,
        refreshDailyChallenge,
        createOrRefreshTrainingPlan
    });
    const historyState = buildHistoryDomain({
        sessions,
        coachAdviceRecords,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        getAdviceForSession,
        getCoachStatusForSession,
        getCoachIssueForSession,
        generateCoachForSession,
        launchNextDrill,
        buildLocalCoachAdvice
    });
    const accountState = buildAccountDomain({
        account,
        accountStatus,
        signInToCloud,
        signOutFromCloud,
        exportTrainingData,
        importTrainingData,
        challengeGateway,
        sessionSyncGateway
    });
    const achievementState = buildAchievementDomain({
        achievements,
        sessionStreak,
        weeklySessions,
        weeklyGoal
    });

    const value = useMemo(() => ({
        configState,
        sessionState,
        planState,
        historyState,
        accountState,
        achievementState,
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
        account,
        accountStatus,
        skillProfile,
        trainingPlan,
        diagnosticJourney,
        dailyChallenge,
        activeTrainingStep,
        activeDiagnosticStep,
        currentTrainingTask,
        trainingPlanProgress,
        sessionStreak,
        weeklySessions,
        weeklyGoal,
        achievements,
        setPracticeError,
        resetPracticeToBuiltin,
        restoreAiDraftConfig,
        generateAiPractice,
        completePractice,
        startDiagnosticJourney,
        startTrainingPlanStep,
        startRecommendedSession,
        startDailyChallenge,
        refreshDailyChallenge,
        createOrRefreshTrainingPlan,
        applyCustomWordBank,
        signInToCloud,
        signOutFromCloud,
        exportTrainingData,
        importTrainingData,
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
        dailyChallenge,
        coachAdviceRecords,
        config,
        configState,
        copy,
        currentDraft,
        currentTrainingTask,
        diagnosticJourney,
        account,
        accountStatus,
        accountState,
        achievementState,
        achievements,
        historyState,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        planState,
        practiceError,
        sessions,
        sessionState,
        settings,
        skillProfile,
        trainingPlan,
        trainingPlanProgress,
        sessionStreak,
        weeklySessions,
        weeklyGoal
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
