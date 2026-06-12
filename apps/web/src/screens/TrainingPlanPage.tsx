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

    return (
        <div className="page-stack training-plan-page">
            <section className="panel training-plan-hero">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                    <h1>{summaryTitle}</h1>
                    <p className="muted-text">{summaryBody}</p>
                    <div className="training-plan-hero__chips" aria-label={trainingCopy.home.planLabel}>
                        <span>
                            <ListChecks aria-hidden="true" size={16} strokeWidth={2.2} />
                            {trainingCopy.home.planLabel} {percent}%
                        </span>
                        <span>
                            <CalendarDays aria-hidden="true" size={16} strokeWidth={2.2} />
                            {completedCount}/{totalCount}
                        </span>
                    </div>
                </div>
                <div className="training-plan-hero__action">
                    <div className="training-plan-ring" style={{ background: ringBackground }} aria-label={trainingCopy.home.planLabel}>
                        <strong>{percent}%</strong>
                        <span>{completedCount}/{totalCount}</span>
                    </div>
                    <button type="button" className="action-btn primary" onClick={handleContinue}>
                        {isComplete ? <RefreshCw aria-hidden="true" size={18} strokeWidth={2.3} /> : <ArrowRight aria-hidden="true" size={18} strokeWidth={2.3} />}
                        {primaryActionLabel}
                    </button>
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

            <section className="home-stats-strip training-plan-stats" aria-label={trainingCopy.home.planLabel}>
                <div className="metric-card training-plan-stat">
                    <Route aria-hidden="true" size={18} strokeWidth={2.2} />
                    <span>{trainingCopy.home.planLabel}</span>
                    <strong>{percent}%</strong>
                </div>
                <div className="metric-card training-plan-stat">
                    <Target aria-hidden="true" size={18} strokeWidth={2.2} />
                    <span>{trainingCopy.insights.weekGoal}</span>
                    <strong>{completedCount}/{totalCount}</strong>
                </div>
                <div className="metric-card training-plan-stat">
                    <Clock3 aria-hidden="true" size={18} strokeWidth={2.2} />
                    <span>{trainingCopy.result.planTitle}</span>
                    <strong>{activeStep ? getStepDose(activeStep) : '--'}</strong>
                </div>
            </section>

            <section className="panel training-plan-board">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.home.planLabel}</p>
                        <h2>{trainingPlan?.title || trainingCopy.result.planTitle}</h2>
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

                {activeStep && (
                    <div className="training-plan-focus">
                        <span className="summary-label">{trainingCopy.result.signalLabel}</span>
                        <div>
                            <strong>{activeStep.title}</strong>
                            <p className="muted-text">{activeStep.summary}</p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default TrainingPlanPage;
