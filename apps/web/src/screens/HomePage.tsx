'use client';

import { BarChart3, DoorOpen, Flame, Gauge, Keyboard, ShieldCheck, Swords, Target } from 'lucide-react';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageStore } from '../store/app-state-selectors';
import {
    NextActionCard,
    ProgressStrip,
    RecentRunCard,
    TodayHero,
    type ProgressItem
} from '../features/home/components/HomeDashboardSections';
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
    const metricItems: ProgressItem[] = [
        {
            id: 'streak',
            icon: Flame,
            label: homeCopy.trainingStreak,
            value: sessionStreak ? `${sessionStreak}` : homeCopy.ready,
            tone: 'warning'
        },
        {
            id: 'depth',
            icon: Gauge,
            label: homeCopy.bestDepth,
            value: bestDepth || '--',
            tone: 'primary'
        },
        {
            id: 'extract',
            icon: DoorOpen,
            label: homeCopy.extractionRate,
            value: gameSessions.length ? `${extractRate}%` : '--',
            tone: 'success'
        }
    ];

    return (
        <div className="page-stack page-stack--home home-status-page-stack home-status-page-stack--dashboard">
            <TodayHero
                kicker={homeCopy.commandKicker}
                title={homeCopy.commandTitle}
                body={homeCopy.commandBody}
                startLabel={homeCopy.startTypeRift}
                viewMissionsLabel={homeCopy.viewMissions}
                onStart={() => navigate('/raid')}
                onOpenMissions={() => navigate('/missions')}
            />

            <ProgressStrip ariaLabel={homeCopy.progressAria} items={metricItems} />

            <section className="app-card-grid" aria-label={homeCopy.loopActionsAria}>
                <NextActionCard
                    icon={Swords}
                    kicker={homeCopy.primaryLane}
                    label={homeCopy.typeRiftLaneTitle}
                    description={homeCopy.typeRiftLaneBody}
                    tone="primary"
                    onClick={() => navigate('/raid')}
                />
                <NextActionCard
                    icon={Keyboard}
                    kicker={copy.nav.practice}
                    label={fillTemplate(homeCopy.focusLane, { value: weakFocus || homeCopy.noWeakFocus })}
                    description={homeCopy.focusLaneBody}
                    onClick={() => navigate('/practice')}
                />
                <NextActionCard
                    icon={Target}
                    kicker={copy.nav.missions}
                    label={homeCopy.missionLane}
                    description={fillTemplate(homeCopy.missionLaneBody, { completed: weeklyGoal.completed, target: weeklyGoal.target })}
                    onClick={() => navigate('/missions')}
                />
                <NextActionCard
                    icon={BarChart3}
                    kicker={copy.nav.insights}
                    label={homeCopy.insightLane}
                    description={homeCopy.insightLaneBody}
                    onClick={() => navigate('/insights')}
                />
            </section>

            <RecentRunCard
                accuracy={latestGame?.result?.accuracy || 0}
                date={latestGame ? formatDateTime(latestGame.completedAt || latestGame.result?.completedAt, language) : ''}
                depth={latestGame?.gameMeta?.depth || latestGame?.trainingMeta?.depth || 1}
                depthLabel={homeCopy.depthLabel}
                duration={formatDuration(latestGame?.durationSeconds || latestGame?.result?.durationSeconds || 0)}
                emptyBody={homeCopy.firstRunBody}
                emptyDescription={homeCopy.typeRiftLaneBody}
                isEmpty={!latestGame}
                kicker={latestGame ? homeCopy.latestTypeRift : homeCopy.firstRunKicker}
                runTitle={latestGame?.trainingMeta?.title || homeCopy.defaultRunTitle}
                title={latestGame ? homeCopy.lastRunSignal : homeCopy.firstRunTitle}
            />
        </div>
    );
}

export default HomePage;
