import { Hono } from 'hono';
import { vi } from 'vitest';

const { mockVerifyToken } = vi.hoisted(() => ({
    mockVerifyToken: vi.fn()
}));

vi.mock('@clerk/backend', () => ({
    verifyToken: mockVerifyToken
}));

async function readIdentity(headers: Record<string, string> = {}) {
    const { resolveRequestIdentity } = await import('../infra/auth-context');
    const app = new Hono();

    app.get('/identity', async (c) => c.json(await resolveRequestIdentity(c)));

    const response = await app.request('/identity', { headers });
    return response.json();
}

describe('auth context', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
        mockVerifyToken.mockReset();
    });

    test('resolves Clerk identity from a protected bearer token when Clerk is configured', async () => {
        vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_typemaster');
        mockVerifyToken.mockResolvedValue({
            sub: 'user_clerk_123',
            sid: 'sess_123',
            name: 'Clerk Alice',
            email: 'alice@example.test'
        });

        const identity = await readIdentity({
            Authorization: 'Bearer clerk-session-token'
        });

        expect(mockVerifyToken).toHaveBeenCalledWith('clerk-session-token', expect.objectContaining({
            secretKey: 'sk_test_typemaster'
        }));
        expect(identity).toMatchObject({
            provider: 'clerk',
            userId: 'user_clerk_123',
            displayName: 'Clerk Alice',
            email: 'alice@example.test'
        });
    });

    test('uses local development bearer identity only outside production when Clerk is not configured', async () => {
        const identity = await readIdentity({
            Authorization: 'Bearer typemaster-local:user-local-1'
        });

        expect(mockVerifyToken).not.toHaveBeenCalled();
        expect(identity).toEqual({
            provider: 'local-dev',
            userId: 'user-local-1'
        });
    });

    test('does not accept local development identity in production', async () => {
        vi.stubEnv('NODE_ENV', 'production');

        const identity = await readIdentity({
            Authorization: 'Bearer typemaster-local:user-local-1'
        });

        expect(identity).toEqual({
            provider: 'anonymous',
            userId: null
        });
    });
});
