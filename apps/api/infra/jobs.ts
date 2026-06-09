import { Inngest } from 'inngest';

export const inngest = new Inngest({
    id: 'typemaster-api'
});

export const jobEvents = {
    sessionCompleted: 'typing/session.completed',
    coachFeedbackRequested: 'coach/feedback.requested',
    profileRecomputeRequested: 'profile/recompute.requested',
    leaderboardRefreshRequested: 'leaderboard/refresh.requested'
} as const;

function isInngestDevEnabled(value: string | undefined) {
    if (!value) {
        return false;
    }

    return !['0', 'false', 'off', 'no'].includes(value.toLowerCase());
}

function shouldSendJobs() {
    return Boolean(
        process.env.INNGEST_EVENT_KEY ||
        process.env.INNGEST_BASE_URL ||
        process.env.INNGEST_EVENT_API_BASE_URL ||
        isInngestDevEnabled(process.env.INNGEST_DEV)
    );
}

async function sendJob(name: string, data: Record<string, unknown>) {
    if (!shouldSendJobs()) {
        return {
            skipped: true,
            name,
            data
        };
    }

    return inngest.send({
        name,
        data
    });
}

export function enqueueSessionCompletedWork(data: Record<string, unknown>) {
    return sendJob(jobEvents.sessionCompleted, data);
}

export function enqueueCoachFeedback(data: Record<string, unknown>) {
    return sendJob(jobEvents.coachFeedbackRequested, data);
}

export function enqueueProfileRecompute(data: Record<string, unknown>) {
    return sendJob(jobEvents.profileRecomputeRequested, data);
}

export function enqueueLeaderboardRefresh(data: Record<string, unknown>) {
    return sendJob(jobEvents.leaderboardRefreshRequested, data);
}
