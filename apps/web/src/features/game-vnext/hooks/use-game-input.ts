import { useCallback, useEffect, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';
import type { GameCommand, GameEngine } from '../runtime/game-engine';
import type { GameCommitUpdate } from './use-game-engine';
import type { GameSnapshot } from '../../../types/game';

export function useGameInput({
    commitUpdate,
    dispatchAction,
    engineRef,
    inputRef,
    maybeSaveResult
}: {
    commitUpdate: GameCommitUpdate;
    dispatchAction: (command: GameCommand, payload?: Record<string, unknown>) => void;
    engineRef: RefObject<GameEngine | null>;
    inputRef: RefObject<HTMLInputElement>;
    maybeSaveResult: (snapshot: GameSnapshot | null) => void;
}) {
    useEffect(() => {
        function handleKey(event: KeyboardEvent) {
            if (event.target === inputRef.current) return;
            const engine = engineRef.current;
            if (!engine) return;
            const update = engine.handleKey(event);
            commitUpdate(update, update.events.length > 0);
            maybeSaveResult(update.snapshot);
        }

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [commitUpdate, engineRef, inputRef, maybeSaveResult]);

    const handleVirtualBeforeInput = useCallback((event: FormEvent<HTMLInputElement>) => {
        const nativeEvent = event.nativeEvent as InputEvent;
        const char = String(nativeEvent.data || '').slice(-1).toLowerCase();
        if (!char) return;
        event.preventDefault();
        const engine = engineRef.current;
        if (engine?.state?.upgradeChoices?.length && /^[123]$/.test(char)) {
            dispatchAction('choose-upgrade', { upgradeId: engine.state.upgradeChoices[Number(char) - 1]?.id });
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        dispatchAction('type-char', { char });
        if (inputRef.current) inputRef.current.value = '';
    }, [dispatchAction, engineRef, inputRef]);

    const handleInputKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement>) => {
        const engine = engineRef.current;
        if (!engine) return;
        if (engine.state?.upgradeChoices?.length && /^[123]$/.test(event.key)) {
            event.preventDefault();
            const update = engine.handleKey(event.nativeEvent);
            commitUpdate(update, update.events.length > 0);
            maybeSaveResult(update.snapshot);
            return;
        }
        if (event.key.length === 1) return;
        const update = engine.handleKey(event.nativeEvent);
        commitUpdate(update, update.events.length > 0);
        maybeSaveResult(update.snapshot);
    }, [commitUpdate, engineRef, maybeSaveResult]);

    return {
        handleInputKeyDown,
        handleVirtualBeforeInput
    };
}
