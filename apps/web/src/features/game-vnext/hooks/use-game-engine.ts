import { useCallback, useEffect, useRef } from 'react';
import { createGameEngine, type GameCommand, type GameEngine, type GameMode } from '../runtime/game-engine';
import type { GameEvent, GameSnapshot } from '../../../types/game';

export type GameCommitUpdate = (update: { snapshot: GameSnapshot; events: GameEvent[] }, immediate?: boolean) => void;

export function useGameEngine({
    commitUpdate,
    focusChars,
    language,
    maybeSaveResult,
    resetSavedResult
}: {
    commitUpdate: GameCommitUpdate;
    focusChars: string[];
    language: string;
    maybeSaveResult: (snapshot: GameSnapshot | null) => void;
    resetSavedResult: () => void;
}) {
    const engineRef = useRef<GameEngine | null>(null);

    useEffect(() => {
        const engine = createGameEngine({
            language,
            focusChars
        });

        engineRef.current = engine;
        commitUpdate({ snapshot: engine.snapshot, events: [] }, true);

        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [commitUpdate, focusChars, language]);

    const dispatchAction = useCallback((command: GameCommand, payload: Record<string, unknown> = {}) => {
        const engine = engineRef.current;
        if (!engine) return;

        if (command === 'start' || command === 'retry') resetSavedResult();

        const update = engine.dispatch(command, payload);
        commitUpdate(update, true);
        maybeSaveResult(update.snapshot);
    }, [commitUpdate, maybeSaveResult, resetSavedResult]);

    const startGame = useCallback((gameMode: GameMode) => {
        dispatchAction('start', { gameMode, focusChars });
    }, [dispatchAction, focusChars]);

    return {
        dispatchAction,
        engineRef,
        startGame
    };
}
