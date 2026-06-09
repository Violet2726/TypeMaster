import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { planGateway, type PlanGateway } from '../../../services/api';
import { loadSkillProfile } from '../../../services/storage';
import { useCurrentUserQuery, type CurrentUserSnapshot } from './use-current-user-query';

type SkillProfileSnapshot = Awaited<ReturnType<PlanGateway['loadSkillProfile']>>;
type SkillProfileQueryOptions = Omit<UseQueryOptions<SkillProfileSnapshot>, 'queryKey' | 'queryFn'>;
type SkillProfileUpdater = SkillProfileSnapshot | ((current: SkillProfileSnapshot) => SkillProfileSnapshot);

export function getSkillProfileQueryKey(userId = 'local') {
    return ['account', 'skill-profile', userId];
}

export async function fetchSkillProfile(account: CurrentUserSnapshot) {
    const fallback = loadSkillProfile();

    if (!account) {
        return fallback;
    }

    const remote = await planGateway.loadSkillProfile();
    return remote || fallback;
}

export function updateSkillProfileQueryData(queryClient: QueryClient, userId = 'local', updater: SkillProfileUpdater) {
    queryClient.setQueryData<SkillProfileSnapshot>(getSkillProfileQueryKey(userId), (current) => (
        typeof updater === 'function'
            ? updater(current ?? null)
            : updater
    ));
}

export function useSkillProfileQuery(options: SkillProfileQueryOptions = {}) {
    const { data: account = null } = useCurrentUserQuery();
    const userId = account?.id || 'local';

    return useQuery<SkillProfileSnapshot>({
        queryKey: getSkillProfileQueryKey(userId),
        queryFn: () => fetchSkillProfile(account),
        initialData: () => loadSkillProfile(),
        ...options
    });
}
