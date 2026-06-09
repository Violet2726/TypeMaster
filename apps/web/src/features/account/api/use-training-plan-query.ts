import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { planGateway, type PlanGateway } from '../../../services/api';
import { loadTrainingPlan } from '../../../services/storage';
import { useCurrentUserQuery, type CurrentUserSnapshot } from './use-current-user-query';

type TrainingPlanSnapshot = Awaited<ReturnType<PlanGateway['loadTrainingPlan']>>;
type TrainingPlanQueryOptions = Omit<UseQueryOptions<TrainingPlanSnapshot>, 'queryKey' | 'queryFn'>;
type TrainingPlanUpdater = TrainingPlanSnapshot | ((current: TrainingPlanSnapshot) => TrainingPlanSnapshot);

export function getTrainingPlanQueryKey(userId = 'local') {
    return ['account', 'training-plan', userId];
}

export async function fetchTrainingPlan(account: CurrentUserSnapshot) {
    const fallback = loadTrainingPlan();

    if (!account) {
        return fallback;
    }

    const remote = await planGateway.loadTrainingPlan();
    return remote || fallback;
}

export function updateTrainingPlanQueryData(queryClient: QueryClient, userId = 'local', updater: TrainingPlanUpdater) {
    queryClient.setQueryData<TrainingPlanSnapshot>(getTrainingPlanQueryKey(userId), (current) => (
        typeof updater === 'function'
            ? updater(current ?? null)
            : updater
    ));
}

export function useTrainingPlanQuery(options: TrainingPlanQueryOptions = {}) {
    const { data: account = null } = useCurrentUserQuery();
    const userId = account?.id || 'local';

    return useQuery<TrainingPlanSnapshot>({
        queryKey: getTrainingPlanQueryKey(userId),
        queryFn: () => fetchTrainingPlan(account),
        initialData: () => loadTrainingPlan(),
        ...options
    });
}
