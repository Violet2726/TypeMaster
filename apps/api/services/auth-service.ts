import type { RequestIdentity } from '../infra/auth-context';
import { getTrainingRepository, type RepositoryIdentity } from '../repositories/training-repository';

function toRepositoryIdentity(identity: RequestIdentity): RepositoryIdentity {
    return {
        provider: identity.provider,
        providerUserId: identity.userId,
        displayName: identity.displayName,
        email: identity.email
    };
}

export function getCurrentUserForIdentity(identity: RequestIdentity) {
    return getTrainingRepository().getUserForIdentity(toRepositoryIdentity(identity));
}

export async function getUserIdForIdentity(identity: RequestIdentity) {
    const user = await getCurrentUserForIdentity(identity);
    return user?.id;
}

export function signInUser(displayName: string) {
    return getTrainingRepository().signInUser(displayName);
}
