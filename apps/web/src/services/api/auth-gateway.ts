import { AccountRecordSchema, CurrentUserResponseSchema, SignInRequestSchema, SignInResponseSchema } from '@typemaster/contracts/api';
import {
    buildPublicUser,
    createFallbackAccountRecord,
    getCurrentUserRecord,
    readApiFallbackCache,
    writeApiFallbackCache
} from './local-cache';
import { requestJson } from './remote';

type AccountRecord = ReturnType<typeof AccountRecordSchema.parse>;

export class AuthGateway {
    async getCurrentUser() {
        try {
            const payload = await requestJson('/me', {
                responseSchema: CurrentUserResponseSchema
            });
            return buildPublicUser(payload.user);
        } catch {
            const state = readApiFallbackCache();
            return buildPublicUser(getCurrentUserRecord(state));
        }
    }

    async signIn({ displayName }) {
        const safeName = String(displayName || '').trim();
        if (!safeName) {
            throw new Error('Display name is required.');
        }

        try {
            const payload = await requestJson('/auth/sign-in', {
                method: 'POST',
                body: { displayName: safeName },
                requestSchema: SignInRequestSchema,
                responseSchema: SignInResponseSchema
            });
            const state = readApiFallbackCache();
            state.currentUserId = payload.user.id;
            state.users[payload.user.id] = {
                ...(state.users[payload.user.id] || {}),
                ...payload.user
            };
            writeApiFallbackCache(state);
            return buildPublicUser(payload.user);
        } catch {
            const state = readApiFallbackCache();
            const existing = Object.values(state.users).find((user: AccountRecord) => user.displayName.toLowerCase() === safeName.toLowerCase());
            const record = existing || AccountRecordSchema.parse(createFallbackAccountRecord(safeName));

            state.users[record.id] = record;
            state.currentUserId = record.id;
            writeApiFallbackCache(state);
            return buildPublicUser(record);
        }
    }

    async signOut() {
        const state = readApiFallbackCache();
        state.currentUserId = null;
        writeApiFallbackCache(state);
        return true;
    }
}
