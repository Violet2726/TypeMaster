import { useMemo } from 'react';
import { usePlanSnapshot } from '../../../store/app-state-derived';
import { useHistorySnapshot } from '../../../store/app-state-derived';
import { useShellSnapshot } from '../../../store/app-state-derived';
import { useAppActions } from '../../../store/use-app-action-set';
import { buildKeyboardHotspots, buildGameCodexFromSessions, buildInsights } from '@typemaster/domain';

export function useGameStore() {
    const plan = usePlanSnapshot();
    const history = useHistorySnapshot();
    const shell = useShellSnapshot();
    const { sessionActions } = useAppActions();

    const skillProfile = plan.skillProfile;
    const sessions = history.sessions;
    const language = shell.language;
    const keyboardLayout = shell.settings?.keyboardLayout || 'qwerty';

    const keyboardHotspots = useMemo(() => {
        if (!sessions || sessions.length === 0) return null;

        const recentSessions = sessions.slice(0, 30);
        const errorChars: string[] = [];

        recentSessions.forEach((session: any) => {
            const charStats = session?.result?.errorCharStats;
            if (Array.isArray(charStats)) {
                charStats.forEach((stat: any) => {
                    const label = stat?.label || '';
                    if (label.length === 1) {
                        for (let i = 0; i < (stat.count || 1); i++) {
                            errorChars.push(label);
                        }
                    }
                });
            }
        });

        if (errorChars.length === 0) return null;

        return buildKeyboardHotspots(errorChars, { keyboardLayout });
    }, [sessions, keyboardLayout]);

    const insights = useMemo(() => {
        if (!sessions || sessions.length === 0) return null;
        return buildInsights(sessions.slice(0, 30));
    }, [sessions]);
    const gameBestScore = useMemo(() => Math.max(0, ...(sessions || [])
        .filter((session: any) => session?.trainingMeta?.type === 'game' || session?.kind === 'game')
        .map((session: any) => Number(session?.trainingMeta?.score || session?.result?.score || 0))), [sessions]);
    const gameCodex = useMemo(() => buildGameCodexFromSessions((sessions || [])
        .filter((session: any) => session?.trainingMeta?.type === 'game' || session?.kind === 'game')), [sessions]);

    return {
        skillProfile,
        keyboardHotspots,
        insights,
        language,
        gameCodex,
        gameBestScore,
        recordCompletedGameSession: sessionActions.recordCompletedGameSession
    };
}
