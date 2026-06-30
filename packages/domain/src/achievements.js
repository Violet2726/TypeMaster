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
            id: 'first-raid',
            title: 'First Rift',
            description: 'Finish your first Arcade Rift run.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'raid')
        },
        {
            id: 'combo-20',
            title: 'Combo Master',
            description: 'Reach a 20-combo streak in Arcade Rift.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'raid' && (session?.trainingMeta?.maxCombo || 0) >= 20)
        },
        {
            id: 'wave-10',
            title: 'Rift Survivor',
            description: 'Survive to Rift Layer 10 in Arcade Rift.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (
                session?.trainingMeta?.type === 'raid'
                && (session?.trainingMeta?.riftLayer || session?.trainingMeta?.threatLevel || session?.trainingMeta?.wave || 0) >= 10
            ))
        },
        {
            id: 'raid-perfect',
            title: 'Clean Extraction',
            description: 'Extract from Arcade Rift with lives remaining.',
            unlockedAt: firstMatchDate(safeSessions, (session) => (
                session?.trainingMeta?.type === 'raid'
                && (
                    session?.trainingMeta?.endReason === 'extract'
                    || (session?.trainingMeta?.perfectWaves || 0) > 0
                )
                && (session?.trainingMeta?.livesRemaining ?? 1) > 0
            ))
        },
        {
            id: 'raid-1000',
            title: 'Rift Commander',
            description: 'Score 1000+ points in a single Arcade Rift run.',
            unlockedAt: firstMatchDate(safeSessions, (session) => session?.trainingMeta?.type === 'raid' && (session?.result?.score || 0) >= 1000)
        }
    ];

    return achievements.map((achievement) => ({
        ...achievement,
        unlocked: Boolean(achievement.unlockedAt)
    }));
}
