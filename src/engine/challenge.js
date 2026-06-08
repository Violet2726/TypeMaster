function toNumber(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
}

export function compareChallengeScores(left, right) {
    const leftWpm = toNumber(left?.wpm);
    const rightWpm = toNumber(right?.wpm);

    if (leftWpm !== rightWpm) {
        return rightWpm - leftWpm;
    }

    return toNumber(right?.accuracy) - toNumber(left?.accuracy);
}

export function sortChallengeLeaderboard(entries = []) {
    return [...entries].sort(compareChallengeScores);
}

export function mergeChallengeLeaderboardEntries(entries = [], nextEntry, limit = 20) {
    if (!nextEntry?.sessionId) {
        return sortChallengeLeaderboard(entries).slice(0, limit);
    }

    return sortChallengeLeaderboard([
        nextEntry,
        ...entries.filter((entry) => entry?.sessionId !== nextEntry.sessionId)
    ]).slice(0, limit);
}

export function createChallengeEntryPreview({ account, skillProfile, sessionId, result }) {
    return {
        id: `preview-${sessionId}`,
        sessionId,
        displayName: account?.displayName || 'Guest',
        userId: account?.id || null,
        levelId: skillProfile?.level?.id || null,
        wpm: toNumber(result?.wpm),
        accuracy: toNumber(result?.accuracy),
        createdAt: result?.completedAt || new Date().toISOString()
    };
}

export function getChallengeStanding(leaderboard = [], sessionId) {
    if (!sessionId) {
        return null;
    }

    const sorted = sortChallengeLeaderboard(leaderboard);
    const index = sorted.findIndex((entry) => entry?.sessionId === sessionId);

    if (index === -1) {
        return null;
    }

    const rank = index + 1;
    const total = sorted.length;
    const beatPercent = total <= 1
        ? 100
        : Math.round(((total - rank) / (total - 1)) * 100);

    return {
        entry: sorted[index],
        rank,
        total,
        beatPercent
    };
}

export function getChallengePersonalBest(sessions = [], challengeId, sessionId) {
    const sameChallengeSessions = sessions.filter((session) => (
        session?.trainingMeta?.type === 'challenge'
        && session?.trainingMeta?.stepId === challengeId
    ));
    const currentSession = sameChallengeSessions.find((session) => session?.id === sessionId) || null;

    if (!currentSession) {
        return {
            attempts: 0,
            bestSession: null,
            isPersonalBest: false,
            gapWpm: 0,
            gapAccuracy: 0
        };
    }

    const bestSession = [...sameChallengeSessions]
        .sort((left, right) => compareChallengeScores(left?.result, right?.result))[0];
    const isPersonalBest = compareChallengeScores(currentSession.result, bestSession?.result) === 0;
    const bestWpm = toNumber(bestSession?.result?.wpm);
    const currentWpm = toNumber(currentSession?.result?.wpm);
    const bestAccuracy = toNumber(bestSession?.result?.accuracy);
    const currentAccuracy = toNumber(currentSession?.result?.accuracy);

    return {
        attempts: sameChallengeSessions.length,
        bestSession,
        isPersonalBest,
        gapWpm: isPersonalBest ? 0 : Math.max(0, bestWpm - currentWpm),
        gapAccuracy: isPersonalBest || bestWpm !== currentWpm
            ? 0
            : Math.max(0, bestAccuracy - currentAccuracy)
    };
}

export function getLatestChallengeSession(sessions = [], challengeId) {
    if (!challengeId) {
        return null;
    }

    return getChallengeSessions(sessions, challengeId)[0] || null;
}

export function getChallengeLevelLeaderboard(leaderboard = [], levelId) {
    if (!levelId) {
        return leaderboard;
    }

    return leaderboard.filter((entry) => entry?.levelId === levelId);
}

export function getChallengeSessions(sessions = [], challengeId) {
    if (!challengeId) {
        return [];
    }

    return [...sessions]
        .filter((session) => (
            session?.trainingMeta?.type === 'challenge'
            && session?.trainingMeta?.stepId === challengeId
        ))
        .sort((left, right) => {
            const leftTime = Date.parse(left?.result?.completedAt || 0);
            const rightTime = Date.parse(right?.result?.completedAt || 0);

            if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
                return rightTime - leftTime;
            }

            return 0;
        });
}

export function buildChallengeTrend(challengeSessions = []) {
    const points = [...challengeSessions]
        .slice()
        .reverse()
        .map((session, index, all) => {
            const previous = all[index - 1];

            return ({
                id: session.id,
                attempt: index + 1,
                completedAt: session?.result?.completedAt || null,
                wpm: toNumber(session?.result?.wpm),
                accuracy: toNumber(session?.result?.accuracy),
                deltaWpm: previous ? toNumber(session?.result?.wpm) - toNumber(previous?.result?.wpm) : 0,
                deltaAccuracy: previous ? toNumber(session?.result?.accuracy) - toNumber(previous?.result?.accuracy) : 0
            });
        });

    const first = points[0] || null;
    const latest = points[points.length - 1] || null;
    const best = [...points].sort((left, right) => compareChallengeScores(left, right))[0] || null;
    const deltaWpm = first && latest ? latest.wpm - first.wpm : 0;
    const deltaAccuracy = first && latest ? latest.accuracy - first.accuracy : 0;
    const maxWpm = points.length ? Math.max(...points.map((point) => point.wpm), 0) : 0;
    const minWpm = points.length ? Math.min(...points.map((point) => point.wpm), 0) : 0;

    return {
        points,
        first,
        latest,
        best,
        attempts: points.length,
        deltaWpm,
        deltaAccuracy,
        spanWpm: maxWpm - minWpm,
        bestIndex: best ? points.findIndex((point) => point.id === best.id) : -1
    };
}

export function getChallengeTrendState(trend) {
    if (!trend?.attempts) {
        return 'idle';
    }

    if (trend.attempts === 1) {
        return 'warm';
    }

    if (trend.deltaWpm >= 5 && trend.deltaAccuracy >= -1) {
        return 'improving';
    }

    if (trend.deltaWpm <= -5 || trend.deltaAccuracy <= -3) {
        return 'cooling';
    }

    return 'steady';
}

export function getChallengePointFocusState(point) {
    if (!point) {
        return 'empty';
    }

    if (Number(point.attempt || 0) <= 1) {
        return 'baseline';
    }

    const deltaWpm = toNumber(point.deltaWpm);
    const deltaAccuracy = toNumber(point.deltaAccuracy);

    if (deltaWpm >= 5 && deltaAccuracy >= -1) {
        return 'breakthrough';
    }

    if (deltaAccuracy <= -3) {
        return 'accuracy-risk';
    }

    if (deltaWpm <= -5) {
        return 'speed-drop';
    }

    if (Math.abs(deltaWpm) <= 2 && Math.abs(deltaAccuracy) <= 1) {
        return 'stable';
    }

    return 'mixed';
}

export function getChallengeStrategyState(trend, personalBest) {
    const baseState = getChallengeTrendState(trend);
    const attempts = Number(trend?.attempts || 0);
    const gapWpm = Number(personalBest?.gapWpm || 0);
    const gapAccuracy = Number(personalBest?.gapAccuracy || 0);

    if (
        attempts >= 3
        && (
            gapWpm >= 10
            || gapAccuracy >= 2
            || baseState === 'cooling'
        )
    ) {
        return 'recover';
    }

    if (baseState === 'improving') {
        return 'push';
    }

    return baseState;
}
