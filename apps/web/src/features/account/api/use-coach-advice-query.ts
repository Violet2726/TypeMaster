import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { CoachAdviceListResponseSchema } from '@typemaster/contracts/api';
import { requestJson, shouldUseRemoteApi } from '../../../services/api/remote';
import { loadCoachAdvices } from '../../../services/storage';
import { useCurrentUserQuery } from './use-current-user-query';

type CoachAdviceList = ReturnType<typeof loadCoachAdvices>;
type CoachAdviceQueryOptions = Omit<UseQueryOptions<CoachAdviceList>, 'queryKey' | 'queryFn'>;
type CoachAdviceUpdater = CoachAdviceList | ((current: CoachAdviceList) => CoachAdviceList);

export function getCoachAdviceQueryKey(userId = 'local') {
    return ['account', 'coach-advices', userId];
}

export async function fetchCoachAdvices() {
    if (shouldUseRemoteApi()) {
        try {
            const response = await requestJson('/coach-feedback', {
                responseSchema: CoachAdviceListResponseSchema
            });

            return response.coachAdvices;
        } catch {
            return loadCoachAdvices();
        }
    }

    return loadCoachAdvices();
}

export function updateCoachAdviceQueryData(queryClient: QueryClient, userId = 'local', updater: CoachAdviceUpdater) {
    queryClient.setQueryData<CoachAdviceList>(getCoachAdviceQueryKey(userId), (current) => (
        typeof updater === 'function'
            ? updater(Array.isArray(current) ? current : [])
            : updater
    ));
}

export function useCoachAdviceQuery(options: CoachAdviceQueryOptions = {}) {
    const { data: account = null } = useCurrentUserQuery();
    const userId = account?.id || 'local';

    return useQuery<CoachAdviceList>({
        queryKey: getCoachAdviceQueryKey(userId),
        queryFn: fetchCoachAdvices,
        initialData: () => loadCoachAdvices(),
        ...options
    });
}
