/**
 * 练习全局状态仓库。
 *
 * 这里是整个前端业务的核心编排层，统一管理：
 * - 用户设置
 * - 当前练习配置
 * - 当前草稿
 * - 历史练习记录
 * - AI 教练建议缓存
 *
 * 组件层只消费这里暴露的状态和动作，不直接碰存储或 AI 接口。
 */
import { createContext, startTransition, useContext, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_CONFIG,
    buildLocalCoachAdvice,
    createBuiltinDraft,
    deriveComparison
} from '../engine';
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

/**
 * 统一修正配置对象，保证 mode / 时长 / 词数等字段总是合法。
 */
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

export function PracticeProvider({ children }) {
    const initialSettings = loadSettings();
    const initialConfig = normalizeConfig(initialSettings.lastConfig || DEFAULT_CONFIG);

    /**
     * 把需要跨页面共享的状态全部集中在这里。
     */
    const [settings, setSettingsState] = useState(initialSettings);
    const [config, setConfigState] = useState(initialConfig);
    const [sessions, setSessions] = useState(loadSessions());
    const [coachAdviceRecords, setCoachAdviceRecords] = useState(loadCoachAdvices());
    const [currentDraft, setCurrentDraft] = useState(() => createBuiltinDraft(initialConfig));
    const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
    const [practiceError, setPracticeError] = useState('');
    const [isAiDraftStale, setIsAiDraftStale] = useState(false);
    const [lastCompletedSession, setLastCompletedSession] = useState(() => loadSessions()[0] || null);

    /**
     * 设置与最近配置发生变化后，立即同步回本地存储。
     */
    useEffect(() => {
        saveSettings({
            ...settings,
            lastConfig: config
        });
    }, [settings, config]);

    const updateSettings = (patch) => {
        setSettingsState((previous) => ({
            ...previous,
            ...patch
        }));
    };

    /**
     * 切回标准词库草稿，并清空 AI 生成状态。
     */
    const setBuiltinDraft = (nextConfig) => {
        setCurrentDraft(createBuiltinDraft({ ...nextConfig, source: 'builtin' }));
        setPracticeError('');
        setIsAiDraftStale(false);
    };

    /**
     * 更新练习配置。
     * - builtin 模式下立即重建草稿
     * - ai 模式下只标记“当前草稿已过期”，等用户主动重新生成
     */
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

        setIsAiDraftStale(true);
    };

    /**
     * 请求 AI 生成新的练习文本。
     */
    async function generateAiPractice({ promptOverride = '', configPatch = {} } = {}) {
        const nextConfig = normalizeConfig({
            ...config,
            ...configPatch,
            source: 'ai'
        });

        setConfigState(nextConfig);
        setIsGeneratingPractice(true);
        setPracticeError('');

        try {
            const draft = await generatePracticeText(nextConfig, promptOverride);
            setCurrentDraft(draft);
            setIsAiDraftStale(false);
            return draft;
        } catch (error) {
            console.error('Failed to generate AI practice', error);
            setPracticeError('AI 训练文本生成失败，已保留当前练习内容。');
            if (!currentDraft) {
                setBuiltinDraft({ ...nextConfig, source: 'builtin' });
            }
            throw error;
        } finally {
            setIsGeneratingPractice(false);
        }
    }

    /**
     * 回到标准词库模式。
     */
    function resetPracticeToBuiltin() {
        const nextConfig = normalizeConfig({
            ...config,
            source: 'builtin'
        });

        setConfigState(nextConfig);
        setBuiltinDraft(nextConfig);
    }

    /**
     * 一轮练习完成后，立刻落一条 session。
     */
    function completePractice({ result, timeline }) {
        const session = {
            id: crypto.randomUUID(),
            config,
            result,
            timeline,
            sourceTextMeta: currentDraft?.sourceTextMeta || { source: config.source || 'builtin' },
            coachAdviceId: null
        };

        const nextSessions = appendSession(session);
        setSessions(nextSessions);
        setLastCompletedSession(session);

        /**
         * 同步网关当前只是占位，因此这里只做无害调用。
         */
        sessionSyncGateway.syncSession(session).catch(() => {});
        return session;
    }

    /**
     * 保存教练建议，并把 advice id 回填到 session 上。
     */
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

    /**
     * 优先从内存态查询建议，找不到再从 localStorage 兜底。
     */
    function getAdviceForSession(sessionId) {
        if (!sessionId) return null;
        return coachAdviceRecords.find((record) => record.sessionId === sessionId)
            || getCoachAdviceBySessionId(sessionId);
    }

    /**
     * 为某条 session 生成教练建议。
     * 先尝试 AI，失败则切到本地规则建议。
     */
    async function generateCoachForSession(sessionId) {
        const existing = getAdviceForSession(sessionId);
        if (existing) {
            return existing;
        }

        const session = sessions.find((item) => item.id === sessionId) || lastCompletedSession;
        if (!session) {
            return null;
        }

        const history = sessions.filter((item) => item.id !== session.id);

        try {
            const advice = await generateCoachAdvice({ session, history });
            return saveCoachRecord(session.id, advice, 'ai');
        } catch (error) {
            console.error('Failed to generate AI coach advice', error);
            const fallback = buildFallbackCoachAdvice({ session, history });
            return saveCoachRecord(session.id, fallback, 'local');
        }
    }

    /**
     * 基于“下一练建议”直接生成下一份 AI 草稿。
     */
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
        ? deriveComparison(sessions, lastCompletedSession.id, lastCompletedSession.result)
        : null;

    /**
     * 暴露给全应用的统一上下文值。
     */
    const value = useMemo(() => ({
        settings,
        updateSettings,
        config,
        updateConfig,
        sessions,
        coachAdviceRecords,
        currentDraft,
        setCurrentDraft,
        isGeneratingPractice,
        practiceError,
        isAiDraftStale,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        setPracticeError,
        resetPracticeToBuiltin,
        generateAiPractice,
        completePractice,
        getAdviceForSession,
        generateCoachForSession,
        launchNextDrill,
        challengeGateway,
        sessionSyncGateway,
        buildLocalCoachAdvice
    }), [
        settings,
        config,
        sessions,
        coachAdviceRecords,
        currentDraft,
        isGeneratingPractice,
        practiceError,
        isAiDraftStale,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison
    ]);

    return (
        <PracticeContext.Provider value={value}>
            {children}
        </PracticeContext.Provider>
    );
}

/**
 * 统一的 store 消费入口。
 */
export function usePracticeStore() {
    const context = useContext(PracticeContext);
    if (!context) {
        throw new Error('usePracticeStore must be used within PracticeProvider');
    }
    return context;
}
