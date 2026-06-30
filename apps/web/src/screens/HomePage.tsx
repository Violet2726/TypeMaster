'use client';

import type { ReactNode } from 'react';
import { BarChart3, DoorOpen, Flame, Gauge, Keyboard, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { Button, MetricStrip } from '@typemaster/ui';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageStore } from '../store/app-state-selectors';
import './home-page.css';

function getGameSessions(sessions: any[]) {
    return sessions.filter((session) => session.kind === 'game' || session.trainingMeta?.type === 'game');
}

function getWeakFocus(skillProfile: any, sessions: any[]) {
    const latestGame = getGameSessions(sessions)[0];
    const chars = latestGame?.gameMeta?.weakestChars || latestGame?.trainingMeta?.focusChars || latestGame?.result?.topErrorChars;
    if (Array.isArray(chars) && chars.length) return chars.slice(0, 3).join(' / ');
    return skillProfile?.topErrorChars?.slice(0, 3).join(' / ')
        || skillProfile?.weakZones?.[0]?.label
        || '';
}

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function fillTemplate(template: string, values: Record<string, string | number>) {
    return Object.entries(values).reduce((text, [key, value]) => (
        text.replaceAll(`{${key}}`, String(value))
    ), template);
}

function HomeQuickCard({ icon: Icon, kicker, label, description, tone = 'default', onClick }: {
    icon: any;
    kicker: string;
    label: string;
    description: string;
    tone?: string;
    onClick: () => void;
}) {
    return (
        <button type="button" className={`home-quick-card home-quick-card--${tone}`} onClick={onClick}>
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
    const { copy, language, sessions, sessionStreak, skillProfile, weeklyGoal } = useHomePageStore();
    const homeCopy = copy.home;
    const gameSessions = getGameSessions(sessions);
    const latestGame = gameSessions[0] || null;
    const weakFocus = getWeakFocus(skillProfile, sessions);
    const bestDepth = gameSessions.reduce((best, session) => Math.max(best, Number(session.gameMeta?.depth || session.trainingMeta?.depth || 0)), 0);
    const extractCount = gameSessions.filter((session) => ['extract', 'victory'].includes(session.gameMeta?.endReason || session.trainingMeta?.endReason)).length;
    const extractRate = gameSessions.length ? Math.round((extractCount / gameSessions.length) * 100) : 0;
    const metricItems = [
        {
            id: 'streak',
            icon: Flame,
            label: homeCopy.trainingStreak,
            value: sessionStreak ? `${sessionStreak}` : homeCopy.ready,
            tone: 'streak'
        },
        {
            id: 'depth',
            icon: Gauge,
            label: homeCopy.bestDepth,
            value: bestDepth || '--',
            tone: 'speed'
        },
        {
            id: 'extract',
            icon: DoorOpen,
            label: homeCopy.extractionRate,
            value: gameSessions.length ? `${extractRate}%` : '--',
            tone: 'accuracy'
        }
    ];

    return (
        <div className="page-stack page-stack--home home-status-page-stack home-status-page-stack--dashboard">
            <section className="home-starter-hero" aria-label={homeCopy.commandTitle}>
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Swords aria-hidden="true" size={15} strokeWidth={2.2} />
                        {homeCopy.commandKicker}
                    </span>
                    <h1>{homeCopy.commandTitle}</h1>
                    <p className="hero-body">
                        {homeCopy.commandBody}
                    </p>
                    <div className="home-starter-hero__actions">
                        <Button variant="primary" icon={Swords} aria-label={homeCopy.startTypeRift} onClick={() => navigate('/raid')}>
                            {homeCopy.startTypeRift}
                        </Button>
                        <Button icon={Trophy} onClick={() => navigate('/missions')}>
                            {homeCopy.viewMissions}
                        </Button>
                    </div>
                </div>
            </section>

            <MetricStrip className="home-starter-metrics" ariaLabel={homeCopy.progressAria} items={metricItems} />

            <section className="home-quick-cards" aria-label={homeCopy.loopActionsAria}>
                <HomeQuickCard
                    icon={Swords}
                    kicker={homeCopy.primaryLane}
                    label={homeCopy.typeRiftLaneTitle}
                    description={homeCopy.typeRiftLaneBody}
                    tone="primary"
                    onClick={() => navigate('/raid')}
                />
                <HomeQuickCard
                    icon={Keyboard}
                    kicker={copy.nav.practice}
                    label={fillTemplate(homeCopy.focusLane, { value: weakFocus || homeCopy.noWeakFocus })}
                    description={homeCopy.focusLaneBody}
                    onClick={() => navigate('/practice')}
                />
                <HomeQuickCard
                    icon={Target}
                    kicker={copy.nav.missions}
                    label={homeCopy.missionLane}
                    description={fillTemplate(homeCopy.missionLaneBody, { completed: weeklyGoal.completed, target: weeklyGoal.target })}
                    onClick={() => navigate('/missions')}
                />
                <HomeQuickCard
                    icon={BarChart3}
                    kicker={copy.nav.insights}
                    label={homeCopy.insightLane}
                    description={homeCopy.insightLaneBody}
                    onClick={() => navigate('/insights')}
                />
            </section>

            {latestGame ? (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">{homeCopy.latestTypeRift}</p>
                        <h2>{homeCopy.lastRunSignal}</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Swords size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{latestGame.trainingMeta?.title || homeCopy.defaultRunTitle}</strong>
                                <p>{formatDateTime(latestGame.completedAt || latestGame.result?.completedAt, language)}</p>
                            </div>
                            <div className="home-recent-item__metrics">
                                <HomeRecentChip icon={Gauge}>{homeCopy.depthLabel} {latestGame.gameMeta?.depth || latestGame.trainingMeta?.depth || 1}</HomeRecentChip>
                                <HomeRecentChip icon={ShieldCheck} accent>{latestGame.result?.accuracy || 0}%</HomeRecentChip>
                                <HomeRecentChip icon={DoorOpen}>{formatDuration(latestGame.durationSeconds || latestGame.result?.durationSeconds || 0)}</HomeRecentChip>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">{homeCopy.firstRunKicker}</p>
                        <h2>{homeCopy.firstRunTitle}</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Swords size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{homeCopy.firstRunBody}</strong>
                                <p>{homeCopy.typeRiftLaneBody}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default HomePage;
