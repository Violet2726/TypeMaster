import type { TrainingSession } from '../../types/training';

export function isTypeRiftSession(session: TrainingSession | null | undefined) {
    return session?.kind === 'game' || session?.trainingMeta?.type === 'game';
}

export function getTypeRiftSessions(sessions: TrainingSession[] = []) {
    return sessions.filter(isTypeRiftSession);
}

export function getTypeRiftScore(session: TrainingSession) {
    return Number(session.trainingMeta?.score || session.result?.score || 0);
}

export function getTypeRiftDepth(session: TrainingSession | null | undefined) {
    return Number(session?.gameMeta?.depth || session?.trainingMeta?.depth || session?.trainingMeta?.areaIndex || 0);
}

export function getTypeRiftEndReason(session: TrainingSession) {
    return session.gameMeta?.endReason || session.trainingMeta?.endReason || '';
}
