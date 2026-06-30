import { DEFAULT_CONFIG } from './config.js';
import { buildKeyboardHotspotsFromStats } from './insights.js';
import { createBuiltinWords, createDraftFromText, createDraftFromWords, createKeyboardZoneDrillDraft } from './draft.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PROFILE_LEVELS = [
    { id: 'foundation', minWpm: 0, minAccuracy: 0 },
    { id: 'builder', minWpm: 40, minAccuracy: 94 },
    { id: 'fluent', minWpm: 70, minAccuracy: 96 },
    { id: 'sprint', minWpm: 100, minAccuracy: 97 }
];

const KEYBOARD_ZONE_LABELS = {
    'zh-CN': {
        leftTop: '左手 / 上排',
        leftHome: '左手 / 主键位',
        leftBottom: '左手 / 下排',
        rightTop: '右手 / 上排',
        rightHome: '右手 / 主键位',
        rightBottom: '右手 / 下排',
        numberRow: '数字排',
        symbolLayer: '符号层',
        other: '其他输入'
    },
    'en-US': {
        leftTop: 'Left hand / top row',
        leftHome: 'Left hand / home row',
        leftBottom: 'Left hand / bottom row',
        rightTop: 'Right hand / top row',
        rightHome: 'Right hand / home row',
        rightBottom: 'Right hand / bottom row',
        numberRow: 'Number row',
        symbolLayer: 'Symbol layer',
        other: 'Other input'
    }
};

const TRAINING_COPY = {
    'zh-CN': {
        levels: {
            foundation: '基础期',
            builder: '搭建期',
            fluent: '流畅期',
            sprint: '冲刺期'
        },
        focus: {
            accuracy: '准确率',
            rhythm: '节奏稳定',
            symbols: '数字与符号',
            endurance: '长时耐力',
            speed: '速度提升'
        },
        profileSummary: '你的下一阶段应该围绕 {focus} 持续补强。',
        diagnostic: {
            title: '3分钟诊断',
            summary: '完成 3 轮短练习后，系统会生成你的能力画像与 7 天计划。',
            step1Title: '准确率基线',
            step1Body: '先用干净词库测基础命中率。',
            step2Title: '节奏冲刺',
            step2Body: '用更短的倒计时观察速度波动。',
            step3Title: '数字符号适应',
            step3Body: '加入数字和标点，确认扩展输入稳定性。'
        },
        plan: {
            title: '7天起步计划',
            summary: '先把最明显的短板打稳，再逐步加压。',
            day1: ['精度回正', '用中等时长找回稳定命中率。'],
            day2: ['节奏定型', '缩短时长，先练稳定输出。'],
            day3: ['弱项补强', '围绕最近最常见错误做针对性重复。'],
            keyboardDayTitle: '{zone}回正',
            keyboardDayBody: '最近 {count} 轮都在这个区域掉点，先用一轮计划专项把压力降下来。',
            day4: ['耐力拉伸', '延长一轮时长，避免后半段掉速。'],
            day5: ['数字符号', '把数字和标点重新带回主流程。'],
            day6: ['压力回合', '在更紧凑的节奏下维持准确率。'],
            day7: ['复盘检定', '再做一轮综合回合，检查这一周是否站稳。']
        }
    },
    'en-US': {
        levels: {
            foundation: 'Foundation',
            builder: 'Builder',
            fluent: 'Fluent',
            sprint: 'Sprint'
        },
        focus: {
            accuracy: 'accuracy',
            rhythm: 'rhythm',
            symbols: 'symbols',
            endurance: 'endurance',
            speed: 'speed'
        },
        profileSummary: 'Your next phase should focus on reinforcing {focus}.',
        diagnostic: {
            title: '3-minute assessment',
            summary: 'Finish three short rounds and the app will generate a skill profile and a 7-day plan.',
            step1Title: 'Accuracy baseline',
            step1Body: 'Measure clean hit rate with the standard word bank.',
            step2Title: 'Rhythm sprint',
            step2Body: 'Use a shorter timer to reveal speed variance.',
            step3Title: 'Numbers and punctuation',
            step3Body: 'Add numbers and punctuation to check expanded input stability.'
        },
        plan: {
            title: '7-day starter plan',
            summary: 'Stabilize the clearest weakness first, then add pressure.',
            day1: ['Reset accuracy', 'Use a mid-length round to bring hit rate back under control.'],
            day2: ['Lock the rhythm', 'Shorten the round and focus on smooth output.'],
            day3: ['Weak spot drill', 'Repeat the patterns that caused the latest mistakes.'],
            keyboardDayTitle: '{zone} reset',
            keyboardDayBody: 'This zone stayed under pressure across {count} recent rounds. Use one planned drill to cool it down before wider practice.',
            day4: ['Stretch endurance', 'Lengthen the round so the back half does not collapse.'],
            day5: ['Numbers and punctuation', 'Bring symbols back into the main loop.'],
            day6: ['Pressure round', 'Hold accuracy while the pace gets tighter.'],
            day7: ['Review checkpoint', 'Run a blended round and check whether the week held.']
        }
    }
};

