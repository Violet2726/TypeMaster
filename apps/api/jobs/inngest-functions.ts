import { jobEvents, inngest } from '../infra/jobs';
import {
    generateCoachFeedbackJob,
    recomputeSkillProfileJob,
    refreshChallengeLeaderboardJob
} from './background-jobs';

export const coachFeedbackFunction = inngest.createFunction(
    {
        id: 'typemaster-coach-feedback',
        triggers: { event: jobEvents.coachFeedbackRequested }
    },
    async ({ event }) => generateCoachFeedbackJob(event.data || {})
);

export const profileRecomputeFunction = inngest.createFunction(
    {
        id: 'typemaster-profile-recompute',
        triggers: { event: jobEvents.profileRecomputeRequested }
    },
    async ({ event }) => recomputeSkillProfileJob(event.data || {})
);

export const leaderboardRefreshFunction = inngest.createFunction(
    {
        id: 'typemaster-leaderboard-refresh',
        triggers: { event: jobEvents.leaderboardRefreshRequested }
    },
    async ({ event }) => refreshChallengeLeaderboardJob(event.data || {})
);

export const inngestFunctions = [
    coachFeedbackFunction,
    profileRecomputeFunction,
    leaderboardRefreshFunction
];
