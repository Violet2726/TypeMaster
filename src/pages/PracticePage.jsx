import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom';
import { AIWorkshop } from '../components/AIWorkshop';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ConfigPanel } from '../components/ConfigPanel';
import { CustomTextWorkshop } from '../components/CustomTextWorkshop';
import { TypingArea } from '../components/TypingArea';
import { useTypingSession } from '../hooks/useTypingSession';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

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

export function PracticePage() {
    const navigate = useNavigate();
    const {
        copy,
        language,
        settings,
        config,
        updateConfig,
        currentDraft,
        aiPracticeStatus,
        practiceError,
        generateAiPractice,
        resetPracticeToBuiltin,
        restoreAiDraftConfig,
        completePractice,
        currentTrainingTask,
        applyCustomWordBank
    } = usePracticeStore();
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
            const session = completePractice({ result, timeline });
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

    const blocker = useBlocker(useCallback(() => (
        isDirtyRef.current && !bypassBlockerRef.current
    ), []));

    useBeforeUnload(useCallback((event) => {
        if (isDirtyRef.current && !bypassBlockerRef.current) {
            event.preventDefault();
            event.returnValue = '';
        }
    }, []));

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

    const handleConfigChange = useCallback((patch, options = {}) => {
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

    const handleGenerateAi = async () => {
        try {
            await generateAiPractice();
            typingSession.resetSession();
            typingSession.focusInput();
        } catch (error) {
            // store handles the status and error state
        }
    };

    const handleUseBuiltin = () => {
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
    };

    const handleApplyCustomText = () => {
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
    };

    const handleReset = () => {
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
    };

    const handlePrimaryAction = async () => {
        if (config.source === 'ai' && aiPracticeStatus !== 'ready') {
            await handleGenerateAi();
            return;
        }

        if (config.source === 'custom' && !(displayDraft?.words?.length > 0)) {
            setControlsOpen(true);
            return;
        }

        typingSession.focusInput();
    };

    const trainingCopy = getTrainingCopy(language);
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

    return (
        <div className="page-stack practice-page">
            {currentTrainingTask && (
                <section className="panel">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.practice.taskKicker}</p>
                            <h2>{currentTrainingTask.title}</h2>
                        </div>
                        <span className="panel-badge badge-ready">
                            {currentTrainingTask.id.startsWith('daily-')
                                ? trainingCopy.practice.challengeBadge
                                : currentTrainingTask.order <= 3 && currentTrainingTask.id.startsWith('diagnostic')
                                ? trainingCopy.practice.diagnosticBadge
                                : trainingCopy.practice.planBadge}
                        </span>
                    </div>
                    <p className="muted-text">{currentTrainingTask.summary}</p>
                    <p className="muted-text">{trainingCopy.practice.layoutLabel}: {settings.keyboardLayout.toUpperCase()}</p>
                </section>
            )}

            <section className="panel practice-toolbar">
                <div className="practice-toolbar__row">
                    <div>
                        <p className="panel-kicker">{copy.practice.configTitle}</p>
                        <h2>{sourceLabel}</h2>
                    </div>
                    <button type="button" className="ghost-btn ghost-btn--small" onClick={handleReset}>
                        {copy.common.resetRound}
                    </button>
                </div>

                <ConfigPanel
                    copy={copy}
                    language={language}
                    config={config}
                    onConfigChange={handleConfigChange}
                    showAdvanced={controlsOpen}
                    onToggleAdvanced={() => setControlsOpen((value) => !value)}
                />

                {controlsOpen && config.source === 'ai' && (
                    <AIWorkshop
                        copy={copy}
                        language={language}
                        config={config}
                        currentDraft={currentDraft}
                        aiPracticeStatus={aiPracticeStatus}
                        practiceError={practiceError}
                        onConfigChange={handleConfigChange}
                        onGenerate={handleGenerateAi}
                        onRestoreConfig={restoreAiDraftConfig}
                        onUseBuiltin={handleUseBuiltin}
                    />
                )}

                {controlsOpen && config.source === 'builtin' && (
                    <p className="muted-text practice-toolbar__hint">{copy.practice.builtInReady}</p>
                )}

                {controlsOpen && config.source === 'custom' && (
                    <CustomTextWorkshop
                        language={language}
                        value={customText}
                        onChange={setCustomText}
                        onApply={handleApplyCustomText}
                    />
                )}
            </section>

            <TypingArea
                copy={copy}
                words={typingSession.words}
                typedHistory={typingSession.typedHistory}
                currentInput={typingSession.currentInput}
                currentWordIndex={typingSession.currentWordIndex}
                isFocused={typingSession.isFocused}
                status={typingSession.status}
                liveMetrics={typingSession.liveMetrics}
                timerDisplay={typingSession.timerDisplay}
                mode={config.mode}
                sourceLabel={sourceLabel}
                inputRef={typingSession.inputRef}
                onInputChange={typingSession.handleInputChange}
                onKeyDown={typingSession.handleKeyDown}
                onCompositionStart={typingSession.handleCompositionStart}
                onCompositionEnd={typingSession.handleCompositionEnd}
                onFocus={typingSession.handleFocus}
                onBlur={typingSession.handleBlur}
                onActivate={typingSession.focusInput}
                onReset={handleReset}
                isLocked={(config.source === 'ai' && aiPracticeStatus !== 'ready') || isCustomEmpty}
                lockTitle={lockTitle}
                lockBody={lockBody}
            />

            <div className="sticky-action-bar">
                <div>
                    <span className="summary-label">{copy.practice.helperTitle}</span>
                    <strong>{config.source === 'ai' && aiPracticeStatus !== 'ready' ? copy.practice.aiIdle : copy.practice.helperBody}</strong>
                </div>
                <button
                    type="button"
                    className="action-btn primary"
                    onClick={handlePrimaryAction}
                    disabled={config.source === 'ai' && aiPracticeStatus === 'loading'}
                >
                    {getPrimaryActionLabel(copy, config, aiPracticeStatus, typingSession.status)}
                </button>
            </div>

            <ConfirmDialog
                isOpen={Boolean(confirmState)}
                title={confirmState?.title}
                body={confirmState?.body}
                confirmLabel={confirmState?.confirmLabel || copy.common.confirm}
                cancelLabel={confirmState?.cancelLabel || copy.common.cancel}
                onConfirm={() => {
                    const pending = confirmState;
                    setConfirmState(null);
                    pending?.action?.();
                }}
                onCancel={() => setConfirmState(null)}
            />

            <ConfirmDialog
                isOpen={blocker.state === 'blocked'}
                title={copy.practice.confirmLeaveTitle}
                body={copy.practice.confirmLeaveBody}
                confirmLabel={copy.confirm.leave}
                cancelLabel={copy.confirm.stay}
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
        </div>
    );
}

export default PracticePage;