function getTrainingLocale(language = 'zh-CN') {
    return TRAINING_COPY[language] || TRAINING_COPY['zh-CN'];
}

function normalizeTrainingOptions(languageOrOptions = 'zh-CN') {
    if (languageOrOptions && typeof languageOrOptions === 'object' && !Array.isArray(languageOrOptions)) {
        return {
            language: languageOrOptions.language || 'zh-CN',
            keyboardLayout: languageOrOptions.keyboardLayout || 'qwerty'
        };
    }

    return {
        language: languageOrOptions || 'zh-CN',
        keyboardLayout: 'qwerty'
    };
}

function toConfig(overrides) {
    return {
        ...DEFAULT_CONFIG,
        ...overrides
    };
}

function average(values) {
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function toDateKey(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

function countLabels(items) {
    const counts = new Map();
    items.forEach((item) => {
        if (!item) return;
        counts.set(item, (counts.get(item) || 0) + 1);
    });
    return [...counts.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([label, count]) => ({ label, count }));
}

function getKeyboardZoneLabel(zoneId, language = 'zh-CN') {
    const labels = KEYBOARD_ZONE_LABELS[language] || KEYBOARD_ZONE_LABELS['zh-CN'];
    return labels[zoneId] || labels.other;
}

function fillTemplate(template, values = {}) {
    return Object.entries(values).reduce((result, [key, value]) => (
        result.replace(`{${key}}`, value)
    ), String(template || ''));
}

function resolveProfileLevel(avgWpm, avgAccuracy) {
    if (avgWpm >= PROFILE_LEVELS[3].minWpm && avgAccuracy >= PROFILE_LEVELS[3].minAccuracy) {
        return PROFILE_LEVELS[3].id;
    }

    if (avgWpm >= PROFILE_LEVELS[2].minWpm && avgAccuracy >= PROFILE_LEVELS[2].minAccuracy) {
        return PROFILE_LEVELS[2].id;
    }

    if (avgWpm >= PROFILE_LEVELS[1].minWpm && avgAccuracy >= PROFILE_LEVELS[1].minAccuracy) {
        return PROFILE_LEVELS[1].id;
    }

    return PROFILE_LEVELS[0].id;
}

function buildWeakZones(sessions, metrics, language) {
    const locale = getTrainingLocale(language);
    const weakZones = [];
    const symbolSessions = sessions.filter((session) => session?.config?.includeNumbers || session?.config?.includePunctuation);
    const symbolAccuracy = average(symbolSessions.map((session) => session?.result?.accuracy || 0));
    const longSessions = sessions.filter((session) => (session?.result?.durationSeconds || 0) >= 45);
    const lateRoundConsistency = average(longSessions.map((session) => session?.result?.consistency || 0));

    if (metrics.avgAccuracy < 95) {
        weakZones.push({
            id: 'accuracy',
            label: locale.focus.accuracy,
            score: metrics.avgAccuracy
        });
    }

    if (metrics.avgConsistency < 84) {
        weakZones.push({
            id: 'rhythm',
            label: locale.focus.rhythm,
            score: metrics.avgConsistency
        });
    }

    if (symbolSessions.length > 0 && symbolAccuracy < 95) {
        weakZones.push({
            id: 'symbols',
            label: locale.focus.symbols,
            score: symbolAccuracy
        });
    }

    if (longSessions.length > 0 && lateRoundConsistency < 86) {
        weakZones.push({
            id: 'endurance',
            label: locale.focus.endurance,
            score: lateRoundConsistency
        });
    }

    if (metrics.avgWpm < 55) {
        weakZones.push({
            id: 'speed',
            label: locale.focus.speed,
            score: metrics.avgWpm
        });
    }

    return weakZones.sort((left, right) => left.score - right.score);
}

function resolveSessionSurface(session) {
    const explicit = session?.trainingMeta?.surface;
    if (explicit) return explicit;

    const type = session?.trainingMeta?.type;
    if (type === 'game') return 'game';
    if (type === 'challenge') return 'challenge';
    if (type === 'plan') return 'plan';
    if (type === 'diagnostic') return 'diagnostic';

    return 'practice';
}

function countSessionSurfaces(sessions) {
    return sessions.reduce((counts, session) => {
        const surface = resolveSessionSurface(session);
        counts[surface] = (counts[surface] || 0) + 1;
        return counts;
    }, {
        practice: 0,
        diagnostic: 0,
        plan: 0,
        challenge: 0,
        game: 0
    });
}

function buildWeakSpotText(skillProfile) {
    const topWords = (skillProfile?.topErrorWords || []).slice(0, 4);
    const topChars = (skillProfile?.topErrorChars || []).slice(0, 3);

    if (!topWords.length && !topChars.length) {
        return 'steady rhythm steady accuracy calm focus clear motion steady rhythm steady accuracy calm focus clear motion';
    }

    const wordLoop = topWords.length ? `${topWords.join(' ')} ${topWords.join(' ')}` : '';
    const charLoop = topChars.length
        ? topChars.map((char) => `${char}${char} focus ${char}${char}`).join(' ')
        : '';

    return `${wordLoop} ${charLoop} steady control smooth accuracy steady control smooth accuracy`.trim();
}

function buildStep(id, order, tuple, config, options = {}) {
    const { text = '', ...rest } = options;

    return {
        id,
        order,
        title: tuple[0],
        summary: tuple[1],
        config,
        status: 'pending',
        text,
        completedSessionId: null,
        ...rest
    };
}

function readErrorCharStats(session) {
    if (Array.isArray(session?.result?.errorCharStats) && session.result.errorCharStats.length) {
        return session.result.errorCharStats
            .map((item) => ({
                label: String(item?.label || '').trim(),
                count: Math.max(0, Number(item?.count || 0))
            }))
            .filter((item) => item.label && item.count > 0);
    }

    return Array.isArray(session?.result?.topErrorChars)
        ? session.result.topErrorChars.map((label) => ({ label, count: 1 }))
        : [];
}

function buildKeyboardFocus(sessions, keyboardLayout = 'qwerty') {
    const aggregateCounts = new Map();
    const sessionPrimaryZones = [];

    sessions.forEach((session) => {
        const stats = readErrorCharStats(session);
        stats.forEach((item) => {
            aggregateCounts.set(item.label, (aggregateCounts.get(item.label) || 0) + item.count);
        });

        const hotspots = buildKeyboardHotspotsFromStats(stats, { keyboardLayout });
        if (hotspots.primaryZone && hotspots.primaryZone.id !== 'other' && hotspots.primaryZone.count >= 2) {
            sessionPrimaryZones.push(hotspots.primaryZone.id);
        }
    });

    const aggregateStats = [...aggregateCounts.entries()].map(([label, count]) => ({ label, count }));
    const hotspots = buildKeyboardHotspotsFromStats(aggregateStats, { keyboardLayout });
    const primaryZone = hotspots.primaryZone;

    if (!primaryZone || primaryZone.id === 'other') {
        return null;
    }

    return {
        zoneId: primaryZone.id,
        zoneShare: primaryZone.share,
        zoneChars: primaryZone.chars.map((item) => item.label).slice(0, 5),
        repeatedSessionCount: sessionPrimaryZones.filter((zoneId) => zoneId === primaryZone.id).length,
        totalErrors: hotspots.total,
        keyboardLayout
    };
}

function shouldPromoteKeyboardFocus(keyboardFocus) {
    return Boolean(
        keyboardFocus
        && keyboardFocus.zoneId
        && keyboardFocus.zoneId !== 'other'
        && keyboardFocus.repeatedSessionCount >= 2
        && keyboardFocus.zoneShare >= 35
        && keyboardFocus.totalErrors >= 4
    );
}

function buildKeyboardPlanStep(keyboardFocus, language = 'zh-CN') {
    if (!shouldPromoteKeyboardFocus(keyboardFocus)) {
        return null;
    }

    const locale = getTrainingLocale(language);
    const zoneLabel = getKeyboardZoneLabel(keyboardFocus.zoneId, language);
    const title = fillTemplate(locale.plan.keyboardDayTitle, { zone: zoneLabel });
    const summary = fillTemplate(locale.plan.keyboardDayBody, { count: keyboardFocus.repeatedSessionCount });
    const draft = createKeyboardZoneDrillDraft({
        id: keyboardFocus.zoneId,
        share: keyboardFocus.zoneShare,
        chars: keyboardFocus.zoneChars.map((label) => ({ label, count: 1 }))
    }, {
        keyboardLayout: keyboardFocus.keyboardLayout,
        language,
        label: title
    });

    return buildStep('starter-day-3', 3, [title, summary], draft.configSnapshot, {
        generatedBy: 'keyboard-zone',
        keyboardZone: keyboardFocus.zoneId,
        keyboardLayout: keyboardFocus.keyboardLayout,
        keyboardZoneChars: keyboardFocus.zoneChars,
        keyboardZoneShare: keyboardFocus.zoneShare
    });
}

export function createDiagnosticJourney(language = 'zh-CN') {
    const locale = getTrainingLocale(language);
    const steps = [
        {
            id: 'diagnostic-accuracy',
            order: 1,
            title: locale.diagnostic.step1Title,
            summary: locale.diagnostic.step1Body,
            config: toConfig({
                source: 'builtin',
                mode: 'time',
                durationSeconds: 60,
                includeNumbers: false,
                includePunctuation: false
            }),
            status: 'pending',
            text: '',
            completedSessionId: null
        },
        {
            id: 'diagnostic-rhythm',
            order: 2,
            title: locale.diagnostic.step2Title,
            summary: locale.diagnostic.step2Body,
            config: toConfig({
                source: 'builtin',
                mode: 'time',
                durationSeconds: 30,
                includeNumbers: false,
                includePunctuation: false
            }),
            status: 'pending',
            text: '',
            completedSessionId: null
        },
        {
            id: 'diagnostic-symbols',
            order: 3,
            title: locale.diagnostic.step3Title,
            summary: locale.diagnostic.step3Body,
            config: toConfig({
                source: 'builtin',
                mode: 'time',
                durationSeconds: 60,
                includeNumbers: true,
                includePunctuation: true
            }),
            status: 'pending',
            text: '',
            completedSessionId: null
        }
    ];

    return {
        id: `diagnostic-${Date.now()}`,
        type: 'diagnostic',
        title: locale.diagnostic.title,
        summary: locale.diagnostic.summary,
        status: 'active',
        currentStepIndex: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps
    };
}

export function getActiveJourneyStep(journey) {
    if (!journey || !Array.isArray(journey.steps) || journey.status !== 'active') {
        return null;
    }

    return journey.steps[journey.currentStepIndex] || null;
}

export function advanceJourney(journey, sessionId) {
    if (!journey || !Array.isArray(journey.steps)) {
        return journey;
    }

    const nextSteps = journey.steps.map((step, index) => (
        index === journey.currentStepIndex
            ? {
                ...step,
                status: 'complete',
                completedSessionId: sessionId
            }
            : step
    ));

    const isLastStep = journey.currentStepIndex >= nextSteps.length - 1;

    return {
        ...journey,
        steps: nextSteps,
        currentStepIndex: isLastStep ? journey.currentStepIndex : journey.currentStepIndex + 1,
        status: isLastStep ? 'complete' : 'active',
        updatedAt: new Date().toISOString()
    };
}

/**
 * @param {Array<unknown>} sessions
 * @param {string | { language?: string, keyboardLayout?: string }} [languageOrOptions='zh-CN']
 */
export function buildSkillProfile(sessions, languageOrOptions = 'zh-CN') {
    const { language, keyboardLayout } = normalizeTrainingOptions(languageOrOptions);
    const locale = getTrainingLocale(language);
    const safeSessions = Array.isArray(sessions) ? sessions.filter(Boolean) : [];

    if (!safeSessions.length) {
        return null;
    }

    const metrics = {
        avgWpm: average(safeSessions.map((session) => session?.result?.wpm || 0)),
        avgAccuracy: average(safeSessions.map((session) => session?.result?.accuracy || 0)),
        avgConsistency: average(safeSessions.map((session) => session?.result?.consistency || 0)),
        avgDuration: average(safeSessions.map((session) => session?.result?.durationSeconds || 0)),
        surfaces: countSessionSurfaces(safeSessions),
        gameBestScore: Math.max(0, ...safeSessions
            .filter((session) => resolveSessionSurface(session) === 'game')
            .map((session) => session?.trainingMeta?.score || session?.result?.score || 0)),
        gameMaxCombo: Math.max(0, ...safeSessions
            .filter((session) => resolveSessionSurface(session) === 'game')
            .map((session) => session?.trainingMeta?.maxCombo || 0)),
        gameHighestDepth: Math.max(0, ...safeSessions
            .filter((session) => resolveSessionSurface(session) === 'game')
            .map((session) => session?.trainingMeta?.depth || session?.trainingMeta?.areaIndex || 0)),
        gameLongestDurationSeconds: Math.max(0, ...safeSessions
            .filter((session) => resolveSessionSurface(session) === 'game')
            .map((session) => session?.trainingMeta?.durationSeconds || session?.result?.durationSeconds || 0))
    };

    const topErrorChars = countLabels(
        safeSessions.flatMap((session) => session?.result?.topErrorChars || [])
    ).slice(0, 5).map((item) => item.label);
    const topErrorWords = countLabels(
        safeSessions.flatMap((session) => session?.result?.topErrorWords || [])
    ).slice(0, 5).map((item) => item.label);

    const weakZones = buildWeakZones(safeSessions, metrics, language);
    const keyboardFocus = buildKeyboardFocus(safeSessions, keyboardLayout);
    const primaryFocus = weakZones.find((item) => item.id === 'accuracy')?.id
        || weakZones.find((item) => item.id === 'rhythm')?.id
        || weakZones.find((item) => item.id === 'symbols')?.id
        || weakZones.find((item) => item.id === 'endurance')?.id
        || weakZones.find((item) => item.id === 'speed')?.id
        || 'speed';
    const levelId = resolveProfileLevel(metrics.avgWpm, metrics.avgAccuracy);

    return {
        id: `skill-${Date.now()}`,
        createdAt: new Date().toISOString(),
        level: {
            id: levelId,
            label: locale.levels[levelId]
        },
        summary: locale.profileSummary.replace('{focus}', locale.focus[primaryFocus]),
        primaryFocus,
        weakZones,
        topErrorChars,
        topErrorWords,
        keyboardFocus,
        metrics
    };
}

export function createStarterTrainingPlan(skillProfile, language = 'zh-CN') {
    const locale = getTrainingLocale(language);
    const primaryFocus = skillProfile?.primaryFocus || 'speed';
    const weakSpotText = buildWeakSpotText(skillProfile);
    const symbolHeavy = primaryFocus === 'symbols';
    const accuracyHeavy = primaryFocus === 'accuracy';
    const rhythmHeavy = primaryFocus === 'rhythm';
    const enduranceHeavy = primaryFocus === 'endurance';
    const keyboardPlanStep = buildKeyboardPlanStep(skillProfile?.keyboardFocus, language);

    const steps = [
        buildStep('starter-day-1', 1, locale.plan.day1, toConfig({
            source: 'builtin',
            mode: 'time',
            durationSeconds: accuracyHeavy ? 45 : 30,
            includeNumbers: false,
            includePunctuation: false
        })),
        buildStep('starter-day-2', 2, locale.plan.day2, toConfig({
            source: 'builtin',
            mode: 'time',
            durationSeconds: rhythmHeavy ? 20 : 15,
            includeNumbers: false,
            includePunctuation: false
        })),
        keyboardPlanStep || buildStep('starter-day-3', 3, locale.plan.day3, toConfig({
            source: 'builtin',
            mode: 'words',
            wordCount: 35,
            includeNumbers: false,
            includePunctuation: false
        }), { text: weakSpotText }),
        buildStep('starter-day-4', 4, locale.plan.day4, toConfig({
            source: 'builtin',
            mode: 'time',
            durationSeconds: enduranceHeavy ? 75 : 60,
            includeNumbers: false,
            includePunctuation: false
        })),
        buildStep('starter-day-5', 5, locale.plan.day5, toConfig({
            source: 'builtin',
            mode: 'time',
            durationSeconds: 45,
            includeNumbers: true,
            includePunctuation: true
        })),
        buildStep('starter-day-6', 6, locale.plan.day6, toConfig({
            source: 'builtin',
            mode: 'time',
            durationSeconds: symbolHeavy ? 30 : 20,
            includeNumbers: symbolHeavy,
            includePunctuation: symbolHeavy
        })),
        buildStep('starter-day-7', 7, locale.plan.day7, toConfig({
            source: 'builtin',
            mode: 'time',
            durationSeconds: 60,
            includeNumbers: true,
            includePunctuation: true
        }))
    ];

    return {
        id: `plan-${Date.now()}`,
        type: 'starter',
        title: locale.plan.title,
        summary: locale.plan.summary,
        primaryFocus,
        status: 'active',
        currentStepIndex: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps
    };
}

export function getActiveTrainingStep(plan) {
    if (!plan || !Array.isArray(plan.steps) || plan.status !== 'active') {
        return null;
    }

    return plan.steps[plan.currentStepIndex] || null;
}

export function advanceTrainingPlan(plan, sessionId) {
    if (!plan || !Array.isArray(plan.steps)) {
        return plan;
    }

    const nextSteps = plan.steps.map((step, index) => (
        index === plan.currentStepIndex
            ? {
                ...step,
                status: 'complete',
                completedSessionId: sessionId
            }
            : step
    ));

    const isLastStep = plan.currentStepIndex >= nextSteps.length - 1;

    return {
        ...plan,
        steps: nextSteps,
        currentStepIndex: isLastStep ? plan.currentStepIndex : plan.currentStepIndex + 1,
        status: isLastStep ? 'complete' : 'active',
        updatedAt: new Date().toISOString()
    };
}

export function getTrainingPlanProgress(plan) {
    const total = Array.isArray(plan?.steps) ? plan.steps.length : 0;
    const completed = Array.isArray(plan?.steps)
        ? plan.steps.filter((step) => step.status === 'complete').length
        : 0;

    return {
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0
    };
}

export function createDraftFromTrainingStep(step, language = 'zh-CN') {
    if (!step) {
        return null;
    }

    if (step.generatedBy === 'keyboard-zone' || step.keyboardZone) {
        const draft = createKeyboardZoneDrillDraft({
            id: step.keyboardZone || 'other',
            share: Number(step.keyboardZoneShare || 0),
            chars: Array.isArray(step.keyboardZoneChars)
                ? step.keyboardZoneChars.map((label) => ({ label, count: 1 }))
                : []
        }, {
            keyboardLayout: step.keyboardLayout || 'qwerty',
            language,
            label: step.title,
            configOverrides: step.config
        });

        return {
            ...draft,
            sourceTextMeta: {
                ...draft.sourceTextMeta,
                label: step.title
            }
        };
    }

    if (step.text) {
        return createDraftFromText(step.text, step.config, {
            label: step.title,
            generatedBy: 'builtin',
            language
        });
    }

    return createDraftFromWords(createBuiltinWords(step.config), step.config, {
        label: step.title,
        generatedBy: 'builtin',
        language
    });
}

export function calculateSessionStreak(sessions) {
    const safeSessions = Array.isArray(sessions) ? sessions.filter(Boolean) : [];
    if (!safeSessions.length) return 0;

    const uniqueDays = [...new Set(
        safeSessions
            .map((session) => session?.result?.completedAt)
            .filter(Boolean)
            .map((value) => toDateKey(value))
    )].sort((left, right) => right - left);

    if (!uniqueDays.length) {
        return 0;
    }

    const today = toDateKey(Date.now());
    const latest = uniqueDays[0];
    if (today - latest > MS_PER_DAY) {
        return 0;
    }

    let streak = 1;
    for (let index = 1; index < uniqueDays.length; index += 1) {
        if (uniqueDays[index - 1] - uniqueDays[index] === MS_PER_DAY) {
            streak += 1;
            continue;
        }
        break;
    }

    return streak;
}

export function calculateWeeklySessions(sessions) {
    const safeSessions = Array.isArray(sessions) ? sessions.filter(Boolean) : [];
    const weekStart = toDateKey(Date.now()) - (6 * MS_PER_DAY);

    return safeSessions.filter((session) => {
        const completedAt = session?.result?.completedAt;
        return completedAt && toDateKey(completedAt) >= weekStart;
    }).length;
}
