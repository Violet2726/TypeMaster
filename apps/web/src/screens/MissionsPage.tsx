'use client';

import { ArrowRight, BarChart3, Flag, Keyboard, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildInsights } from '@typemaster/domain';
import { AppButton, AppCard, AppSheet, MetricCard, SectionHeader } from '../components/app/AppPrimitives';
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
        <AppCard
            icon={Icon}
            kicker={meta}
            title={title}
            body={body}
            tone={tone === 'primary' ? 'primary' : 'default'}
            action={(
                <AppButton variant="primary" icon={ArrowRight} iconPosition="end" onClick={onClick}>
                    {cta}
                </AppButton>
            )}
        />
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

    const startGame = () => navigate('/#typerift');
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
            <AppSheet
                aria-label={missionCopy.title}
                body={missionCopy.body}
                icon={Flag}
                kicker={missionCopy.kicker}
                title={missionCopy.title}
                variant="hero"
                actions={(
                    <AppButton variant="primary" icon={Swords} onClick={startGame}>
                        {missionCopy.backToGame}
                    </AppButton>
                )}
            />

            <section className="app-progress-strip" aria-label={missionCopy.progressLabel}>
                <MetricCard icon={Trophy} label={missionCopy.unlocked} value={unlocked} tone="warning" />
                <MetricCard icon={ShieldCheck} label={missionCopy.weeklyMissions} value={`${weeklyGoal.completed}/${weeklyGoal.target}`} tone="success" />
                <MetricCard icon={BarChart3} label={missionCopy.recentWpm} value={insights.recent7.avgWpm || copy.common.emptyValue} tone="primary" />
            </section>

            <section className="app-card-grid" aria-label={missionCopy.missionList}>
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
                    <SectionHeader kicker={missionCopy.activeMission} title={activeTrainingStep.title} />
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Flag size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{activeTrainingStep.summary}</strong>
                                <p>{fillTemplate(missionCopy.planProgress, { value: trainingPlanProgress?.percent || 0 })}</p>
                            </div>
                            <AppButton onClick={continuePlan}>
                                {missionCopy.continue}
                            </AppButton>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default MissionsPage;
