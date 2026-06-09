import { Hono } from 'hono';
import { registerAiRoutes } from './ai';
import { registerAuthRoutes } from './auth';
import { registerChallengeRoutes } from './challenges';
import { registerCoachFeedbackRoutes } from './coach-feedback';
import { registerExportRoutes } from './exports';
import { registerInngestRoutes } from './inngest';
import { registerPlanRoutes } from './plans';
import { registerProfileRoutes } from './profiles';
import { registerSessionRoutes } from './sessions';
import { registerOpenApiRoutes } from './openapi';

export function createApiRoutes() {
    const apiRoutes = new Hono();

    registerOpenApiRoutes(apiRoutes);
    registerAiRoutes(apiRoutes);
    registerAuthRoutes(apiRoutes);
    registerSessionRoutes(apiRoutes);
    registerCoachFeedbackRoutes(apiRoutes);
    registerExportRoutes(apiRoutes);
    registerPlanRoutes(apiRoutes);
    registerProfileRoutes(apiRoutes);
    registerChallengeRoutes(apiRoutes);
    registerInngestRoutes(apiRoutes);

    return apiRoutes;
}
