'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useAppNavigate } from '../application/use-app-navigate';
import { AIWorkshop } from '../features/practice/components/AIWorkshop';
import { ConfigPanel } from '../features/practice/components/ConfigPanel';
import { CustomTextWorkshop } from '../features/practice/components/CustomTextWorkshop';
import { TypingArea } from '../features/practice/components/TypingArea';
import { usePracticePageModel } from '../features/practice/use-practice-page-model';
import { usePracticePageStore } from '../store/app-state-selectors';
import { ConfirmDialog } from '@typemaster/ui';

export function PracticePage() {
    const router = useRouter();
    const pathname = usePathname();
    const navigate = useAppNavigate();
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
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
        <div className="page-stack practice-page">
            {nextRoundBrief && (
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
            )}

            {adaptiveDrillInsight && (
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
            )}

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
                    <p className="muted-text">{trainingCopy.practice.layoutLabel}: {store.settings.keyboardLayout.toUpperCase()}</p>
                </section>
            )}

            <section className="panel practice-toolbar">
                <div className="practice-toolbar__row">
                    <div>
                        <p className="panel-kicker">{store.copy.practice.configTitle}</p>
                        <h2>{sourceLabel}</h2>
                    </div>
                    <button type="button" className="ghost-btn ghost-btn--small" onClick={handleReset}>
                        <RotateCcw aria-hidden="true" size={16} strokeWidth={2.2} />
                        {store.copy.common.resetRound}
                    </button>
                </div>

                <ConfigPanel
                    copy={store.copy}
                    language={store.language}
                    config={store.config}
                    onConfigChange={handleConfigChange}
                    showAdvanced={controlsOpen}
                    onToggleAdvanced={() => setControlsOpen((value) => !value)}
                />

                {controlsOpen && store.config.source === 'ai' && (
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
                )}

                {controlsOpen && store.config.source === 'builtin' && (
                    <p className="muted-text practice-toolbar__hint">{store.copy.practice.builtInReady}</p>
                )}

                {store.config.source === 'custom' && (
                    <CustomTextWorkshop
                        language={store.language}
                        value={customText}
                        onChange={setCustomText}
                        onApply={handleApplyCustomText}
                    />
                )}
            </section>

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
            />

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
