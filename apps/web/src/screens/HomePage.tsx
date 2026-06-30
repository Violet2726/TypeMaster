'use client';

import type { ReactNode } from 'react';
import { BarChart3, DoorOpen, Flame, Gauge, Keyboard, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { MetricStrip } from '@typemaster/ui';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageStore } from '../store/app-state-selectors';
import './home-page.css';

function getRaidSessions(sessions: any[]) {
    return sessions.filter((session) => session.kind === 'raid' || session.trainingMeta?.type === 'raid');
}

function getWeakFocus(skillProfile: any, sessions: any[]) {
    const latestRaid = getRaidSessions(sessions)[0];
    const raidWeakChars = latestRaid?.gameMeta?.weakestChars || latestRaid?.trainingMeta?.focusChars || latestRaid?.result?.topErrorChars;
    if (Array.isArray(raidWeakChars) && raidWeakChars.length) {
        return raidWeakChars.slice(0, 3).join(' / ');
    }
    return skillProfile?.topErrorChars?.slice(0, 3).join(' / ')
        || skillProfile?.weakZones?.[0]?.label
        || '节奏稳定';
}

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function HomeQuickCard({ icon: Icon, kicker, label, description, tone = 'default', onClick }: { icon: any; kicker: string; label: string; description: string; tone?: string; onClick: () => void }) {
    return (
        <button
            type="button"
            className={`home-quick-card home-quick-card--${tone}`}
            onClick={onClick}
        >
            <span className="home-quick-card__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
            </span>
            <span className="home-quick-card__text">
                <p className="home-quick-card__kicker">{kicker}</p>
                <strong>{label}</strong>
                <span>{description}</span>
            </span>
        </button>
    );
}

function HomeRecentChip({ icon: Icon, children, accent = false }: { icon: any; children: ReactNode; accent?: boolean }) {
    return (
        <span className={`home-recent-chip${accent ? ' home-recent-chip--accent' : ''}`}>
            <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
            {children}
        </span>
    );
}

export function HomePage() {
    const navigate = useAppNavigate();
    const store = useHomePageStore();
    const { language, sessions, sessionStreak, skillProfile, weeklyGoal } = store;
    const raidSessions = getRaidSessions(sessions);
    const latestRaid = raidSessions[0] || null;
    const weakFocus = getWeakFocus(skillProfile, sessions);
    const bestThreat = raidSessions.reduce((best, session) => Math.max(best, Number(session.gameMeta?.threatLevel || session.trainingMeta?.threatLevel || 0)), 0);
    const extractCount = raidSessions.filter((session) => (session.gameMeta?.endReason || session.trainingMeta?.endReason) === 'extract').length;
    const extractRate = raidSessions.length ? Math.round((extractCount / raidSessions.length) * 100) : 0;
    const metricItems = [
        {
            id: 'streak',
            icon: Flame,
            label: '连续训练',
            value: sessionStreak ? `${sessionStreak} 天` : '待启动',
            tone: 'streak'
        },
        {
            id: 'threat',
            icon: Gauge,
            label: '最高威胁',
            value: bestThreat || '--',
            tone: 'speed'
        },
        {
            id: 'extract',
            icon: DoorOpen,
            label: '稳定撤离率',
            value: raidSessions.length ? `${extractRate}%` : '--',
            tone: 'accuracy'
        }
    ];

    return (
        <div className="page-stack page-stack--home home-status-page-stack home-status-page-stack--dashboard">
            <section className="home-starter-hero" aria-label="Raid Command Center">
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Swords aria-hidden="true" size={15} strokeWidth={2.2} />
                        Arcade Coach
                    </span>
                    <h1>Arcade Rift 指挥台</h1>
                    <p className="hero-body">
                        先进入发光裂隙，用纯街机压力打出构筑；结算后再回看图鉴、弱区和下一局路线。
                    </p>
                    <div className="home-starter-hero__actions">
                        <button
                            type="button"
                            className="action-btn primary"
                            aria-label="开始 Arcade Rift"
                            onClick={() => navigate('/raid')}
                        >
                            <Swords aria-hidden="true" size={17} strokeWidth={2.25} />
                            开始 Arcade Rift
                        </button>
                        <button type="button" className="action-btn" onClick={() => navigate('/missions')}>
                            <Trophy aria-hidden="true" size={17} strokeWidth={2.25} />
                            查看任务
                        </button>
                    </div>
                </div>
            </section>

            <MetricStrip
                className="home-starter-metrics"
                ariaLabel="Raid progress"
                items={metricItems}
            />

            <section className="home-quick-cards" aria-label="Raid loop actions">
                <HomeQuickCard
                    icon={Swords}
                    kicker="Primary"
                    label="Arcade Rift"
                    description="输入怪物词，守住裂隙，在营门选择撤离或继续挑战。"
                    tone="primary"
                    onClick={() => navigate('/raid')}
                />
                <HomeQuickCard
                    icon={Keyboard}
                    kicker="Focus Lab"
                    label={`修复弱区：${weakFocus}`}
                    description="用两分钟短训练修正 Raid 暴露出的字符、节奏和准确率问题。"
                    onClick={() => navigate('/practice')}
                />
                <HomeQuickCard
                    icon={Target}
                    kicker="Missions"
                    label="今日任务"
                    description={`本周进度 ${weeklyGoal.completed}/${weeklyGoal.target}，完成任务后回到 Raid 验证。`}
                    onClick={() => navigate('/missions')}
                />
                <HomeQuickCard
                    icon={BarChart3}
                    kicker="Insights"
                    label="查看画像"
                    description="复盘速度、准确率、弱字符、Raid 存活时间和撤离稳定性。"
                    onClick={() => navigate('/insights')}
                />
            </section>

            {latestRaid ? (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">Latest Raid</p>
                        <h2>上一局反馈</h2>
                    </div>

                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Swords size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{latestRaid.trainingMeta?.title || 'Arcade Rift'}</strong>
                                <p>{formatDateTime(latestRaid.completedAt || latestRaid.result?.completedAt, language)}</p>
                            </div>
                            <div className="home-recent-item__metrics">
                                <HomeRecentChip icon={Gauge}>威胁 {latestRaid.gameMeta?.threatLevel || latestRaid.trainingMeta?.threatLevel || 1}</HomeRecentChip>
                                <HomeRecentChip icon={ShieldCheck} accent>{latestRaid.result?.accuracy || 0}%</HomeRecentChip>
                                <HomeRecentChip icon={DoorOpen}>{formatDuration(latestRaid.durationSeconds || latestRaid.result?.durationSeconds || 0)}</HomeRecentChip>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">First run</p>
                        <h2>先留下一次 Raid 样本</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Swords size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>无历史迁移，vNext 会从第一局重新建立画像。</strong>
                                <p>旧训练数据不会进入新主线，避免推荐和成就被历史逻辑污染。</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default HomePage;
