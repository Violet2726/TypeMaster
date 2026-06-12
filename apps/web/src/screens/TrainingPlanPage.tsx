'use client';

import { ArrowRight, CalendarDays, CheckCircle2, Clock3, ListChecks, RefreshCw, Route, Sparkles, Target } from 'lucide-react';
import { useAppNavigate } from '../application/use-app-navigate';
import { useTrainingPlanPageModel } from '../features/training-plan/use-training-plan-page-model';
import { useTrainingPlanPageStore } from '../store/app-state-selectors';

function getPlanStepTone(step, index, currentStepIndex) {
    if (step.status === 'complete') {
        return 'complete';
    }

    if (index === currentStepIndex) {
        return 'active';
    }

    return 'pending';
}

function getStepDose(step) {
    if (step.config.mode === 'time') {
        return `${step.config.durationSeconds}s`;
    }

    return `${step.config.wordCount || 0}`;
}

export function TrainingPlanPage() {
    const navigate = useAppNavigate();
    const store = useTrainingPlanPageStore();
    const {
        handleContinue,
        hasPlan,
        isComplete,
        primaryActionLabel,
        summaryBody,
        summaryTitle,
        trainingCopy,
        trainingPlan,
        trainingPlanProgress
    } = useTrainingPlanPageModel({
        ...store,
        navigate
    });
    const steps = trainingPlan?.steps || [];
    const currentStepIndex = trainingPlan?.currentStepIndex || 0;
    const activeStep = steps[currentStepIndex] || steps.find((step) => step.status !== 'complete') || steps[0] || null;
    const completedCount = trainingPlanProgress?.completed || 0;
    const totalCount = trainingPlanProgress?.total || steps.length || 0;
    const percent = trainingPlanProgress?.percent || 0;
    const ringBackground = `conic-gradient(var(--main-color) 0 ${percent}%, rgba(255, 255, 255, 0.12) ${percent}% 100%)`;
    const activeStepTone = activeStep?.status === 'complete' ? 'complete' : 'active';
    const activeStepStatusLabel = activeStepTone === 'complete'
        ? trainingCopy.diagnostic.done
        : trainingCopy.result.decisionBadge;
    const planMetrics = hasPlan ? [
        {
            icon: Route,
            label: trainingCopy.home.planLabel,
            value: `${percent}%`
        },
        {
            icon: Target,
            label: trainingCopy.insights.weekGoal,
            value: `${completedCount}/${totalCount}`
        },
        {
            icon: Clock3,
            label: trainingCopy.result.planTitle,
            value: activeStep ? getStepDose(activeStep) : '--'
        }
    ] : [];
    const onboardingItems = [
        {
            icon: ListChecks,
            label: trainingCopy.diagnostic.stepTitle,
            value: '3'
        },
        {
            icon: Target,
            label: trainingCopy.diagnostic.kicker,
            value: trainingCopy.diagnostic.activeTitle
        },
        {
            icon: CalendarDays,
            label: trainingCopy.home.planLabel,
            value: trainingCopy.result.continuePlan
        }
    ];

    return (
        <div className="page-stack training-plan-page">
            <section className={`panel training-plan-hero ${hasPlan ? 'training-plan-hero--plan' : 'training-plan-hero--empty'} ${hasPlan && !isComplete ? 'training-plan-hero--active' : ''}`}>
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                    <h1>{summaryTitle}</h1>
                    <p className="muted-text">{summaryBody}</p>
                    <div className="training-plan-hero__chips" aria-label={trainingCopy.home.planLabel}>
                        {hasPlan ? (
                            <>
                                <span>
                                    <ListChecks aria-hidden="true" size={16} strokeWidth={2.2} />
                                    {trainingCopy.home.planLabel} {percent}%
                                </span>
                                <span>
                                    <CalendarDays aria-hidden="true" size={16} strokeWidth={2.2} />
                                    {completedCount}/{totalCount}
                                </span>
                            </>
                        ) : (
                            <>
                                <span>
                                    <ListChecks aria-hidden="true" size={16} strokeWidth={2.2} />
                                    {trainingCopy.diagnostic.stepTitle}
                                </span>
                                <span>
                                    <Route aria-hidden="true" size={16} strokeWidth={2.2} />
                                    {trainingCopy.home.planLabel}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="training-plan-hero__action">
                    {hasPlan ? (
                        <>
                            <div className="training-plan-hero__status">
                                <div className="training-plan-ring" style={{ background: ringBackground }} aria-label={trainingCopy.home.planLabel}>
                                    <strong>{percent}%</strong>
                                    <span>{completedCount}/{totalCount}</span>
                                </div>
                                <button type="button" className="action-btn primary" onClick={handleContinue}>
                                    {isComplete ? <RefreshCw aria-hidden="true" size={18} strokeWidth={2.3} /> : <ArrowRight aria-hidden="true" size={18} strokeWidth={2.3} />}
                                    {primaryActionLabel}
                                </button>
                            </div>
                            {!isComplete && activeStep && (
                                <div className="training-plan-current" aria-label={trainingCopy.result.planTitle}>
                                    <div className="training-plan-current__top">
                                        <span className={`training-plan-step__status training-plan-step__status--${activeStepTone}`}>{activeStepStatusLabel}</span>
                                        <span className="training-plan-step__dose">{getStepDose(activeStep)}</span>
                                    </div>
                                    <div className="training-plan-current__body">
                                        <span className="summary-label">{trainingCopy.result.planTitle}</span>
                                        <strong>{activeStep.title}</strong>
                                        <p className="muted-text">{activeStep.summary}</p>
                                    </div>
                                    <div className="training-plan-current__meta" aria-label={trainingCopy.home.planLabel}>
                                        <span>
                                            <ListChecks aria-hidden="true" size={14} strokeWidth={2.25} />
                                            {trainingCopy.home.planLabel} {percent}%
                                        </span>
                                        <span>
                                            <CalendarDays aria-hidden="true" size={14} strokeWidth={2.25} />
                                            {completedCount}/{totalCount}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="training-plan-hero__metrics" aria-label={trainingCopy.home.planLabel}>
                                {planMetrics.map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="training-plan-hero__metric">
                                        <Icon aria-hidden="true" size={16} strokeWidth={2.25} />
                                        <span>{label}</span>
                                        <strong>{value}</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="training-plan-start-preview" aria-hidden="true">
                            <span className="training-plan-start-preview__icon">
                                <Sparkles size={20} strokeWidth={2.25} />
                            </span>
                            <div>
                                <span className="summary-label">{trainingCopy.diagnostic.kicker}</span>
                                <strong>{trainingCopy.diagnostic.stepTitle}</strong>
                            </div>
                            <div className="training-plan-start-preview__rail">
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}
                    {!hasPlan && (
                        <button type="button" className="action-btn primary" onClick={handleContinue}>
                            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.3} />
                            {primaryActionLabel}
                        </button>
                    )}
                </div>
            </section>

            {isComplete && (
                <section className="panel result-target-feedback result-target-feedback--stale">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.result.planComplete}</p>
                            <h2>{trainingCopy.result.reassessmentDecisionTitle}</h2>
                        </div>
                        <span className="panel-badge badge-stale">
                            <RefreshCw aria-hidden="true" size={14} strokeWidth={2.2} />
                            {trainingCopy.result.reassessmentAction}
                        </span>
                    </div>
                    <p className="lead-text">{trainingCopy.result.reassessmentDecisionBody}</p>
                </section>
            )}

            {!hasPlan && (
                <section className="panel training-plan-onboarding" aria-label={trainingCopy.diagnostic.kicker}>
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.diagnostic.kicker}</p>
                            <h2>{trainingCopy.diagnostic.title}</h2>
                        </div>
                        <span className="panel-badge badge-idle">{trainingCopy.diagnostic.pending}</span>
                    </div>
                    <div className="training-plan-onboarding__grid">
                        {onboardingItems.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="training-plan-onboarding__item">
                                <Icon aria-hidden="true" size={18} strokeWidth={2.25} />
                                <span>{label}</span>
                                <strong>{value}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {hasPlan && (
                <section className="panel training-plan-board">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingPlan?.title || trainingCopy.result.planTitle}</p>
                            <h2>{trainingCopy.home.planLabel}</h2>
                        </div>
                        <span className="panel-badge badge-idle">{completedCount}/{totalCount}</span>
                    </div>

                    <div className="training-plan-progress-line" aria-hidden="true">
                        <span style={{ width: `${percent}%` }} />
                    </div>

                    {steps.length ? (
                        <div className="training-plan-step-list">
                            {steps.map((step, index) => {
                                const tone = getPlanStepTone(step, index, currentStepIndex);
                                const statusLabel = tone === 'complete'
                                    ? trainingCopy.diagnostic.done
                                    : tone === 'active'
                                        ? trainingCopy.result.decisionBadge
                                        : trainingCopy.diagnostic.pending;

                                return (
                                    <div key={step.id} className={`training-plan-step training-plan-step--${tone}`}>
                                        <span className="training-plan-step__index" aria-hidden="true">
                                            {tone === 'complete'
                                                ? <CheckCircle2 size={17} strokeWidth={2.35} />
                                                : step.order || index + 1}
                                        </span>
                                        <div className="training-plan-step__content">
                                            <div className="training-plan-step__head">
                                                <strong>{step.title}</strong>
                                                <div className="training-plan-step__badges">
                                                    <span className={`training-plan-step__status training-plan-step__status--${tone}`}>{statusLabel}</span>
                                                    <span className="training-plan-step__dose">{getStepDose(step)}</span>
                                                </div>
                                            </div>
                                            <p className="muted-text">{step.summary}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="training-plan-empty">
                            <div className="training-plan-empty__icon" aria-hidden="true">
                                <Sparkles size={24} strokeWidth={2.2} />
                            </div>
                            <div>
                                <strong>{trainingCopy.result.planTitle}</strong>
                                <p className="muted-text">{trainingCopy.result.planBody}</p>
                            </div>
                            <button type="button" className="action-btn primary" onClick={handleContinue}>
                                <ArrowRight aria-hidden="true" size={18} strokeWidth={2.3} />
                                {primaryActionLabel}
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default TrainingPlanPage;
