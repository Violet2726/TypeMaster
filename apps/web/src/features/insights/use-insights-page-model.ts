import { useCallback, useMemo } from 'react';
import { buildInsights, buildTargetedDrillTrend } from '@typemaster/domain';
import { getTrainingCopy } from '../../training/copy';

function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}

function formatSignedValue(value) {
    return `${value >= 0 ? '+' : ''}${value}`;
}

function formatCoachComparisonSummary(comparison, language) {
    if (!comparison) {
        return '';
    }

    if (comparison.wpmDelta === null || comparison.accuracyDelta === null) {
        if (comparison.label === 'baseline') {
            return language === 'en-US'
                ? 'This is your first valid sample. Future sessions will start forming a trend baseline.'
                : '这是你的第一条有效样本，后续结果会开始形成趋势比较。';
        }

        return comparison.summary || '';
    }

    const signedWpm = formatSignedValue(comparison.wpmDelta);
    const signedAccuracy = formatSignedValue(comparison.accuracyDelta);

    return language === 'en-US'
        ? `Versus the recent 5-session average, speed is ${signedWpm} and accuracy is ${signedAccuracy}%.`
        : `相比最近 5 次平均值，速度 ${signedWpm}，准确率 ${signedAccuracy}%。`;
}

function getTargetedToneMeta(copy, tone) {
    if (tone === 'success') {
        return {
            badge: copy.result.targetedFeedbackReady,
            badgeTone: 'ready'
        };
    }

    if (tone === 'progress') {
        return {
            badge: copy.result.targetedFeedbackProgress,
            badgeTone: 'stale'
        };
    }

    return {
        badge: copy.result.targetedFeedbackRetry,
        badgeTone: 'error'
    };
}

function getTargetedAreaLabel(copy, trainingCopy, summary) {
    if (summary.type === 'adaptive') {
        return trainingCopy.practice.adaptiveFocusLabels?.[summary.focus]
            || trainingCopy.practice.adaptiveFocusLabels?.speed
            || copy.common.emptyValue;
    }

    return copy.insights.keyboardZoneLabels?.[summary.zoneId] || summary.zoneId || copy.common.emptyValue;
}

function getTargetedLatestBody(copy, summary) {
    if (summary.type === 'adaptive') {
        if (summary.tone === 'success') {
            return copy.result.targetedFeedbackAdaptiveClear;
        }

        if (summary.tone === 'progress') {
            return copy.result.targetedFeedbackAdaptiveProgress;
        }

        return copy.result.targetedFeedbackAdaptiveStalled;
    }

    if (summary.tone === 'success') {
        return copy.result.targetedFeedbackKeyboardClear;
    }

    if (summary.tone === 'progress') {
        return copy.result.targetedFeedbackKeyboardProgress;
    }

    return copy.result.targetedFeedbackKeyboardStalled;
}

function buildTargetedTrendModel(copy, trainingCopy, trend) {
    if (!trend?.total || !trend.latest) {
        return {
            title: copy.insights.targetedTitle,
            body: copy.insights.targetedBody,
            empty: copy.insights.targetedEmpty,
            counts: [],
            latest: null,
            areas: []
        };
    }

    return {
        title: copy.insights.targetedTitle,
        body: copy.insights.targetedBody,
        empty: copy.insights.targetedEmpty,
        counts: [
            {
                id: 'rounds',
                label: copy.insights.targetedRoundsLabel,
                value: String(trend.total)
            },
            {
                id: 'improved',
                label: copy.insights.targetedImprovedLabel,
                value: `${trend.improvementRate}%`
            },
            {
                id: 'cleared',
                label: copy.insights.targetedClearedLabel,
                value: String(trend.successCount)
            },
            {
                id: 'retry',
                label: copy.insights.targetedRetryLabel,
                value: String(trend.stalledCount)
            }
        ],
        latest: {
            areaLabel: getTargetedAreaLabel(copy, trainingCopy, trend.latest),
            body: getTargetedLatestBody(copy, trend.latest),
            remaining: trend.latest.remainingTargets?.length
                ? trend.latest.remainingTargets.join(' / ')
                : copy.insights.targetedAreaStable,
            ...getTargetedToneMeta(copy, trend.latest.tone)
        },
        areas: trend.areas.slice(0, 4).map((area) => ({
            id: area.id,
            label: getTargetedAreaLabel(copy, trainingCopy, area),
            note: `${fillTemplate(copy.insights.targetedAreaRounds, area.sessions)} / ${area.latestRemainingTargets?.length
                ? fillTemplate(copy.insights.targetedAreaShowing, area.latestRemainingTargets.join(' / '))
                : copy.insights.targetedAreaStable}`,
            ...getTargetedToneMeta(copy, area.latestTone)
        }))
    };
}

export function useInsightsPageModel({
    achievements,
    copy,
    keyboardLayout,
    language,
    latestCoachAdvice,
    navigate,
    sessions,
    sessionStreak,
    skillProfile,
    startDiagnosticJourney,
    startKeyboardZoneDrill,
    weeklyGoal,
    weeklySessions
}) {
    const insights = useMemo(() => buildInsights(sessions, { keyboardLayout }), [keyboardLayout, sessions]);
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const targetedTrend = useMemo(() => buildTargetedTrendModel(
        copy,
        trainingCopy,
        buildTargetedDrillTrend(sessions, { limit: 8 })
    ), [copy, sessions, trainingCopy]);
    const streakRisk = sessionStreak >= 3
        ? { label: trainingCopy.insights.riskLow, tone: 'ready' }
        : { label: trainingCopy.insights.riskHigh, tone: 'warning' };
    const latestCoachComparisonSummary = useMemo(
        () => formatCoachComparisonSummary(latestCoachAdvice?.comparison, language),
        [language, latestCoachAdvice?.comparison]
    );
    const handleKeyboardZoneDrill = useCallback(() => {
        if (!insights.keyboardHotspots.primaryZone) {
            return null;
        }

        const draft = startKeyboardZoneDrill(insights.keyboardHotspots.primaryZone);
        navigate('/practice');
        return draft;
    }, [insights.keyboardHotspots.primaryZone, navigate, startKeyboardZoneDrill]);
    const handleAssessment = useCallback(() => {
        startDiagnosticJourney();
        navigate('/practice');
    }, [navigate, startDiagnosticJourney]);

    return {
        achievements,
        copy,
        handleAssessment,
        handleKeyboardZoneDrill,
        insights,
        language,
        latestCoachAdvice,
        latestCoachComparisonSummary,
        sessions,
        skillProfile,
        streakRisk,
        targetedTrend,
        trainingCopy,
        weeklyGoal,
        weeklySessions
    };
}
