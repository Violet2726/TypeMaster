'use client';

import { ArrowRight, CheckCircle2, Clock, Gauge, Play, Sparkles } from 'lucide-react';
import { useAppNavigate } from '../application/use-app-navigate';
import { useDiagnosticPageModel } from '../features/diagnostic/use-diagnostic-page-model';
import { useDiagnosticPageStore } from '../store/app-state-selectors';

function getStepTone(step, index, activeJourney) {
    if (step.status === 'complete') {
        return 'complete';
    }

    if (activeJourney && index === activeJourney.currentStepIndex) {
        return 'active';
    }

    return 'pending';
}

export function DiagnosticPage() {
    const navigate = useAppNavigate();
    const store = useDiagnosticPageStore();
    const { activeJourney, handleStart, previewJourney, skillProfile, trainingCopy } = useDiagnosticPageModel({
        ...store,
        navigate
    });
    const completedSteps = previewJourney.steps.filter((step) => step.status === 'complete').length;
    const currentStepIndex = activeJourney?.currentStepIndex ?? 0;
    const activeStep = previewJourney.steps[currentStepIndex] || previewJourney.steps[0];
    const totalDurationSeconds = previewJourney.steps.reduce((total, step) => total + (step.config?.durationSeconds || 0), 0);
    const totalDurationMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));
    const remainingSteps = Math.max(0, previewJourney.steps.length - completedSteps);
    const activeDurationSeconds = activeStep?.config?.durationSeconds || 0;
    const progressStep = Math.min(previewJourney.steps.length, Math.max(0, completedSteps));
    const isChinese = store.language === 'zh-CN';
    const durationLabel = isChinese ? `${totalDurationMinutes} 分钟` : `${totalDurationMinutes} min`;
    const stepCountLabel = isChinese ? `${previewJourney.steps.length} 个步骤` : `${previewJourney.steps.length} steps`;
    const activeDurationLabel = isChinese ? `${activeDurationSeconds} 秒` : `${activeDurationSeconds}s`;
    const remainingLabel = isChinese ? `剩余 ${remainingSteps} 步` : `${remainingSteps} left`;

    const assessmentSignals = [
        {
            icon: Gauge,
            label: trainingCopy.planGateway.profileSignal,
            value: trainingCopy.planGateway.profileValue
        },
        {
            icon: Sparkles,
            label: trainingCopy.planGateway.rhythmSignal,
            value: trainingCopy.planGateway.rhythmValue
        },
        {
            icon: CheckCircle2,
            label: trainingCopy.planGateway.symbolSignal,
            value: trainingCopy.planGateway.symbolValue
        }
    ];
    const routeSteps = [
        trainingCopy.planGateway.stepAccuracy,
        trainingCopy.planGateway.stepRhythm,
        trainingCopy.planGateway.stepSymbols
    ];

    return (
        <div className="page-stack diagnostic-page">
            <section className="panel diagnostic-hero">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.diagnostic.kicker}</p>
                    <h1>{trainingCopy.diagnostic.title}</h1>
                    <p className="muted-text">{trainingCopy.diagnostic.body}</p>
                    <div className="diagnostic-hero__meta" aria-label={trainingCopy.diagnostic.stepTitle}>
                        <span>
                            <Clock aria-hidden="true" size={16} strokeWidth={2.2} />
                            {durationLabel}
                        </span>
                        <span>
                            <Sparkles aria-hidden="true" size={16} strokeWidth={2.2} />
                            {stepCountLabel}
                        </span>
                    </div>
                    <div className="diagnostic-hero__signals" aria-label={trainingCopy.planGateway.previewTitle}>
                        {assessmentSignals.map(({ icon: Icon, label, value }) => (
                            <span key={label}>
                                <Icon aria-hidden="true" size={16} strokeWidth={2.25} />
                                <small>{label}</small>
                                <strong>{value}</strong>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="diagnostic-hero__action">
                    <div className="diagnostic-hero__control">
                        <div className={`diagnostic-progress-ring diagnostic-progress-ring--step-${progressStep}`} aria-label={trainingCopy.diagnostic.activeTitle}>
                            <strong>{completedSteps}/{previewJourney.steps.length}</strong>
                            <span>{trainingCopy.diagnostic.activeTitle}</span>
                        </div>
                        <div className="diagnostic-hero__cta">
                            <button type="button" className="action-btn primary" onClick={handleStart}>
                                <Play aria-hidden="true" size={18} strokeWidth={2.4} />
                                {activeJourney ? trainingCopy.diagnostic.resume : trainingCopy.diagnostic.start}
                            </button>
                            <div className="diagnostic-hero__next">
                                <span>{trainingCopy.diagnostic.activeTitle}</span>
                                <strong>{activeStep?.title || trainingCopy.diagnostic.stepTitle}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="diagnostic-hero__route" aria-label={trainingCopy.planGateway.routeKicker}>
                        {routeSteps.map((step, index) => (
                            <span key={step}>
                                <small>{String(index + 1).padStart(2, '0')}</small>
                                <strong>{step}</strong>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="diagnostic-layout">
                <div className="panel diagnostic-steps-card">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.diagnostic.kicker}</p>
                            <h2>{trainingCopy.diagnostic.stepTitle}</h2>
                        </div>
                    </div>
                    <div className="diagnostic-step-list">
                        {previewJourney.steps.map((step, index) => {
                            const tone = getStepTone(step, index, activeJourney);
                            const statusLabel = tone === 'complete'
                                ? trainingCopy.diagnostic.done
                                : tone === 'active'
                                    ? trainingCopy.diagnostic.activeTitle
                                    : trainingCopy.diagnostic.pending;

                            return (
                                <div key={step.id} className={`diagnostic-step diagnostic-step--${tone}`}>
                                    <span className="diagnostic-step__index" aria-hidden="true">
                                        {tone === 'complete'
                                            ? <CheckCircle2 size={17} strokeWidth={2.35} />
                                            : step.order || index + 1}
                                    </span>
                                    <div className="diagnostic-step__content">
                                        <div className="diagnostic-step__title-row">
                                            <strong>{step.title}</strong>
                                            <div className="diagnostic-step__badges">
                                                <span className={`diagnostic-step__status diagnostic-step__status--${tone}`}>{statusLabel}</span>
                                                <span className="diagnostic-step__duration">{step.config.durationSeconds}s</span>
                                            </div>
                                        </div>
                                        <p className="muted-text">{step.summary}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="panel diagnostic-profile-card">
                    <div className="diagnostic-profile-card__icon" aria-hidden="true">
                        <Gauge size={24} strokeWidth={2.2} />
                    </div>
                    <p className="panel-kicker">{trainingCopy.diagnostic.activeTitle}</p>
                    <h2>{skillProfile?.level?.label || activeStep?.title || trainingCopy.diagnostic.title}</h2>
                    <p className="lead-text">{skillProfile?.summary || previewJourney.summary || trainingCopy.diagnostic.body}</p>
                    <div className="diagnostic-profile-card__focus">
                        <span>{activeJourney ? `${activeJourney.currentStepIndex + 1}/${activeJourney.steps.length}` : `${completedSteps}/${previewJourney.steps.length}`}</span>
                        <strong>{activeStep?.title || trainingCopy.diagnostic.stepTitle}</strong>
                        <ArrowRight aria-hidden="true" size={18} strokeWidth={2.25} />
                    </div>
                    <div className="diagnostic-profile-card__stats" aria-label={trainingCopy.diagnostic.activeTitle}>
                        <span>
                            <Clock aria-hidden="true" size={15} strokeWidth={2.2} />
                            {activeDurationLabel}
                        </span>
                        <span>
                            <Sparkles aria-hidden="true" size={15} strokeWidth={2.2} />
                            {remainingLabel}
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default DiagnosticPage;
