import { useMemo, useCallback } from 'react';
import { createDiagnosticJourney } from '@typemaster/domain';
import { getTrainingCopy } from '../../training/copy';

export function useDiagnosticPageModel({
    diagnosticJourney,
    language,
    navigate,
    skillProfile,
    startDiagnosticJourney
}) {
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const activeJourney = diagnosticJourney?.status === 'active' ? diagnosticJourney : null;
    const previewJourney = activeJourney || createDiagnosticJourney(language);

    const handleStart = useCallback(() => {
        startDiagnosticJourney();
        navigate('/practice');
    }, [navigate, startDiagnosticJourney]);

    return {
        activeJourney,
        handleStart,
        previewJourney,
        skillProfile,
        trainingCopy
    };
}
