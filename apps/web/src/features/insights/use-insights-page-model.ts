import { useMemo } from 'react';
import { buildInsights } from '@typemaster/domain';
import { getTrainingCopy } from '../../training/copy';

export function useInsightsPageModel({
    achievements,
    copy,
    keyboardLayout,
    language,
    latestCoachAdvice,
    sessions,
    sessionStreak,
    skillProfile,
    weeklyGoal,
    weeklySessions
}) {
    const insights = useMemo(() => buildInsights(sessions, { keyboardLayout }), [keyboardLayout, sessions]);
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const streakRisk = sessionStreak >= 3 ? trainingCopy.insights.riskLow : trainingCopy.insights.riskHigh;

    return {
        achievements,
        copy,
        insights,
        language,
        latestCoachAdvice,
        sessions,
        skillProfile,
        streakRisk,
        trainingCopy,
        weeklyGoal,
        weeklySessions
    };
}
