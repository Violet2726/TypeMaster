import { createClerkClient } from '@clerk/backend';

export class AuthError extends Error {
    constructor(
        public readonly status: 401 | 403,
        message: string
    ) {
        super(message);
    }
}

const secretKey = process.env.CLERK_SECRET_KEY;
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerk = secretKey && publishableKey ? createClerkClient({ secretKey, publishableKey }) : null;

export async function resolvePlayerId(request: Request): Promise<string> {
    if (clerk) {
        const state = await clerk.authenticateRequest(request);
        if (state.isAuthenticated) {
            const auth = state.toAuth();
            if (auth.userId) return auth.userId;
        }
        throw new AuthError(401, 'Authentication required.');
    }
    if (process.env.NODE_ENV === 'production') throw new AuthError(401, 'Clerk is not configured.');
    const localId = request.headers.get('x-typerift-player') ?? 'guest-local';
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(localId)) throw new AuthError(403, 'Invalid local player id.');
    return localId;
}
