import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { sessionGateway, type SessionGateway } from '../../../services/api';
import { loadSessions } from '../../../services/storage';
import { useCurrentUserQuery, type CurrentUserSnapshot } from './use-current-user-query';

type SessionList = Awaited<ReturnType<SessionGateway['listSessions']>>;
type SessionsQueryOptions = Omit<UseQueryOptions<SessionList>, 'queryKey' | 'queryFn'>;
type SessionListUpdater = SessionList | ((current: SessionList) => SessionList);

export function getSessionsQueryKey(userId = 'local') {
    return ['account', 'sessions', userId];
}

export async function fetchSessions(account: CurrentUserSnapshot) {
    const fallback = loadSessions();

    if (!account) {
        return fallback;
    }

    const remoteSessions = await sessionGateway.listSessions();
    return remoteSessions.length ? remoteSessions : fallback;
}

export function updateSessionsQueryData(queryClient: QueryClient, userId = 'local', updater: SessionListUpdater) {
    queryClient.setQueryData<SessionList>(getSessionsQueryKey(userId), (current) => (
        typeof updater === 'function'
            ? updater(Array.isArray(current) ? current : [])
            : updater
    ));
}

export function useSessionsQuery(options: SessionsQueryOptions = {}) {
    const { data: account = null } = useCurrentUserQuery();
    const userId = account?.id || 'local';

    return useQuery<SessionList>({
        queryKey: getSessionsQueryKey(userId),
        queryFn: () => fetchSessions(account),
        initialData: () => loadSessions(),
        ...options
    });
}
