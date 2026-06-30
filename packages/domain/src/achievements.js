function firstMatchDate(sessions, predicate) {
    const match = (Array.isArray(sessions) ? sessions : []).find(predicate);
    return match?.result?.completedAt || null;
}

export function buildAchievements({
    sessions,
    sessionStreak = 0,
    weeklyGoal = { completed: 0, target: 3 },
    skillProfile = null
}) {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    const achievements = [
        {
            id: 'first-session',
            title: 'First Session',
            description: 'Finish the first complete round.',
            unlockedAt: firstMatchDate(safeSessions, () => true)
        },
        {
            id: 'assessment-online',
            title: 'Assessment Online',
            description: 'Complete enough training to generate a skill profile.',
            unlockedAt: skillProfile?.createdAt || null
        },
        {
            id: 'steady-hand',
            title: 'Steady Hand',
            description: 'Finish a round with at least 97% accuracy.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (session?.result?.accuracy || 0) >= 97)
        },
        {
            id: 'rhythm-lock',
            title: 'Rhythm Lock',
            description: 'Finish a round with at least 90% consistency.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (session?.result?.consistency || 0) >= 90)
        },
        {
            id: 'triple-streak',
            title: 'Triple Streak',
            description: 'Train for 3 consecutive days.',
            unlockedAt: sessionStreak >= 3 ? new Date().toISOString() : null
        },
        {
            id: 'week-locked',
            title: 'Week Locked',
            description: 'Hit the weekly goal.',
            unlockedAt: weeklyGoal.completed >= weeklyGoal.target ? new Date().toISOString() : null
        },
        {
            id: 'challenge-posted',
            title: 'Challenge Posted',
            description: 'Submit a result to the daily challenge.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'challenge')
        },
        {
            id: 'fast-lane',
            title: 'Fast Lane',
            description: 'Break 100 WPM in a completed round.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (session?.result?.wpm || 0) >= 100)
        },
        {
            id: 'first-game',
            title: 'First Descent',
            description: 'Finish your first TypeRift run.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'game')
        },
        {
            id: 'combo-20',
            title: 'Combo Master',
            description: 'Reach a 20-combo streak in TypeRift.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'game' && (session?.trainingMeta?.maxCombo || 0) >= 20)
        },
        {
            id: 'depth-5',
            title: 'Echo Survivor',
            description: 'Reach depth 5 in TypeRift.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (
                session?.trainingMeta?.type === 'game'
                && (session?.trainingMeta?.depth || 0) >= 5
            ))
        },
        {
            id: 'game-extract',
            title: 'Clean Extraction',
            description: 'Extract from TypeRift with lives remaining.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (
                session?.trainingMeta?.type === 'game'
                && (
                    session?.trainingMeta?.endReason === 'extract'
                    || session?.trainingMeta?.endReason === 'victory'
                )
                && (session?.trainingMeta?.livesRemaining ?? 1) > 0
            ))
        },
        {
            id: 'game-1000',
            title: 'Echo Commander',
            description: 'Score 1000+ points in a single TypeRift run.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'game' && (session?.result?.score || 0) >= 1000)
        }
    ];

    return achievements.map((achievement) => ({
        ...achievement,
        unlocked: Boolean(achievement.unlockedAt)
    }));
}
