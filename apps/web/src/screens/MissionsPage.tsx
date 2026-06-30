'use client';

import { ArrowRight, BarChart3, Flag, Keyboard, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildInsights } from '@typemaster/domain';
import { Button } from '@typemaster/ui';
import { useAppNavigate } from '../application/use-app-navigate';
import { useAppActions } from '../store/use-app-action-set';
import { useAchievementSnapshot, useHistorySnapshot, usePlanSnapshot, useShellSnapshot } from '../store/app-state-derived';

function getWeakFocus(skillProfile: any) {
    return skillProfile?.topErrorChars?.slice(0, 3).join(' / ')
        || skillProfile?.weakZones?.[0]?.label
        || '';
}

function fillTemplate(template: string, values: Record<string, string | number>) {
    return Object.entries(values).reduce((text, [key, value]) => (
        text.replaceAll(`{${key}}`, String(value))
    ), template);
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
            <Button variant="primary" icon={ArrowRight} iconPosition="end" onClick={onClick}>
                {cta}
            </Button>
        </article>
    );
}

export function MissionsPage() {
    const navigate = useAppNavigate();
    const { copy } = useShellSnapshot();
    const missionCopy = copy.missions;
    const { sessions } = useHistorySnapshot();
    const { achievements, weeklyGoal } = useAchievementSnapshot();
    const { activeTrainingStep, dailyChallenge, skillProfile, trainingPlanProgress } = usePlanSnapshot();
    const { configActions, planActions, sessionActions } = useAppActions();
    const [isLaunchingDaily, setIsLaunchingDaily] = useState(false);
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const weakFocus = getWeakFocus(skillProfile) || copy.home.noWeakFocus;
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
            <section className="home-starter-hero" aria-label={missionCopy.title}>
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Flag aria-hidden="true" size={15} strokeWidth={2.2} />
                        {missionCopy.kicker}
                    </span>
                    <h1>{missionCopy.title}</h1>
                    <p className="hero-body">
                        {missionCopy.body}
                    </p>
                    <div className="home-starter-hero__actions">
                        <Button variant="primary" icon={Swords} onClick={startGame}>
                            {missionCopy.backToGame}
                        </Button>
                    </div>
                </div>
            </section>

            <section className="home-starter-metrics tm-metric-strip" aria-label={missionCopy.progressLabel}>
                <div className="tm-metric">
                    <span><Trophy aria-hidden="true" size={16} /> {missionCopy.unlocked}</span>
                    <strong>{unlocked}</strong>
                </div>
                <div className="tm-metric">
                    <span><ShieldCheck aria-hidden="true" size={16} /> {missionCopy.weeklyMissions}</span>
                    <strong>{weeklyGoal.completed}/{weeklyGoal.target}</strong>
                </div>
                <div className="tm-metric">
                    <span><BarChart3 aria-hidden="true" size={16} /> {missionCopy.recentWpm}</span>
                    <strong>{insights.recent7.avgWpm || copy.common.emptyValue}</strong>
                </div>
            </section>

            <section className="home-quick-cards" aria-label={missionCopy.missionList}>
                <MissionCard
                    icon={Target}
                    meta={missionCopy.baselineMeta}
                    title={missionCopy.baselineTitle}
                    body={missionCopy.baselineBody}
                    cta={missionCopy.baselineCta}
                    tone="primary"
                    onClick={startBaseline}
                />
                <MissionCard
                    icon={Keyboard}
                    meta={missionCopy.focusMeta}
                    title={fillTemplate(missionCopy.focusTitle, { value: weakFocus })}
                    body={missionCopy.focusBody}
                    cta={missionCopy.focusCta}
                    onClick={startFocus}
                />
                <MissionCard
                    icon={Trophy}
                    meta={missionCopy.dailyMeta}
                    title={dailyChallenge?.title || missionCopy.dailyTitle}
                    body={dailyChallenge?.summary || missionCopy.dailyBody}
                    cta={isLaunchingDaily ? missionCopy.launching : missionCopy.dailyCta}
                    onClick={startDaily}
                />
            </section>

            {activeTrainingStep ? (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">{missionCopy.activeMission}</p>
                        <h2>{activeTrainingStep.title}</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Flag size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{activeTrainingStep.summary}</strong>
                                <p>{fillTemplate(missionCopy.planProgress, { value: trainingPlanProgress?.percent || 0 })}</p>
                            </div>
                            <Button onClick={continuePlan}>
                                {missionCopy.continue}
                            </Button>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default MissionsPage;
