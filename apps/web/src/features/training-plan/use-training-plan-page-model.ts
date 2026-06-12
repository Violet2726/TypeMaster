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
    const hasPlan = Boolean(trainingPlan);
    const isComplete = trainingPlan?.status === 'complete';

    const handleContinue = useCallback(() => {
        if (!hasPlan || isComplete) {
            startDiagnosticJourney();
        } else {
            startTrainingPlanStep();
        }
        navigate('/practice');
    }, [hasPlan, isComplete, navigate, startDiagnosticJourney, startTrainingPlanStep]);

    const primaryActionLabel = !hasPlan
        ? trainingCopy.home.diagnosticCta
        : isComplete
            ? trainingCopy.result.reassessmentAction
            : trainingCopy.result.continuePlan;
    const summaryBody = !hasPlan
        ? trainingCopy.home.diagnosticBody
        : isComplete
            ? trainingCopy.result.reassessmentDecisionBody
            : (trainingPlan?.summary || trainingCopy.result.planBody);
    const summaryTitle = !hasPlan
        ? trainingCopy.home.diagnosticTitle
        : isComplete
            ? trainingCopy.result.reassessmentDecisionTitle
            : (trainingPlan?.title || trainingCopy.result.planTitle);

    return {
        handleContinue,
        hasPlan,
        isComplete,
        primaryActionLabel,
        summaryBody,
        summaryTitle,
        trainingCopy,
        trainingPlan,
        trainingPlanProgress
    };
}
