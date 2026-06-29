'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BadgeCheck, FileText, PencilLine, WandSparkles } from 'lucide-react';
import { ConfirmDialog, Inspector, MetricStrip } from '@typemaster/ui';
import { useAppNavigate } from '../application/use-app-navigate';
import { AIWorkshop } from '../features/practice/components/AIWorkshop';
import { ConfigPanel } from '../features/practice/components/ConfigPanel';
import { CustomTextWorkshop } from '../features/practice/components/CustomTextWorkshop';
import { TypingArea } from '../features/practice/components/TypingArea';
import { usePracticePageModel } from '../features/practice/use-practice-page-model';
import { usePracticePageStore } from '../store/app-state-selectors';
import './practice-page.css';

function getTrainingTaskBadgeLabel(task, trainingCopy) {
    if (!task) {
        return null;
    }

    if (task.id.startsWith('daily-')) {
        return trainingCopy.practice.challengeBadge;
    }

    if (task.order <= 3 && task.id.startsWith('diagnostic')) {
        return trainingCopy.practice.diagnosticBadge;
    }

    return trainingCopy.practice.planBadge;
}

export function PracticePage() {
    const router = useRouter();
    const pathname = usePathname();
    const navigate = useAppNavigate();
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const customTextEditorRef = useRef<HTMLTextAreaElement | null>(null);
    const store = usePracticePageStore();
    const {
        aiPracticeStatus,
        adaptiveDrillInsight,
        confirmState,
        controlsOpen,
        currentDraft,
        currentTrainingTask,
        customText,
        handleApplyCustomText,
        handleConfigChange,
        handleGenerateAi,
        handlePrimaryAction,
        handleReset,
        handleUseBuiltin,
        isCustomEmpty,
        isDirty,
        isPrimaryActionDisabled,
        lockBody,
        lockTitle,
        nextRoundBrief,
        practiceError,
        primaryActionLabel,
        primaryActionHint,
        restoreAiDraftConfig,
        handleBeforeUnload,
        setConfirmState,
        setControlsOpen,
        setCustomText,
        sourceLabel,
        shouldBlockNavigation,
        trainingCopy,
        typingSession
    } = usePracticePageModel({
        ...store,
        navigate
    });

    const isCustomComposeMode = store.config.source === 'custom' && isCustomEmpty;
    const isAiTextPending = store.config.source === 'ai' && aiPracticeStatus !== 'ready';
    const isCustomTextPending = store.config.source === 'custom' && isCustomEmpty;
    const hasCustomTextDraft = Boolean(customText.trim());
    const focusCustomTextEditor = useCallback(() => {
        setControlsOpen(true);

        const focusEditor = () => {
            customTextEditorRef.current?.focus();
            customTextEditorRef.current?.scrollIntoView?.({
                block: 'center',
                behavior: 'smooth'
            });
        };

        focusEditor();
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(focusEditor);
        }
    }, [setControlsOpen]);

    const lockedPrimaryActionLabel = isAiTextPending
        ? aiPracticeStatus === 'stale'
            ? store.copy.common.reGenerateAiText
            : aiPracticeStatus === 'loading'
                ? store.copy.common.loading
                : store.copy.common.generateAiText
        : isCustomTextPending
            ? hasCustomTextDraft
                ? trainingCopy.practice.customApply
                : trainingCopy.practice.customFocusEditor
            : undefined;
    const lockedPrimaryActionIcon = isAiTextPending
        ? WandSparkles
        : hasCustomTextDraft
            ? BadgeCheck
            : PencilLine;
    const lockedSecondaryActionLabel = isAiTextPending && aiPracticeStatus === 'error'
        ? store.copy.common.useBuiltIn
        : isCustomTextPending && hasCustomTextDraft
            ? trainingCopy.practice.customEditText
            : undefined;
    const lockedSecondaryActionIcon = isAiTextPending ? FileText : PencilLine;
    const activeModeLabel = store.config.mode === 'time' ? store.copy.common.timeMode : store.copy.common.wordsMode;
    const activeVolumeLabel = store.config.mode === 'time' ? `${store.config.durationSeconds}s` : `${store.config.wordCount}`;
    const keyboardLayoutLabel = store.settings.keyboardLayout.toUpperCase();
    const sessionStatusLabel = store.copy.statuses[typingSession.status] || store.copy.statuses.idle;
    const currentTaskBadgeLabel = getTrainingTaskBadgeLabel(currentTrainingTask, trainingCopy);
    const practiceHeadline = currentTrainingTask
        ? currentTrainingTask.title
        : store.config.source === 'custom'
            ? trainingCopy.practice.customTitle
            : store.config.source === 'ai' && aiPracticeStatus !== 'ready'
                ? store.copy.practice.customTitle
                : store.copy.practice.pageTitle;
    const practiceBody = currentTrainingTask
        ? currentTrainingTask.summary
        : store.config.source === 'custom' && isCustomEmpty
            ? trainingCopy.practice.customBody
            : store.config.source === 'ai' && aiPracticeStatus !== 'ready'
                ? store.copy.practice.customBody
                : primaryActionHint;
    const toolbarHighlights = [
        {
            label: store.copy.practice.sourceTitle,
            value: sourceLabel
        },
        {
            label: store.copy.practice.modeTitle,
            value: activeModeLabel
        },
        {
            label: store.copy.practice.volumeTitle,
            value: activeVolumeLabel
        },
        {
            label: trainingCopy.practice.layoutLabel,
            value: keyboardLayoutLabel
        }
    ];
    const onLockedPrimaryAction = isAiTextPending
        ? handleGenerateAi
        : isCustomTextPending
            ? hasCustomTextDraft
                ? handleApplyCustomText
                : focusCustomTextEditor
            : undefined;
    const onLockedSecondaryAction = isAiTextPending && lockedSecondaryActionLabel
        ? handleUseBuiltin
        : isCustomTextPending && lockedSecondaryActionLabel
            ? focusCustomTextEditor
            : undefined;

    useEffect(() => {
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [handleBeforeUnload]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented
                || event.button !== 0
                || event.metaKey
                || event.ctrlKey
                || event.shiftKey
                || event.altKey
                || !shouldBlockNavigation()
            ) {
                return;
            }

            const target = event.target as Element | null;
            const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;

            if (!anchor || anchor.target || anchor.hasAttribute('download')) {
                return;
            }

            const nextUrl = new URL(anchor.href);

            if (nextUrl.origin !== window.location.origin) {
                return;
            }

            const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
            const currentHref = `${pathname}${window.location.search}${window.location.hash}`;

            if (nextHref === currentHref) {
                return;
            }

            event.preventDefault();
            setPendingNavigation(nextHref);
        };

        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    }, [pathname, shouldBlockNavigation]);

    useEffect(() => {
        setPendingNavigation(null);
    }, [pathname]);

    return (
        <div className={`page-stack practice-page practice-page--refined ${isCustomComposeMode ? 'practice-page--compose' : ''}`}>
            <section className="panel practice-hero">
                <div className="practice-hero__copy">
                    <div className="practice-hero__eyebrow">
                        <p className="hero-kicker">{currentTrainingTask ? trainingCopy.practice.taskKicker : store.copy.practice.pageTitle}</p>
                        {currentTaskBadgeLabel ? (
                            <span className="panel-badge badge-ready">{currentTaskBadgeLabel}</span>
                        ) : null}
                    </div>
                    <h1>{practiceHeadline}</h1>
                    <p className="hero-body">{practiceBody}</p>
                </div>

            </section>

            {(nextRoundBrief || adaptiveDrillInsight) ? (
                <section className={`practice-support-grid ${adaptiveDrillInsight && nextRoundBrief ? 'practice-support-grid--split' : ''}`}>
                    {nextRoundBrief ? (
                        <section className="panel practice-brief-panel" aria-labelledby="practice-brief-title">
                            <div className="panel-head">
                                <div>
                                    <p className="panel-kicker">{trainingCopy.practice.nextBriefKicker}</p>
                                    <h2 id="practice-brief-title">{nextRoundBrief.title}</h2>
                                </div>
                                <span className="panel-badge badge-ready">{trainingCopy.practice.nextBriefBadge}</span>
                            </div>
                            <p className="muted-text">{nextRoundBrief.body}</p>
                            <div className="result-prescription result-prescription--practice" aria-label={nextRoundBrief.title}>
                                <div className="result-prescription__grid">
                                    {nextRoundBrief.items.map((item) => (
                                        <div key={item.id} className={`result-prescription__item result-prescription__item--${item.tone}`}>
                                            <span className="summary-label">{item.label}</span>
                                            <strong>{item.value}</strong>
                                            <p>{item.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {adaptiveDrillInsight ? (
                        <section className="panel adaptive-drill-panel" aria-label={adaptiveDrillInsight.kicker}>
                            <div>
                                <p className="panel-kicker">{adaptiveDrillInsight.kicker}</p>
                                <h2>{adaptiveDrillInsight.title}</h2>
                            </div>
                            <p className="muted-text">{adaptiveDrillInsight.body}</p>
                            <div className="adaptive-drill-panel__chips">
                                {adaptiveDrillInsight.chips.map((chip) => (
                                    <div key={chip.label} className="adaptive-drill-chip">
                                        <span>{chip.label}</span>
                                        <strong>{chip.value}</strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </section>
            ) : null}

            <div className={`practice-workbench ${isCustomComposeMode ? 'practice-workbench--compose' : ''} ${isAiTextPending ? 'practice-workbench--ai-pending' : ''}`}>
                <div className="practice-workbench__primary">
                    <TypingArea
                        copy={store.copy}
                        words={typingSession.words}
                        typedHistory={typingSession.typedHistory}
                        currentInput={typingSession.currentInput}
                        currentWordIndex={typingSession.currentWordIndex}
                        isFocused={typingSession.isFocused}
                        status={typingSession.status}
                        liveMetrics={typingSession.liveMetrics}
                        timerDisplay={typingSession.timerDisplay}
                        mode={store.config.mode}
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
                        isLocked={(store.config.source === 'ai' && aiPracticeStatus !== 'ready') || isCustomEmpty}
                        lockTitle={lockTitle}
                        lockBody={lockBody}
                        showReset={!isCustomComposeMode}
                        lockedPrimaryActionLabel={lockedPrimaryActionLabel}
                        lockedPrimaryActionIcon={lockedPrimaryActionIcon}
                        lockedPrimaryActionDisabled={isAiTextPending && aiPracticeStatus === 'loading'}
                        onLockedPrimaryAction={onLockedPrimaryAction}
                        lockedSecondaryActionLabel={lockedSecondaryActionLabel}
                        lockedSecondaryActionIcon={lockedSecondaryActionIcon}
                        onLockedSecondaryAction={onLockedSecondaryAction}
                    />
                </div>

                <aside className="practice-workbench__rail" aria-label={store.copy.practice.configTitle}>
                    <Inspector
                        className="practice-toolbar"
                        eyebrow={store.copy.practice.sessionLabel}
                        title={store.copy.practice.configTitle}
                        badge={sessionStatusLabel}
                    >
                        <MetricStrip
                            className="practice-toolbar__snapshot"
                            items={toolbarHighlights.map((item) => ({
                                id: item.label,
                                label: item.label,
                                value: item.value
                            }))}
                        />

                        <ConfigPanel
                            copy={store.copy}
                            language={store.language}
                            config={store.config}
                            onConfigChange={handleConfigChange}
                            showAdvanced={controlsOpen}
                            onToggleAdvanced={() => setControlsOpen((value) => !value)}
                        />

                        {controlsOpen && store.config.source === 'ai' ? (
                            <div className="practice-toolbar__studio">
                                <AIWorkshop
                                    copy={store.copy}
                                    language={store.language}
                                    config={store.config}
                                    currentDraft={currentDraft}
                                    aiPracticeStatus={aiPracticeStatus}
                                    practiceError={practiceError}
                                    onConfigChange={handleConfigChange}
                                    onGenerate={handleGenerateAi}
                                    onRestoreConfig={restoreAiDraftConfig}
                                    onUseBuiltin={handleUseBuiltin}
                                />
                            </div>
                        ) : null}

                        {!controlsOpen && store.config.source === 'builtin' ? (
                            <div className="practice-toolbar__support-note" role="note">
                                <p className="muted-text practice-toolbar__hint">{store.copy.practice.builtInReady}</p>
                            </div>
                        ) : null}

                        {store.config.source === 'custom' ? (
                            <div className="practice-toolbar__studio">
                                <CustomTextWorkshop
                                    language={store.language}
                                    value={customText}
                                    editorRef={customTextEditorRef}
                                    onChange={setCustomText}
                                    onApply={handleApplyCustomText}
                                />
                            </div>
                        ) : null}
                    </Inspector>
                </aside>
            </div>

            {!isCustomComposeMode ? (
                <div className="sticky-action-bar">
                    <div>
                        <span className="summary-label">{store.copy.practice.helperTitle}</span>
                        <strong>{primaryActionHint}</strong>
                    </div>
                    <button
                        type="button"
                        className="action-btn primary"
                        onClick={handlePrimaryAction}
                        disabled={isPrimaryActionDisabled}
                    >
                        {primaryActionLabel}
                    </button>
                </div>
            ) : null}

            <ConfirmDialog
                isOpen={Boolean(confirmState)}
                title={confirmState?.title}
                body={confirmState?.body}
                confirmLabel={confirmState?.confirmLabel || store.copy.common.confirm}
                cancelLabel={confirmState?.cancelLabel || store.copy.common.cancel}
                onConfirm={() => {
                    const pending = confirmState;
                    setConfirmState(null);
                    pending?.action?.();
                }}
                onCancel={() => setConfirmState(null)}
            />

            <ConfirmDialog
                isOpen={Boolean(pendingNavigation)}
                title={store.copy.practice.confirmLeaveTitle}
                body={store.copy.practice.confirmLeaveBody}
                confirmLabel={store.copy.confirm.leave}
                cancelLabel={store.copy.confirm.stay}
                onConfirm={() => {
                    const href = pendingNavigation;
                    setPendingNavigation(null);

                    if (href) {
                        router.push(href);
                    }
                }}
                onCancel={() => setPendingNavigation(null)}
            />
        </div>
    );
}

export default PracticePage;
