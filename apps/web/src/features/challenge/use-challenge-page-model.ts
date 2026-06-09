import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    buildChallengeTrend,
    getChallengeLevelLeaderboard,
    getChallengePersonalBest,
    getChallengeSessions,
    getChallengeStanding,
    getLatestChallengeSession
} from '@typemaster/domain';
import { getTrainingCopy } from '../../training/copy';

function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}

function buildPersonalNote(copy, trainingCopy, latestChallengeSession, personalBest) {
    if (!latestChallengeSession) {
        return trainingCopy.challenge.statusEmpty;
    }

    if (personalBest.isPersonalBest) {
        return copy.result.challengeBestFresh;
    }

    if (personalBest.gapWpm > 0) {
        return fillTemplate(copy.result.challengeBestGapWpm, personalBest.gapWpm);
    }

    if (personalBest.gapAccuracy > 0) {
        return fillTemplate(copy.result.challengeBestGapAccuracy, personalBest.gapAccuracy);
    }

    return trainingCopy.challenge.statusReady;
}

export function useChallengePageModel({
    account,
    challengeGateway,
    copy,
    dailyChallenge,
    language,
    navigate,
    refreshDailyChallenge,
    sessions,
    skillProfile,
    startDailyChallenge
}) {
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const [leaderboard, setLeaderboard] = useState(() => dailyChallenge?.leaderboard || []);
    const peerLevelId = skillProfile?.level?.id || null;
    const challengeSessions = useMemo(
        () => getChallengeSessions(sessions, dailyChallenge?.id),
        [dailyChallenge?.id, sessions]
    );
    const challengeTrend = useMemo(
        () => buildChallengeTrend(challengeSessions),
        [challengeSessions]
    );
    const latestChallengeSession = useMemo(
        () => getLatestChallengeSession(sessions, dailyChallenge?.id),
        [dailyChallenge?.id, sessions]
    );
    const personalStanding = useMemo(
        () => getChallengeStanding(leaderboard, latestChallengeSession?.id),
        [leaderboard, latestChallengeSession?.id]
    );
    const personalBest = useMemo(
        () => getChallengePersonalBest(sessions, dailyChallenge?.id, latestChallengeSession?.id),
        [dailyChallenge?.id, latestChallengeSession?.id, sessions]
    );
    const peerLeaderboard = useMemo(
        () => getChallengeLevelLeaderboard(leaderboard, peerLevelId),
        [leaderboard, peerLevelId]
    );
    const peerStanding = useMemo(
        () => getChallengeStanding(peerLeaderboard, latestChallengeSession?.id),
        [latestChallengeSession?.id, peerLeaderboard]
    );
    const personalNote = useMemo(
        () => buildPersonalNote(copy, trainingCopy, latestChallengeSession, personalBest),
        [copy, latestChallengeSession, personalBest, trainingCopy]
    );
    const latestGapValue = useMemo(() => {
        if (!latestChallengeSession) {
            return copy.common.emptyValue;
        }

        if ((personalBest?.attempts || 0) <= 1 || personalBest?.isPersonalBest) {
            return `0 ${copy.common.wpm}`;
        }

        if (personalBest?.gapWpm > 0) {
            return `-${personalBest.gapWpm} ${copy.common.wpm}`;
        }

        if (personalBest?.gapAccuracy > 0) {
            return `-${personalBest.gapAccuracy}%`;
        }

        return copy.common.emptyValue;
    }, [copy.common.emptyValue, copy.common.wpm, latestChallengeSession, personalBest]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            const challenge = dailyChallenge || await refreshDailyChallenge();
            const nextLeaderboard = await challengeGateway.getChallengeLeaderboard(challenge.id, language);

            if (active) {
                setLeaderboard(nextLeaderboard);
            }
        };

        load().catch(() => {});

        return () => {
            active = false;
        };
    }, [challengeGateway, dailyChallenge, language, refreshDailyChallenge]);

    const handleStart = useCallback(async () => {
        await startDailyChallenge();
        navigate('/practice');
    }, [navigate, startDailyChallenge]);

    return {
        account,
        challengeSessions,
        challengeTrend,
        copy,
        dailyChallenge,
        handleStart,
        language,
        latestChallengeSession,
        latestGapValue,
        leaderboard,
        peerLeaderboard,
        peerStanding,
        personalBest,
        personalNote,
        personalStanding,
        skillProfile,
        trainingCopy
    };
}
