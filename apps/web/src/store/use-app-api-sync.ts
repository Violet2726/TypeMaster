import { useEffect, useRef } from 'react';

export function useAppApiSync({
    account,
    achievements,
    hydrateFromApi,
    planGateway,
    sessionStreak,
    setAccountStatus,
    skillProfile,
    trainingPlan,
    weeklyGoal
}) {
    const hydrateFromApiRef = useRef(hydrateFromApi);
    const hydratedUserIdRef = useRef(null);

    useEffect(() => {
        hydrateFromApiRef.current = hydrateFromApi;
    }, [hydrateFromApi]);

    useEffect(() => {
        if (!account) {
            hydratedUserIdRef.current = null;
            setAccountStatus('idle');
            return;
        }

        if (hydratedUserIdRef.current === account.id) {
            setAccountStatus('connected');
            return;
        }

        hydratedUserIdRef.current = account.id;
        setAccountStatus('connected');
        hydrateFromApiRef.current(account).catch(() => {
            setAccountStatus('error');
        });
    }, [account, setAccountStatus]);

    useEffect(() => {
        if (!account) {
            return;
        }

        planGateway.saveSkillProfile(skillProfile, {
            achievements,
            streakState: { current: sessionStreak, weeklyGoal }
        }).catch(() => {});
    }, [account, achievements, planGateway, sessionStreak, skillProfile, weeklyGoal]);

    useEffect(() => {
        if (!account) {
            return;
        }

        planGateway.saveTrainingPlan(trainingPlan).catch(() => {});
    }, [account, planGateway, trainingPlan]);
}
