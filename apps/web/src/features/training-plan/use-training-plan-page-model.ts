import { useMemo, useCallback } from 'react';
import { getTrainingCopy } from '../../training/copy';

export function useTrainingPlanPageModel({
    language,
    navigate,
    startDiagnosticJourney,
    startTrainingPlanStep,
    trainingPlan,
    trainingPlanProgress
}) {
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const isComplete = trainingPlan?.status === 'complete';

    const handleContinue = useCallback(() => {
        if (isComplete) {
            startDiagnosticJourney();
        } else {
            startTrainingPlanStep();
        }
        navigate('/practice');
    }, [isComplete, navigate, startDiagnosticJourney, startTrainingPlanStep]);

    return {
        handleContinue,
        isComplete,
        primaryActionLabel: isComplete
            ? trainingCopy.result.reassessmentAction
            : trainingCopy.result.continuePlan,
        summaryBody: isComplete
            ? trainingCopy.result.reassessmentDecisionBody
            : (trainingPlan?.summary || trainingCopy.result.planBody),
        summaryTitle: isComplete
            ? trainingCopy.result.reassessmentDecisionTitle
            : (trainingPlan?.title || trainingCopy.result.planTitle),
        trainingCopy,
        trainingPlan,
        trainingPlanProgress
    };
}
