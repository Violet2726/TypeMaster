import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTrainingCopy } from '../../training/copy';
import { buildResultPrescriptionModel } from '../../training/decision-models';
import { useTypingSession } from '../../hooks/useTypingSession';

type ConfigChangeOptions = {
    risky?: boolean,
};

function getPrimaryActionLabel(copy, config, aiPracticeStatus, status) {
    if (config.source === 'ai') {
        if (aiPracticeStatus === 'loading') return copy.common.loading;
        if (aiPracticeStatus === 'ready') {
            return status === 'paused' || status === 'running'
                ? copy.practice.mobileActionResume
                : copy.practice.mobileActionReady;
        }
        return aiPracticeStatus === 'stale'
            ? copy.common.reGenerateAiText
            : copy.practice.mobileActionGenerate;
    }

    return status === 'paused' || status === 'running'
        ? copy.practice.mobileActionResume
        : copy.common.startTyping;
}

export function usePracticePageModel({
    applyCustomWordBank,
    aiPracticeStatus,
    config,
    copy,
    currentDraft,
    currentTrainingTask,
    generateAiPractice,
    language,
    lastCompletedSession,
    latestCoachAdvice,
    navigate,
    practiceError,
    recordCompletedSession,
    resetPracticeToBuiltin,
    restoreAiDraftConfig,
    settings,
    updateConfig
}) {
    const [confirmState, setConfirmState] = useState(null);
    const [controlsOpen, setControlsOpen] = useState(() => config.source === 'ai');
    const [customText, setCustomText] = useState(() => settings.customWordBankText || '');
    const bypassBlockerRef = useRef(false);
    const isDirtyRef = useRef(false);

    const displayDraft = config.source === 'ai' && aiPracticeStatus !== 'ready'
        ? null
        : currentDraft;

    const typingSession = useTypingSession({
        draft: displayDraft,
        config,
        soundEffects: settings.soundEffects,
        onComplete: ({ result, timeline }) => {
            bypassBlockerRef.current = true;
            const session = recordCompletedSession({ result, timeline });
            navigate(`/result?session=${session.id}`);
        }
    });

    const isDirty = useMemo(() => (
        typingSession.status !== 'complete'
        && (
            typingSession.currentInput.length > 0
            || typingSession.typedHistory.length > 0
            || typingSession.status === 'running'
            || typingSession.status === 'paused'
        )
    ), [
        typingSession.currentInput.length,
        typingSession.status,
        typingSession.typedHistory.length
    ]);

    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    const shouldBlockNavigation = useCallback(() => (
        isDirtyRef.current && !bypassBlockerRef.current
    ), []);

    const handleBeforeUnload = useCallback((event) => {
        if (shouldBlockNavigation()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }, [shouldBlockNavigation]);

    useEffect(() => {
        bypassBlockerRef.current = false;
    }, [displayDraft?.id]);

    useEffect(() => {
        if (config.source === 'ai') {
            setControlsOpen(true);
        }
    }, [config.source]);

    useEffect(() => {
        setCustomText(settings.customWordBankText || '');
    }, [settings.customWordBankText]);

    useEffect(() => {
        if ((config.source === 'builtin' || aiPracticeStatus === 'ready') && displayDraft?.id) {
            const timer = window.setTimeout(() => {
                typingSession.focusInput();
            }, 120);

            return () => {
                window.clearTimeout(timer);
            };
        }

        return undefined;
    }, [aiPracticeStatus, config.source, displayDraft?.id, typingSession.focusInput]);

    const commitConfigChange = useCallback((patch) => {
        updateConfig(patch);
    }, [updateConfig]);

    const requestRiskyAction = useCallback((payload) => {
        if (!isDirty) {
            payload.action();
            return;
        }

        setConfirmState(payload);
    }, [isDirty]);

    const handleConfigChange = useCallback((patch, options: ConfigChangeOptions = {}) => {
        if (options.risky) {
            requestRiskyAction({
                title: copy.practice.confirmConfigTitle,
                body: copy.practice.confirmConfigBody,
                confirmLabel: copy.confirm.apply,
                cancelLabel: copy.confirm.stay,
                action: () => {
                    typingSession.resetSession();
                    commitConfigChange(patch);
                }
            });
            return;
        }

        commitConfigChange(patch);
    }, [commitConfigChange, copy.confirm.apply, copy.confirm.stay, copy.practice.confirmConfigBody, copy.practice.confirmConfigTitle, requestRiskyAction, typingSession]);

    const handleGenerateAi = useCallback(async () => {
        try {
            await generateAiPractice();
            typingSession.resetSession();
            typingSession.focusInput();
        } catch {
            // store already captures the error state
        }
    }, [generateAiPractice, typingSession]);

    const handleUseBuiltin = useCallback(() => {
        requestRiskyAction({
            title: copy.practice.confirmConfigTitle,
            body: copy.practice.confirmConfigBody,
            confirmLabel: copy.confirm.apply,
            cancelLabel: copy.confirm.stay,
            action: () => {
                typingSession.resetSession();
                resetPracticeToBuiltin();
            }
        });
    }, [copy.confirm.apply, copy.confirm.stay, copy.practice.confirmConfigBody, copy.practice.confirmConfigTitle, requestRiskyAction, resetPracticeToBuiltin, typingSession]);

    const handleApplyCustomText = useCallback(() => {
        requestRiskyAction({
            title: copy.practice.confirmConfigTitle,
            body: copy.practice.confirmConfigBody,
            confirmLabel: copy.confirm.apply,
            cancelLabel: copy.confirm.stay,
            action: () => {
                typingSession.resetSession();
                applyCustomWordBank(customText);
            }
        });
    }, [applyCustomWordBank, copy.confirm.apply, copy.confirm.stay, copy.practice.confirmConfigBody, copy.practice.confirmConfigTitle, customText, requestRiskyAction, typingSession]);

    const handleReset = useCallback(() => {
        if (!isDirty) {
            typingSession.resetSession();
            return;
        }

        setConfirmState({
            title: copy.practice.confirmResetTitle,
            body: copy.practice.confirmResetBody,
            confirmLabel: copy.confirm.reset,
            cancelLabel: copy.confirm.stay,
            action: () => typingSession.resetSession()
        });
    }, [copy.confirm.reset, copy.confirm.stay, copy.practice.confirmResetBody, copy.practice.confirmResetTitle, isDirty, typingSession]);

    const handlePrimaryAction = useCallback(async () => {
        if (config.source === 'ai' && aiPracticeStatus !== 'ready') {
            await handleGenerateAi();
            return;
        }

        if (config.source === 'custom' && !(displayDraft?.words?.length > 0)) {
            setControlsOpen(true);
            return;
        }

        typingSession.focusInput();
    }, [aiPracticeStatus, config.source, displayDraft?.words?.length, handleGenerateAi, typingSession]);

    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const latestSessionCoachRecord = latestCoachAdvice?.sessionId === lastCompletedSession?.id
        ? latestCoachAdvice
        : null;
    const nextRoundBrief = useMemo(() => (
        lastCompletedSession && typingSession.status === 'idle'
            ? buildResultPrescriptionModel({
                copy,
                session: lastCompletedSession,
                coachRecord: latestSessionCoachRecord
            })
            : null
    ), [copy, lastCompletedSession, latestSessionCoachRecord, typingSession.status]);
    const isCustomEmpty = config.source === 'custom' && !(displayDraft?.words?.length > 0);
    const lockTitle = config.source === 'ai'
        ? copy.practice.wordsLockedTitle
        : isCustomEmpty
            ? trainingCopy.practice.customSource
            : '';
    const lockBody = config.source === 'ai'
        ? copy.practice.wordsLockedBody
        : isCustomEmpty
            ? trainingCopy.practice.customBody
            : '';
    const sourceLabel = displayDraft?.sourceTextMeta?.label
        || (config.source === 'ai'
            ? copy.practice.sourceAi
            : config.source === 'custom'
                ? trainingCopy.practice.customSource
                : copy.practice.sourceBuiltin);
    const primaryActionLabel = getPrimaryActionLabel(copy, config, aiPracticeStatus, typingSession.status);

    return {
        aiPracticeStatus,
        confirmState,
        controlsOpen,
        currentDraft,
        currentTrainingTask,
        customText,
        displayDraft,
        handleApplyCustomText,
        handleConfigChange,
        handleGenerateAi,
        handlePrimaryAction,
        handleReset,
        handleUseBuiltin,
        isCustomEmpty,
        isDirty,
        lockBody,
        lockTitle,
        nextRoundBrief,
        practiceError,
        primaryActionLabel,
        restoreAiDraftConfig,
        handleBeforeUnload,
        setConfirmState,
        setControlsOpen,
        setCustomText,
        sourceLabel,
        shouldBlockNavigation,
        trainingCopy,
        typingSession
    };
}
