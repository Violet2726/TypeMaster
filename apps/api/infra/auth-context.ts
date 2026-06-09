import type { Context } from 'hono';
import { verifyToken } from '@clerk/backend';

const LOCAL_DEV_TOKEN_PREFIX = 'typemaster-local:';

export type RequestIdentity = {
    userId: string | null,
    provider: 'clerk' | 'local-dev' | 'anonymous',
    displayName?: string | null,
    email?: string | null,
    claims?: Record<string, unknown>,
};

function getBearerToken(c: Context) {
    const header = c.req.header('authorization') || '';
    const [scheme, token] = header.split(/\s+/, 2);

    return scheme?.toLowerCase() === 'bearer' && token ? token : '';
}

function isClerkConfigured() {
    return Boolean(process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT_KEY);
}

function isProductionRuntime() {
    return process.env.NODE_ENV === 'production';
}

async function verifyClerkBearerToken(token: string) {
    const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        jwtKey: process.env.CLERK_JWT_KEY,
        authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES
            ? process.env.CLERK_AUTHORIZED_PARTIES.split(',').map((value) => value.trim()).filter(Boolean)
            : undefined
    });

    return {
        userId: payload.sub,
        provider: 'clerk' as const,
        displayName: resolveClaimDisplayName(payload as Record<string, unknown>),
        email: resolveClaimEmail(payload as Record<string, unknown>),
        claims: payload as Record<string, unknown>
    };
}

function stringClaim(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolveClaimDisplayName(claims: Record<string, unknown>) {
    const fullName = stringClaim(claims.name);
    const username = stringClaim(claims.username);
    const givenName = stringClaim(claims.given_name);
    const familyName = stringClaim(claims.family_name);
    const composedName = [givenName, familyName].filter(Boolean).join(' ').trim();

    return fullName || username || composedName || null;
}

function resolveClaimEmail(claims: Record<string, unknown>) {
    return stringClaim(claims.email) || stringClaim(claims.email_address);
}

function resolveLocalDevelopmentIdentity(token: string): RequestIdentity {
    if (!token.startsWith(LOCAL_DEV_TOKEN_PREFIX) || isProductionRuntime()) {
        return {
            userId: null,
            provider: 'anonymous'
        };
    }

    const userId = decodeURIComponent(token.slice(LOCAL_DEV_TOKEN_PREFIX.length)).trim();

    return {
        userId: userId || null,
        provider: userId ? 'local-dev' : 'anonymous'
    };
}

export async function resolveRequestIdentity(c: Context): Promise<RequestIdentity> {
    const token = getBearerToken(c);

    if (token && isClerkConfigured()) {
        return verifyClerkBearerToken(token);
    }

    if (token) {
        return resolveLocalDevelopmentIdentity(token);
    }

    return {
        userId: null,
        provider: 'anonymous'
    };
}
