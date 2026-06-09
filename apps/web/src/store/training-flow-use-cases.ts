import {
    createDiagnosticJourney,
    createDraftFromText,
    createDraftFromTrainingStep,
    createDraftFromWords,
    createStarterTrainingPlan,
    getActiveJourneyStep,
    getActiveTrainingStep
} from '@typemaster/domain';
import { challengeGateway } from '../services/api';
import { normalizeConfig } from './app-state-helpers';

export function applyTrainingTask(environment, task, context = null) {
    if (!task) {
        return null;
    }

    const nextConfig = normalizeConfig(task.config);
    const draft = createDraftFromTrainingStep(task, environment.settings.language);

    environment.setConfigState(nextConfig);
    environment.setCurrentDraft(draft);
    environment.setPracticeError(null);
    environment.setAiPracticeStatus('idle');
    environment.setActiveSessionContext(context);

    return draft;
}

export function createOrRefreshTrainingPlan(environment, profile = environment.skillProfile) {
    if (!profile) {
        return null;
    }

    const nextPlan = createStarterTrainingPlan(profile, environment.settings.language);
    environment.setTrainingPlan(nextPlan);
    return nextPlan;
}

export function startDiagnosticJourney(environment) {
    const existingJourney = environment.diagnosticJourney?.status === 'active'
        ? environment.diagnosticJourney
        : createDiagnosticJourney(environment.settings.language);
    const activeStep = getActiveJourneyStep(existingJourney);

    environment.setDiagnosticJourney(existingJourney);
    applyTrainingTask(environment, activeStep, {
        type: 'diagnostic',
        journeyId: existingJourney.id,
        stepId: activeStep?.id || null
    });

    return existingJourney;
}

export function startTrainingPlanStep(environment) {
    const nextPlan = environment.trainingPlan?.status === 'active'
        ? environment.trainingPlan
        : createOrRefreshTrainingPlan(environment, environment.skillProfile);
    const activeStep = getActiveTrainingStep(nextPlan);

    if (!activeStep) {
        return null;
    }

    applyTrainingTask(environment, activeStep, {
        type: 'plan',
        planId: nextPlan.id,
        stepId: activeStep.id
    });

    return activeStep;
}

export function startRecommendedSession(environment) {
    if (!environment.skillProfile) {
        startDiagnosticJourney(environment);
        return 'diagnostic';
    }

    startTrainingPlanStep(environment);
    return 'plan';
}

export async function refreshDailyChallenge(environment) {
    const challenge = await challengeGateway.getDailyChallenge(environment.settings.language);
    environment.setDailyChallenge(challenge);
    return challenge;
}

export async function startDailyChallenge(environment) {
    const challenge = environment.dailyChallengeState || await refreshDailyChallenge(environment);
    const nextConfig = normalizeConfig(challenge.config);
    const draftMeta = {
        label: challenge.title,
        generatedBy: 'builtin',
        language: environment.settings.language
    };
    const seededDraft = createDraftFromText(challenge.text, nextConfig, draftMeta);
    const nextDraft = nextConfig.mode === 'words' && seededDraft.words.length > nextConfig.wordCount
        ? createDraftFromWords(seededDraft.words.slice(0, nextConfig.wordCount), nextConfig, {
            ...draftMeta,
            createdAt: seededDraft.sourceTextMeta?.createdAt || undefined
        })
        : seededDraft;

    environment.setConfigState(nextConfig);
    environment.setCurrentDraft(nextDraft);
    environment.setPracticeError(null);
    environment.setAiPracticeStatus('idle');
    environment.setActiveSessionContext({
        type: 'challenge',
        challengeId: challenge.id,
        stepId: challenge.id,
        title: challenge.title,
        summary: challenge.summary
    });

    return challenge;
}
