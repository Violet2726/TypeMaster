import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTrainingCopy } from '../../training/copy';
import { buildResultPrescriptionModel } from '../../training/decision-models';
import { useTypingSession } from '../../hooks/useTypingSession';

type ConfigChangeOptions = {
    risky?: boolean,
};

function getPrimaryActionLabel(copy, trainingCopy, config, aiPracticeStatus, status, isCustomEmpty) {
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

    if (config.source === 'custom' && isCustomEmpty) {
        return trainingCopy.practice.customApply;
    }

    return status === 'paused' || status === 'running'
        ? copy.practice.mobileActionResume
        : copy.common.startTyping;
}

function getPrimaryActionHint(copy, trainingCopy, config, aiPracticeStatus, isCustomEmpty, customText) {
    if (config.source === 'ai' && aiPracticeStatus !== 'ready') {
        return copy.practice.aiIdle;
    }

    if (config.source === 'custom' && isCustomEmpty) {
        return customText.trim()
            ? trainingCopy.practice.customBody
            : trainingCopy.practice.customPlaceholder;
    }

    return copy.practice.helperBody;
}

function isDraftForSource(draft, source) {
    const meta = draft?.sourceTextMeta || {};
    const draftSource = meta.source;
    const configSource = draft?.configSnapshot?.source;

    if (!draftSource) {
        return source === 'builtin';
    }

    if (source === 'custom') {
        return draftSource === 'custom'
            && (!meta.generatedBy || meta.generatedBy === 'custom')
            && (!configSource || configSource === 'custom');
    }

    if (source === 'ai') {
        return draftSource === 'ai'
            && (!meta.generatedBy || meta.generatedBy === 'ai')
            && (!configSource || configSource === 'ai');
    }

    return draftSource === 'builtin'
        && (!configSource || configSource === 'builtin');
}

function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}

function readNumber(value, key) {
    return Number(value && typeof value === 'object' ? value[key] || 0 : 0);
}

function buildAdaptiveMetricLabel(copy, trainingCopy, focus, metrics = {}, config = {}) {
    if (focus === 'accuracy') {
        return `${readNumber(metrics, 'accuracy')}% ${copy.common.accuracy}`;
    }

    if (focus === 'rhythm') {
        return `${readNumber(metrics, 'consistency')}% ${copy.common.consistency}`;
    }

    if (focus === 'rework') {
        return fillTemplate(trainingCopy.practice.adaptiveRawGap, readNumber(metrics, 'rawGap'));
    }

    return fillTemplate(copy.result.prescriptionWordsDose, readNumber(config, 'wordCount'));
}

function buildAdaptiveDrillInsight({ copy, currentDraft, status, trainingCopy }) {
    const meta = currentDraft?.sourceTextMeta || {};

    if (status !== 'idle' || meta.generatedBy !== 'adaptive') {
        return null;
    }

    const focus = meta.adaptiveFocus || meta.template || 'speed';
    const focusLabel = trainingCopy.practice.adaptiveFocusLabels?.[focus] || trainingCopy.practice.adaptiveFocusLabels?.speed;
    const reason = trainingCopy.practice.adaptiveReasons?.[focus] || trainingCopy.practice.adaptiveReasons?.speed;
    const hotspots = Array.isArray(meta.adaptiveHotspots) ? meta.adaptiveHotspots.filter(Boolean).slice(0, 4) : [];

    return {
        kicker: trainingCopy.practice.adaptiveKicker,
        title: focusLabel,
        body: reason,
        chips: [
            {
                label: trainingCopy.practice.adaptiveFocusLabel,
                value: focusLabel
            },
            {
                label: trainingCopy.practice.adaptiveSignalLabel,
                value: buildAdaptiveMetricLabel(copy, trainingCopy, focus, meta.adaptiveMetrics, currentDraft.configSnapshot)
            },
            {
                label: trainingCopy.practice.adaptiveHotspotLabel,
                value: hotspots.length ? hotspots.join(' / ') : trainingCopy.practice.adaptiveNoHotspots
            }
        ]
    };
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

    const hasDraftForCurrentSource = isDraftForSource(currentDraft, config.source);
    const displayDraft = config.source === 'ai'
        ? aiPracticeStatus === 'ready' && hasDraftForCurrentSource
            ? currentDraft
            : null
        : hasDraftForCurrentSource
            ? currentDraft
            : null;

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
            const isMobileViewport = typeof window.matchMedia === 'function'
                && window.matchMedia('(max-width: 720px)').matches;

            if (isMobileViewport) {
                return undefined;
            }

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
        if (!customText.trim()) {
            setControlsOpen(true);
            return;
        }

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
            if (customText.trim()) {
                handleApplyCustomText();
            }
            return;
        }

        typingSession.focusInput();
    }, [aiPracticeStatus, config.source, customText, displayDraft?.words?.length, handleApplyCustomText, handleGenerateAi, typingSession]);

    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const adaptiveDrillInsight = useMemo(() => buildAdaptiveDrillInsight({
        copy,
        currentDraft: displayDraft,
        status: typingSession.status,
        trainingCopy
    }), [copy, displayDraft, trainingCopy, typingSession.status]);
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
    const primaryActionLabel = getPrimaryActionLabel(copy, trainingCopy, config, aiPracticeStatus, typingSession.status, isCustomEmpty);
    const primaryActionHint = getPrimaryActionHint(copy, trainingCopy, config, aiPracticeStatus, isCustomEmpty, customText);
    const isPrimaryActionDisabled = (config.source === 'ai' && aiPracticeStatus === 'loading')
        || (config.source === 'custom' && isCustomEmpty && !customText.trim());

    return {
        aiPracticeStatus,
        adaptiveDrillInsight,
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
        primaryActionHint,
        isPrimaryActionDisabled,
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
