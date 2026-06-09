import type { Hono } from 'hono';
import { SubmitChallengeResultRequestSchema } from '@typemaster/contracts/api';
import {
    getChallengeLeaderboard,
    getDailyChallengeSnapshot,
    submitChallengeAttempt
} from '../services/challenge-service';
import { getUserIdForIdentity } from '../services/auth-service';
import { resolveRequestIdentity } from '../infra/auth-context';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';

export function registerChallengeRoutes(app: Hono) {
    app.get('/challenges/daily', async (c) => {
        const language = c.req.query('language') || 'en-US';
        return c.json({ challenge: await getDailyChallengeSnapshot(language) });
    });

    app.post('/challenge-attempts', async (c) => {
        try {
            const identity = await resolveRequestIdentity(c);
            const userId = await getUserIdForIdentity(identity);
            const body = await parseJsonBody(c, SubmitChallengeResultRequestSchema);
            const entry = await submitChallengeAttempt({
                challengeId: body.challengeId,
                userId,
                displayName: body.displayName,
                sessionId: body.sessionId,
                result: body.result
            });
            return c.json({ entry });
        } catch (error: unknown) {
            return createBadRequestResponse(c, error);
        }
    });

    app.get('/leaderboards/challenge', async (c) => {
        const challengeId = c.req.query('challengeId');
        return c.json({ leaderboard: await getChallengeLeaderboard(challengeId) });
    });
}
