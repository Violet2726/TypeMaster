'use client';

import { BarChart3, ChevronRight, Flag, Keyboard, ShieldCheck, Swords, Target, Trophy, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildInsights } from '@typemaster/domain';
import { AppButton, SectionHeader } from '../components/app/AppPrimitives';
import { useAppNavigate } from '../application/use-app-navigate';
import { useAppActions } from '../store/use-app-action-set';
import { useAchievementSnapshot, useHistorySnapshot, usePlanSnapshot, useShellSnapshot } from '../store/app-state-derived';
import type { SkillProfile } from '../types/training';
import './missions-page.css';

function getWeakFocus(skillProfile: SkillProfile | null) {
    return skillProfile?.topErrorChars?.slice(0, 3).join(' / ')
        || skillProfile?.weakZones?.[0]?.label
        || '';
}

function fillTemplate(template: string, values: Record<string, string | number>) {
    return Object.entries(values).reduce((text, [key, value]) => (
        text.replaceAll(`{${key}}`, String(value))
    ), template);
}

function MissionActionRow({ body, cta, icon: Icon, meta, onClick, title, tone = 'default' }: {
    body: string,
    cta: string,
    icon: LucideIcon,
    meta: string,
    onClick: () => void,
    title: string,
    tone?: string
}) {
    return (
        <button className={`mission-action-row mission-action-row--${tone}`} type="button" onClick={onClick}>
            <span className="mission-action-row__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
            </span>
            <span className="mission-action-row__copy">
                <small>{meta}</small>
                <strong>{title}</strong>
                <span>{body}</span>
            </span>
            <span className="mission-action-row__cta">
                <span>{cta}</span>
                <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
            </span>
        </button>
    );
}

function MissionStatusItem({ icon: Icon, label, value, tone = 'default' }: {
    icon: LucideIcon,
    label: string,
    value: string | number,
    tone?: string
}) {
    return (
        <div className={`mission-status-item mission-status-item--${tone}`}>
            <span className="mission-status-item__icon" aria-hidden="true">
                <Icon size={15} strokeWidth={2.2} />
            </span>
            <span className="mission-status-item__copy">
                <small>{label}</small>
                <strong>{value}</strong>
            </span>
        </div>
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
            <section className="mission-command" aria-label={missionCopy.title}>
                <div className="mission-command__copy">
                    <span className="mission-command__kicker">
                        <Flag aria-hidden="true" size={15} strokeWidth={2.2} />
                        {missionCopy.kicker}
                    </span>
                    <h1>{missionCopy.title}</h1>
                    <p className="hero-body mission-command__body">{missionCopy.body}</p>
                </div>
                <div className="mission-command__actions">
                    <AppButton variant="primary" icon={Swords} onClick={startGame}>
                        {missionCopy.backToGame}
                    </AppButton>
                </div>
            </section>

            <section className="mission-status-row" aria-label={missionCopy.progressLabel}>
                <MissionStatusItem icon={Trophy} label={missionCopy.unlocked} value={unlocked} tone="warning" />
                <MissionStatusItem icon={ShieldCheck} label={missionCopy.weeklyMissions} value={`${weeklyGoal.completed}/${weeklyGoal.target}`} tone="success" />
                <MissionStatusItem icon={BarChart3} label={missionCopy.recentWpm} value={insights.recent7.avgWpm || copy.common.emptyValue} tone="primary" />
            </section>

            <section className="mission-action-list" aria-label={missionCopy.missionList}>
                <MissionActionRow
                    icon={Target}
                    meta={missionCopy.baselineMeta}
                    title={missionCopy.baselineTitle}
                    body={missionCopy.baselineBody}
                    cta={missionCopy.baselineCta}
                    tone="primary"
                    onClick={startBaseline}
                />
                <MissionActionRow
                    icon={Keyboard}
                    meta={missionCopy.focusMeta}
                    title={fillTemplate(missionCopy.focusTitle, { value: weakFocus })}
                    body={missionCopy.focusBody}
                    cta={missionCopy.focusCta}
                    onClick={startFocus}
                />
                <MissionActionRow
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
                    <div className="home-recent-summary">
                        <span className="home-recent-summary__icon" aria-hidden="true">
                            <Flag size={16} strokeWidth={2.2} />
                        </span>
                        <div className="home-recent-summary__body">
                            <strong>{activeTrainingStep.summary}</strong>
                            <p className="home-recent-summary__detail">{fillTemplate(missionCopy.planProgress, { value: trainingPlanProgress?.percent || 0 })}</p>
                        </div>
                        <AppButton onClick={continuePlan}>
                            {missionCopy.continue}
                        </AppButton>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default MissionsPage;
