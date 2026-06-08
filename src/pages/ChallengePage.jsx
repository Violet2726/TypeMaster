import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

export function ChallengePage() {
    const navigate = useNavigate();
    const {
        language,
        account,
        skillProfile,
        dailyChallenge,
        refreshDailyChallenge,
        startDailyChallenge,
        challengeGateway
    } = usePracticeStore();
    const trainingCopy = getTrainingCopy(language);
    const [leaderboard, setLeaderboard] = useState([]);
    const peerLevelId = skillProfile?.level?.id || null;

    useEffect(() => {
        let active = true;

        const load = async () => {
            const challenge = dailyChallenge || await refreshDailyChallenge();
            const nextLeaderboard = await challengeGateway.getChallengeLeaderboard(challenge.id, language);

            if (active) {
                setLeaderboard(nextLeaderboard);
            }
        };

        load().catch(() => {});

        return () => {
            active = false;
        };
    }, [challengeGateway, dailyChallenge, language, refreshDailyChallenge]);

    const handleStart = async () => {
        await startDailyChallenge();
        navigate('/practice');
    };

    return (
        <div className="page-stack">
            <section className="panel insights-header">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                    <h1>{dailyChallenge?.title || trainingCopy.challenge.title}</h1>
                    <p className="muted-text">{dailyChallenge?.summary || trainingCopy.challenge.body}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={handleStart}>
                    {trainingCopy.challenge.cta}
                </button>
            </section>

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                    <h2>{account?.displayName || 'Guest'}</h2>
                    <p className="lead-text">{trainingCopy.challenge.body}</p>
                    <p className="muted-text">{dailyChallenge?.text || ''}</p>
                </div>

                <div className="panel">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                            <h2>{trainingCopy.challenge.leaderboard}</h2>
                        </div>
                    </div>

                    {(peerLevelId
                        ? leaderboard.filter((entry) => entry.levelId === peerLevelId)
                        : leaderboard).length ? (
                        <div className="history-table">
                            {(peerLevelId
                                ? leaderboard.filter((entry) => entry.levelId === peerLevelId)
                                : leaderboard).map((entry) => (
                                <div key={entry.id} className="history-row">
                                    <div className="history-row__meta">
                                        <strong>{entry.displayName}</strong>
                                        <p className="muted-text">{new Date(entry.createdAt).toLocaleString(language)}</p>
                                    </div>
                                    <div className="history-metrics">
                                        <span>{entry.wpm} WPM</span>
                                        <span>{entry.accuracy}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted-text">{trainingCopy.challenge.empty}</p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default ChallengePage;
