import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { authGateway, type AuthGateway } from '../../../services/api';

export type CurrentUserSnapshot = Awaited<ReturnType<AuthGateway['getCurrentUser']>>;
type CurrentUserQueryOptions = Omit<UseQueryOptions<CurrentUserSnapshot>, 'queryKey' | 'queryFn'>;
type CurrentUserUpdater = CurrentUserSnapshot | ((current: CurrentUserSnapshot) => CurrentUserSnapshot);

export function getCurrentUserQueryKey() {
    return ['account', 'current-user'];
}

export async function fetchCurrentUser() {
    return authGateway.getCurrentUser();
}

export function updateCurrentUserQueryData(queryClient: QueryClient, updater: CurrentUserUpdater) {
    queryClient.setQueryData<CurrentUserSnapshot>(getCurrentUserQueryKey(), (current) => (
        typeof updater === 'function'
            ? updater(current ?? null)
            : updater
    ));
}

export function useCurrentUserQuery(options: CurrentUserQueryOptions = {}) {
    return useQuery<CurrentUserSnapshot>({
        queryKey: getCurrentUserQueryKey(),
        queryFn: fetchCurrentUser,
        ...options
    });
}
