import { createBuiltinDraft } from '@typemaster/domain';
import { createTrainingDataBundle, parseTrainingDataBundle } from '@typemaster/contracts/storage';
import { authGateway, planGateway, sessionGateway } from '../services/api';
import {
    saveCoachAdvices,
    saveSessions,
    saveSettings,
    saveSkillProfile,
    saveTrainingPlan
} from '../services/storage';
import { normalizeConfig } from './app-state-helpers';

function getSkillProfileSyncExtras(environment) {
    return {
        achievements: environment.achievements,
        streakState: {
            current: environment.sessionStreak,
            weeklyGoal: environment.weeklyGoal
        }
    };
}

function persistImportedTrainingData(payload) {
    saveSettings(payload.settings);
    saveSessions(payload.sessions);
    saveCoachAdvices(payload.coachAdviceRecords);
    saveSkillProfile(payload.skillProfile || null);
    saveTrainingPlan(payload.trainingPlan || null);
}

function syncImportedTrainingDataToApi(environment, payload) {
    if (!environment.account) {
        return;
    }

    Promise.all(payload.sessions.map((session) => sessionGateway.saveSession(session))).catch(() => {});
    planGateway.saveSkillProfile(payload.skillProfile || null, getSkillProfileSyncExtras(environment)).catch(() => {});
    planGateway.saveTrainingPlan(payload.trainingPlan || null).catch(() => {});
}

export async function hydrateAccountFromApi(environment, user) {
    if (!user) {
        return null;
    }

    const [remoteSessions, remoteProfile, remotePlan] = await Promise.all([
        sessionGateway.listSessions(),
        planGateway.loadSkillProfile(),
        planGateway.loadTrainingPlan()
    ]);

    if (remoteSessions.length) {
        saveSessions(remoteSessions);
        environment.setSessions(remoteSessions);
        environment.setLastCompletedSession(remoteSessions[0] || null);
    } else if (environment.sessions.length) {
        await Promise.all(environment.sessions.map((session) => sessionGateway.saveSession(session)));
    }

    if (remoteProfile) {
        saveSkillProfile(remoteProfile);
        environment.setSkillProfile(remoteProfile);
    } else if (environment.skillProfile) {
        await planGateway.saveSkillProfile(environment.skillProfile, getSkillProfileSyncExtras(environment));
    }

    if (remotePlan) {
        saveTrainingPlan(remotePlan);
        environment.setTrainingPlan(remotePlan);
    } else if (environment.trainingPlan) {
        await planGateway.saveTrainingPlan(environment.trainingPlan);
    }

    return user;
}

export async function signInToAccount(environment, displayName) {
    environment.setAccountStatus('loading');

    try {
        const user = await authGateway.signIn({ displayName });
        environment.updateCurrentUser(user);
        environment.setAccountStatus('connected');
        await hydrateAccountFromApi(environment, user);
        return user;
    } catch (error) {
        environment.setAccountStatus('error');
        throw error;
    }
}

export async function signOutFromAccount(environment) {
    environment.setAccountStatus('loading');
    await authGateway.signOut();
    environment.updateCurrentUser(null);
    environment.setAccountStatus('idle');
}

export function exportTrainingData(environment) {
    return JSON.stringify(createTrainingDataBundle({
        settings: environment.settings,
        sessions: environment.sessions,
        coachAdviceRecords: environment.coachAdviceRecords,
        skillProfile: environment.skillProfile,
        trainingPlan: environment.trainingPlan
    }), null, 2);
}

export function importTrainingData(environment, rawPayload) {
    const payload = parseTrainingDataBundle(typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload);
    const nextSettings = payload.settings || environment.settings;
    const nextSessions = payload.sessions;
    const nextCoachAdviceRecords = payload.coachAdviceRecords;
    const nextConfig = normalizeConfig(nextSettings.lastConfig || environment.config);

    environment.setSettingsState(nextSettings);
    environment.setConfigState(nextConfig);
    environment.setCurrentDraft(createBuiltinDraft(nextConfig, {
        language: nextSettings.language || environment.settings.language
    }));
    environment.setSessions(nextSessions);
    environment.setLastCompletedSession(nextSessions[0] || null);
    environment.setCoachAdviceRecords(nextCoachAdviceRecords);
    environment.setSkillProfile(payload.skillProfile || null);
    environment.setTrainingPlan(payload.trainingPlan || null);
    environment.setDiagnosticJourney(null);
    environment.setActiveSessionContext(null);

    persistImportedTrainingData({
        ...payload,
        settings: nextSettings,
        sessions: nextSessions,
        coachAdviceRecords: nextCoachAdviceRecords
    });
    syncImportedTrainingDataToApi(environment, {
        ...payload,
        sessions: nextSessions
    });
}
