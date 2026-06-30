'use client';

import type { ReactNode } from 'react';
import { BarChart3, DoorOpen, Flame, Gauge, Keyboard, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { MetricStrip } from '@typemaster/ui';
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
        || 'rhythm';
}

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
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
    const { language, sessions, sessionStreak, skillProfile, weeklyGoal } = useHomePageStore();
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
            label: 'Training streak',
            value: sessionStreak ? `${sessionStreak} days` : 'Ready',
            tone: 'streak'
        },
        {
            id: 'depth',
            icon: Gauge,
            label: 'Best depth',
            value: bestDepth || '--',
            tone: 'speed'
        },
        {
            id: 'extract',
            icon: DoorOpen,
            label: 'Extraction rate',
            value: gameSessions.length ? `${extractRate}%` : '--',
            tone: 'accuracy'
        }
    ];

    return (
        <div className="page-stack page-stack--home home-status-page-stack home-status-page-stack--dashboard">
            <section className="home-starter-hero" aria-label="TypeRift Command Center">
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Swords aria-hidden="true" size={15} strokeWidth={2.2} />
                        Echo Siege
                    </span>
                    <h1>TypeRift Command Center</h1>
                    <p className="hero-body">
                        Launch v7 runs, build weapon-relic-glyph synergies, and turn typing pressure into survival data without carrying legacy game history forward.
                    </p>
                    <div className="home-starter-hero__actions">
                        <button type="button" className="action-btn primary" aria-label="Start TypeRift" onClick={() => navigate('/raid')}>
                            <Swords aria-hidden="true" size={17} strokeWidth={2.25} />
                            Start TypeRift
                        </button>
                        <button type="button" className="action-btn" onClick={() => navigate('/missions')}>
                            <Trophy aria-hidden="true" size={17} strokeWidth={2.25} />
                            View missions
                        </button>
                    </div>
                </div>
            </section>

            <MetricStrip className="home-starter-metrics" ariaLabel="TypeRift progress" items={metricItems} />

            <section className="home-quick-cards" aria-label="TypeRift loop actions">
                <HomeQuickCard
                    icon={Swords}
                    kicker="Primary"
                    label="TypeRift"
                    description="Type enemy tags, evolve weapons, and choose whether to extract after bosses or dive deeper."
                    tone="primary"
                    onClick={() => navigate('/raid')}
                />
                <HomeQuickCard
                    icon={Keyboard}
                    kicker="Focus Lab"
                    label={`Repair weak zone: ${weakFocus}`}
                    description="Convert exposed TypeRift weak characters into a short precision drill."
                    onClick={() => navigate('/practice')}
                />
                <HomeQuickCard
                    icon={Target}
                    kicker="Missions"
                    label="Today loop"
                    description={`Weekly progress ${weeklyGoal.completed}/${weeklyGoal.target}; return to TypeRift after the drill.`}
                    onClick={() => navigate('/missions')}
                />
                <HomeQuickCard
                    icon={BarChart3}
                    kicker="Insights"
                    label="Review signal"
                    description="Read speed, accuracy, weak characters, survival duration, and extraction consistency."
                    onClick={() => navigate('/insights')}
                />
            </section>

            {latestGame ? (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">Latest TypeRift</p>
                        <h2>Last run signal</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Swords size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>{latestGame.trainingMeta?.title || 'TypeRift: Echo Siege'}</strong>
                                <p>{formatDateTime(latestGame.completedAt || latestGame.result?.completedAt, language)}</p>
                            </div>
                            <div className="home-recent-item__metrics">
                                <HomeRecentChip icon={Gauge}>Depth {latestGame.gameMeta?.depth || latestGame.trainingMeta?.depth || 1}</HomeRecentChip>
                                <HomeRecentChip icon={ShieldCheck} accent>{latestGame.result?.accuracy || 0}%</HomeRecentChip>
                                <HomeRecentChip icon={DoorOpen}>{formatDuration(latestGame.durationSeconds || latestGame.result?.durationSeconds || 0)}</HomeRecentChip>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">First run</p>
                        <h2>Create the first v7 game sample</h2>
                    </div>
                    <div className="home-recent-list">
                        <div className="home-recent-item">
                            <span className="home-recent-item__icon" aria-hidden="true">
                                <Swords size={16} strokeWidth={2.2} />
                            </span>
                            <div className="home-recent-item__body">
                                <strong>No legacy migration. v7 starts with your first TypeRift descent.</strong>
                                <p>Old game artifacts are cleaned on startup and do not feed recommendations, achievements, or codex progress.</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default HomePage;
