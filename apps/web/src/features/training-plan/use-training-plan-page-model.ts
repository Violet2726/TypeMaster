import { useMemo, useCallback } from 'react';
import { getTrainingCopy } from '../../training/copy';

export function useTrainingPlanPageModel({
    language,
    navigate,
    startTrainingPlanStep,
    trainingPlan,
    trainingPlanProgress
}) {
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);

    const handleContinue = useCallback(() => {
        startTrainingPlanStep();
        navigate('/practice');
    }, [navigate, startTrainingPlanStep]);

    return {
        handleContinue,
        trainingCopy,
        trainingPlan,
        trainingPlanProgress
    };
}
