'use client';

import { ArrowRight, BarChart3, Flag, Keyboard, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildInsights } from '@typemaster/domain';
import { useAppNavigate } from '../application/use-app-navigate';
import { useAppActions } from '../store/use-app-action-set';
import { useAchievementSnapshot, useHistorySnapshot, usePlanSnapshot, useShellSnapshot } from '../store/app-state-derived';

function getWeakFocus(skillProfile: any) {
    return skillProfile?.topErrorChars?.slice(0, 3).join(' / ')
        || skillProfile?.weakZones?.[0]?.label
        || 'rhythm';
}

function MissionCard({ body, cta, icon: Icon, meta, onClick, title, tone = 'default' }: {
    body: string,
    cta: string,
    icon: any,
    meta: string,
    onClick: () => void,
    title: string,
    tone?: string
}) {
    return (
        <article className={`home-quick-card home-quick-card--${tone}`}>
            <span className="home-quick-card__icon" aria-hidden="true">
                <Icon size={19} strokeWidth={2.2} />
            </span>
            <span className="home-quick-card__text">
                <p className="home-quick-card__kicker">{meta}</p>
                <strong>{title}</strong>
                <span>{body}</span>
            </span>
            <button type="button" className="action-btn primary" onClick={onClick}>
                {cta}
                <ArrowRight aria-hidden="true" size={16} strokeWidth={2.2} />
            </button>
        </article>
    );
}

export function MissionsPage() {
    const navigate = useAppNavigate();
    const { copy } = useShellSnapshot();
    const { sessions } = useHistorySnapshot();
    const { achievements, weeklyGoal } = useAchievementSnapshot();
    const { activeTrainingStep, dailyChallenge, skillProfile, trainingPlanProgress } = usePlanSnapshot();
    const { configActions, planActions, sessionActions } = useAppActions();
    const [isLaunchingDaily, setIsLaunchingDaily] = useState(false);
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const weakFocus = getWeakFocus(skillProfile);
    const unlocked = achievements.filter((item) => item.unlocked).length;

    const startGame = () => navigate('/raid');
    const startFocus = () => {
        if (skillProfile?.topErrorChars?.length) configActions.setKeyboardZoneDrillDraft(skillProfile.topErrorChars[0]);
        else sessionActions.resetPracticeToBuiltin();
        navigate('/practice');
    };
    const startBaseline = () => {
        planActions.startDiagnosticJourney();
        navigate('/practice');
    };
    const startDaily = async () => {
        setIsLaunchingDaily(true);
        try {
            await planActions.startDailyChallenge();
            navigate('/practice');
        } catch {
            setIsLaunchingDaily(false);
        }
    };
    const continuePlan = () => {
        planActions.startTrainingPlanStep();
        navigate('/practice');
    };

    return (
        <div className="page-stack page-stack--home">
            <section className="home-starter-hero" aria-label="TypeRift missions">
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Flag aria-hidden="true" size={15} strokeWidth={2.2} />
                        Missions
                    </span>
                    <h1>Mission Center</h1>
                    <p className="hero-body">
                        Calibrate speed, repair weak zones, and finish daily drills before returning to TypeRift builds.
                    </p>
                    <div className="home-starter-hero__actions">
                        <button type="button" className="action-btn primary" onClick={startGame}>
                            <Swords aria-hidden="true" size={17} strokeWidth={2.25} />
                            Back to TypeRift
                        </button>
                    </div>
                </div>
            </section>

            <section className="home-starter-metrics tm-metric-strip" aria-label="Mission progress">
                <div className="tm-metric">
                    <span><Trophy aria-hidden="true" size={16} /> Unlocked</span>
                    <strong>{unlocked}</strong>
                </div>
                <div className="tm-metric">
                    <span><ShieldCheck aria-hidden="true" size={16} /> Weekly missions</span>
                    <strong>{weeklyGoal.completed}/{weeklyGoal.target}</strong>
                </div>
                <div className="tm-metric">
                    <span><BarChart3 aria-hidden="true" size={16} /> Recent WPM</span>
                    <strong>{insights.recent7.avgWpm || copy.common.emptyValue}</strong>
                </div>
            </section>

            <section className="home-quick-cards" aria-label="Mission list">
                <MissionCard
                    icon={Target}
                    meta="Baseline"
                    title="30 second calibration"
                    body="Set today's reference line for speed and accuracy before a game run."
                    cta="Start calibration"
                    tone="primary"
                    onClick={startBaseline}
                />
                <MissionCard
                    icon={Keyboard}
                    meta="Focus Lab"
                    title={`Weak-zone repair: ${weakFocus}`}
                    body="Turn TypeRift mistakes into a compact precision drill."
                    cta="Enter practice"
                    onClick={startFocus}
                />
                <MissionCard
                    icon={Trophy}
                    meta="Daily"
                    title={dailyChallenge?.title || 'Daily mission'}
                    body={dailyChallenge?.summary || 'Complete the shared text and compare stability with today.'}
                    cta={isLaunchingDaily ? 'Launching' : 'Start mission'}
                    onClick={startDaily}
                />
            </section>

            {activeTrainingStep ? (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">Active mission</p>
                        <h2>{activeTrainingStep.title}</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Flag size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{activeTrainingStep.summary}</strong>
                                <p>Plan progress {trainingPlanProgress?.percent || 0}%</p>
                            </div>
                            <button type="button" className="action-btn" onClick={continuePlan}>
                                Continue
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default MissionsPage;
