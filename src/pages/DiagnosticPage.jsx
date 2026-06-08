import { createDiagnosticJourney } from '../engine';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

export function DiagnosticPage() {
    const navigate = useNavigate();
    const { language, diagnosticJourney, skillProfile, startDiagnosticJourney } = usePracticeStore();
    const trainingCopy = getTrainingCopy(language);
    const activeJourney = diagnosticJourney?.status === 'active' ? diagnosticJourney : null;
    const previewJourney = activeJourney || createDiagnosticJourney(language);

    const handleStart = () => {
        startDiagnosticJourney();
        navigate('/practice');
    };

    return (
        <div className="page-stack">
            <section className="panel insights-header">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.diagnostic.kicker}</p>
                    <h1>{trainingCopy.diagnostic.title}</h1>
                    <p className="muted-text">{trainingCopy.diagnostic.body}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={handleStart}>
                    {activeJourney ? trainingCopy.diagnostic.resume : trainingCopy.diagnostic.start}
                </button>
            </section>

            <section className="insights-overview-grid">
                <div className="panel">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.diagnostic.stepTitle}</p>
                            <h2>{activeJourney?.title || trainingCopy.diagnostic.title}</h2>
                        </div>
                    </div>
                    <div className="history-table">
                        {previewJourney.steps.map((step) => (
                            <div key={step.id} className="history-row">
                                <div className="history-row__meta">
                                    <strong>{step.title}</strong>
                                    <p className="muted-text">{step.summary}</p>
                                </div>
                                <div className="history-metrics">
                                    <span>{step.config.durationSeconds}s</span>
                                    <span>{step.status === 'complete' ? trainingCopy.diagnostic.done : trainingCopy.diagnostic.pending}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.diagnostic.activeTitle}</p>
                    <h2>{skillProfile?.level?.label || trainingCopy.diagnostic.title}</h2>
                    <p className="lead-text">{skillProfile?.summary || trainingCopy.diagnostic.body}</p>
                    <p className="muted-text">
                        {activeJourney
                            ? `${trainingCopy.diagnostic.activeTitle}: ${activeJourney.currentStepIndex + 1}/${activeJourney.steps.length}`
                            : trainingCopy.diagnostic.body}
                    </p>
                </div>
            </section>
        </div>
    );
}

export default DiagnosticPage;
