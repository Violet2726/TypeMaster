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
        || '节奏稳定';
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
    const { achievements, sessionStreak, weeklyGoal } = useAchievementSnapshot();
    const { activeTrainingStep, dailyChallenge, skillProfile, trainingPlanProgress } = usePlanSnapshot();
    const { configActions, planActions, sessionActions } = useAppActions();
    const [isLaunchingDaily, setIsLaunchingDaily] = useState(false);
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const weakFocus = getWeakFocus(skillProfile);
    const unlocked = achievements.filter((item) => item.unlocked).length;

    const startRaid = () => navigate('/raid');
    const startFocus = () => {
        if (skillProfile?.topErrorChars?.length) {
            configActions.setKeyboardZoneDrillDraft(skillProfile.topErrorChars[0]);
        } else {
            sessionActions.resetPracticeToBuiltin();
        }
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
            <section className="home-starter-hero" aria-label="Arcade missions">
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Flag aria-hidden="true" size={15} strokeWidth={2.2} />
                        Arcade Missions
                    </span>
                    <h1>任务中心</h1>
                    <p className="hero-body">
                        用短任务提升下一局无尽突袭：校准基准、修复弱区、完成每日挑战，然后回到战场验证。
                    </p>
                    <div className="home-starter-hero__actions">
                        <button type="button" className="action-btn primary" onClick={startRaid}>
                            <Swords aria-hidden="true" size={17} strokeWidth={2.25} />
                            回到无尽突袭
                        </button>
                    </div>
                </div>
            </section>

            <section className="home-starter-metrics tm-metric-strip" aria-label="Mission progress">
                <div className="tm-metric">
                    <span><Trophy aria-hidden="true" size={16} /> 已解锁</span>
                    <strong>{unlocked}</strong>
                </div>
                <div className="tm-metric">
                    <span><ShieldCheck aria-hidden="true" size={16} /> 本周任务</span>
                    <strong>{weeklyGoal.completed}/{weeklyGoal.target}</strong>
                </div>
                <div className="tm-metric">
                    <span><BarChart3 aria-hidden="true" size={16} /> 最近 WPM</span>
                    <strong>{insights.recent7.avgWpm || copy.common.emptyValue}</strong>
                </div>
            </section>

            <section className="home-quick-cards" aria-label="Mission list">
                <MissionCard
                    icon={Target}
                    meta="Baseline"
                    title="30 秒基准校准"
                    body="首次或状态不明时，用短样本建立今天的速度和准确率参考线。"
                    cta="开始校准"
                    tone="primary"
                    onClick={startBaseline}
                />
                <MissionCard
                    icon={Keyboard}
                    meta="Focus Lab"
                    title={`弱区修复：${weakFocus}`}
                    body="把 Raid 暴露出的字符或节奏问题转成 2 分钟专注训练。"
                    cta="进入训练"
                    onClick={startFocus}
                />
                <MissionCard
                    icon={Trophy}
                    meta="Daily"
                    title={dailyChallenge?.title || '每日任务'}
                    body={dailyChallenge?.summary || '完成统一文本，比较今天的稳定性和准确率。'}
                    cta={isLaunchingDaily ? '启动中' : '开始任务'}
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
                                <p>计划进度 {trainingPlanProgress?.percent || 0}%</p>
                            </div>
                            <button type="button" className="action-btn" onClick={continuePlan}>
                                继续
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default MissionsPage;
