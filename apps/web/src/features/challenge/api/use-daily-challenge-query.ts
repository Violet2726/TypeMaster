import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { challengeGateway, type ChallengeGateway } from '../../../services/api';

type DailyChallengeSnapshot = Awaited<ReturnType<ChallengeGateway['getDailyChallenge']>>;
type DailyChallengeQueryOptions = Omit<UseQueryOptions<DailyChallengeSnapshot>, 'queryKey' | 'queryFn'>;
type DailyChallengeUpdater = DailyChallengeSnapshot | ((current: DailyChallengeSnapshot | null) => DailyChallengeSnapshot | null);

export function getDailyChallengeQueryKey(language = 'zh-CN') {
    return ['daily-challenge', language];
}

export async function fetchDailyChallenge(language = 'zh-CN') {
    return challengeGateway.getDailyChallenge(language);
}

export function updateDailyChallengeQueryData(queryClient: QueryClient, language: string, updater: DailyChallengeUpdater) {
    queryClient.setQueryData<DailyChallengeSnapshot | null>(getDailyChallengeQueryKey(language), (current) => (
        typeof updater === 'function'
            ? updater(current ?? null)
            : updater
    ));
}

export function useDailyChallengeQuery(language = 'zh-CN', options: DailyChallengeQueryOptions = {}) {
    return useQuery<DailyChallengeSnapshot>({
        queryKey: getDailyChallengeQueryKey(language),
        queryFn: () => fetchDailyChallenge(language),
        ...options
    });
}
