import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom';
import { AIWorkshop } from '../components/AIWorkshop';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ConfigPanel } from '../components/ConfigPanel';
import { TypingArea } from '../components/TypingArea';
import { useTypingSession } from '../hooks/useTypingSession';
import { usePracticeStore } from '../store/practice-store';

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
        config,
        updateConfig,
        currentDraft,
        aiPracticeStatus,
        practiceError,
        generateAiPractice,
        resetPracticeToBuiltin,
        restoreAiDraftConfig,
        completePractice
    } = usePracticeStore();
    const [confirmState, setConfirmState] = useState(null);
    const bypassBlockerRef = useRef(false);
    const isDirtyRef = useRef(false);

    const displayDraft = config.source === 'ai' && aiPracticeStatus !== 'ready'
        ? null
        : currentDraft;

    const typingSession = useTypingSession({
        draft: displayDraft,
        config,
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
            // 状态已经由 store 统一记录。
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

        typingSession.focusInput();
    };

    const lockTitle = config.source === 'ai' ? copy.practice.wordsLockedTitle : '';
    const lockBody = config.source === 'ai' ? copy.practice.wordsLockedBody : '';

    return (
        <div className="page-stack">
            <section className="practice-hero">
                <div>
                    <p className="panel-kicker">{copy.practice.pageTitle}</p>
                    <h1>{copy.practice.pageTitle}</h1>
                    <p className="hero-body">{copy.practice.pageBody}</p>
                </div>
            </section>

            <div className="workspace-layout">
                <div className="workspace-sidebar">
                    <ConfigPanel
                        copy={copy}
                        config={config}
                        onConfigChange={handleConfigChange}
                    />

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
                </div>

                <div className="workspace-main">
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
                        sourceLabel={displayDraft?.sourceTextMeta?.label || copy.common.emptyValue}
                        inputRef={typingSession.inputRef}
                        onInputChange={typingSession.handleInputChange}
                        onKeyDown={typingSession.handleKeyDown}
                        onFocus={typingSession.handleFocus}
                        onBlur={typingSession.handleBlur}
                        onActivate={typingSession.focusInput}
                        onReset={handleReset}
                        isLocked={config.source === 'ai' && aiPracticeStatus !== 'ready'}
                        lockTitle={lockTitle}
                        lockBody={lockBody}
                    />
                </div>
            </div>

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
