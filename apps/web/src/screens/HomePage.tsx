'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, DoorOpen, Flame, Gauge, Keyboard, Target } from 'lucide-react';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageStore } from '../store/app-state-selectors';
import { getTypeRiftDepth, getTypeRiftEndReason, getTypeRiftSessions } from '../features/game/game-session';
import {
    NextActionCard,
    ProgressStrip,
    RecentRunCard,
    TodayHero,
    type ProgressItem
} from '../features/home/components/HomeDashboardSections';
import type { SkillProfile, TrainingSession } from '../types/training';
import './home-page.css';

const EmbeddedGamePage = dynamic(() => import('./GamePage'), {
    ssr: false
});

function getWeakFocus(skillProfile: SkillProfile | null, sessions: TrainingSession[]) {
    const latestGame = getTypeRiftSessions(sessions)[0];
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
    const typeRiftSectionRef = useRef<HTMLElement>(null);
    const [isTypeRiftOpen, setIsTypeRiftOpen] = useState(false);
    const { copy, language, sessions, sessionStreak, skillProfile, weeklyGoal } = useHomePageStore();
    const homeCopy = copy.home;
    const gameSessions = getTypeRiftSessions(sessions);
    const latestGame = gameSessions[0] || null;
    const weakFocus = getWeakFocus(skillProfile, sessions);
    const bestDepth = gameSessions.reduce((best, session) => Math.max(best, getTypeRiftDepth(session)), 0);
    const extractCount = gameSessions.filter((session) => ['extract', 'victory'].includes(getTypeRiftEndReason(session))).length;
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
    const openTypeRift = useCallback(() => {
        setIsTypeRiftOpen(true);
        window.history.replaceState(null, '', '#typerift');
        requestAnimationFrame(() => {
            typeRiftSectionRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
        });
    }, []);

    const closeTypeRift = useCallback(() => {
        setIsTypeRiftOpen(false);
        if (window.location.hash === '#typerift') {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
    }, []);

    useEffect(() => {
        const openFromHash = () => {
            if (window.location.hash !== '#typerift') return;
            setIsTypeRiftOpen(true);
            requestAnimationFrame(() => {
                typeRiftSectionRef.current?.scrollIntoView?.({ block: 'start' });
            });
        };

        openFromHash();
        window.addEventListener('hashchange', openFromHash);
        return () => window.removeEventListener('hashchange', openFromHash);
    }, []);

    return (
        <div className="page-stack page-stack--home home-status-page-stack home-status-page-stack--dashboard">
            <TodayHero
                kicker={homeCopy.commandKicker}
                title={homeCopy.commandTitle}
                body={homeCopy.commandBody}
                startLabel={homeCopy.startTypeRift}
                viewMissionsLabel={homeCopy.viewMissions}
                onStart={openTypeRift}
                onOpenMissions={() => navigate('/missions')}
            />

            <ProgressStrip ariaLabel={homeCopy.progressAria} items={metricItems} />

            {isTypeRiftOpen ? (
                <section id="typerift" ref={typeRiftSectionRef} className="home-typerift" aria-label={homeCopy.typeRiftLaneTitle}>
                    <EmbeddedGamePage onExit={closeTypeRift} />
                </section>
            ) : null}

            <section className="app-card-grid" aria-label={homeCopy.loopActionsAria}>
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
                depth={getTypeRiftDepth(latestGame) || 1}
                depthLabel={homeCopy.depthLabel}
                duration={formatDuration(latestGame?.durationSeconds || latestGame?.result?.durationSeconds || 0)}
                emptyBody={homeCopy.firstRunBody}
                isEmpty={!latestGame}
                kicker={latestGame ? homeCopy.latestTypeRift : homeCopy.firstRunKicker}
                runTitle={latestGame?.trainingMeta?.title || homeCopy.defaultRunTitle}
                title={latestGame ? homeCopy.lastRunSignal : homeCopy.firstRunTitle}
            />
        </div>
    );
}

export default HomePage;
