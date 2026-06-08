import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

export function TrainingPlanPage() {
    const navigate = useNavigate();
    const { language, trainingPlan, trainingPlanProgress, startTrainingPlanStep } = usePracticeStore();
    const trainingCopy = getTrainingCopy(language);

    const handleContinue = () => {
        startTrainingPlanStep();
        navigate('/practice');
    };

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
