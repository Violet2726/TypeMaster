'use client';

import { useAppNavigate } from '../application/use-app-navigate';
import { useTrainingPlanPageModel } from '../features/training-plan/use-training-plan-page-model';
import { useTrainingPlanPageStore } from '../store/app-state-selectors';

export function TrainingPlanPage() {
    const navigate = useAppNavigate();
    const store = useTrainingPlanPageStore();
    const { handleContinue, trainingCopy, trainingPlan, trainingPlanProgress } = useTrainingPlanPageModel({
        ...store,
        navigate
    });

    return (
        <div className="page-stack">
            <section className="panel insights-header">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                    <h1>{trainingPlan?.title || trainingCopy.result.planTitle}</h1>
                    <p className="muted-text">{trainingPlan?.summary || trainingCopy.result.planBody}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={handleContinue}>
                    {trainingCopy.result.continuePlan}
                </button>
            </section>

            <section className="home-stats-strip" aria-label={trainingCopy.home.planLabel}>
                <div className="metric-card">
                    <span>{trainingCopy.home.planLabel}</span>
                    <strong>{trainingPlanProgress?.percent || 0}%</strong>
                </div>
                <div className="metric-card">
                    <span>{trainingCopy.insights.weekGoal}</span>
                    <strong>{trainingPlanProgress?.completed || 0}/{trainingPlanProgress?.total || 0}</strong>
                </div>
            </section>

            <section className="panel home-records-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.home.planLabel}</p>
                        <h2>{trainingPlan?.title || trainingCopy.result.planTitle}</h2>
                    </div>
                </div>
                <div className="history-table">
                    {(trainingPlan?.steps || []).map((step) => (
                        <div key={step.id} className="history-row">
                            <div className="history-row__meta">
                                <strong>{step.title}</strong>
                                <p className="muted-text">{step.summary}</p>
                            </div>
                            <div className="history-metrics">
                                <span>{step.config.mode === 'time' ? `${step.config.durationSeconds}s` : `${step.config.wordCount}`}</span>
                                <span>{step.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default TrainingPlanPage;
