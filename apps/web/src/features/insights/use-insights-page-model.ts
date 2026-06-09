import { useCallback, useMemo } from 'react';
import { buildInsights } from '@typemaster/domain';
import { getTrainingCopy } from '../../training/copy';

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
    startKeyboardZoneDrill,
    weeklyGoal,
    weeklySessions
}) {
    const insights = useMemo(() => buildInsights(sessions, { keyboardLayout }), [keyboardLayout, sessions]);
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const streakRisk = sessionStreak >= 3 ? trainingCopy.insights.riskLow : trainingCopy.insights.riskHigh;
    const handleKeyboardZoneDrill = useCallback(() => {
        if (!insights.keyboardHotspots.primaryZone) {
            return null;
        }

        const draft = startKeyboardZoneDrill(insights.keyboardHotspots.primaryZone);
        navigate('/practice');
        return draft;
    }, [insights.keyboardHotspots.primaryZone, navigate, startKeyboardZoneDrill]);

    return {
        achievements,
        copy,
        handleKeyboardZoneDrill,
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
