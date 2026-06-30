import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameResult, GameSnapshot } from '../../../types/game';

function resultKey(snapshot: GameSnapshot | null, result?: GameResult | null) {
    if (!snapshot || !result) return '';
    return `${snapshot.phase}:${result.score}:${result.durationSeconds}:${result.maxCombo}`;
}

export function useGameResultPersistence({
    bestScore: initialBestScore,
    recordCompletedGameSession
}: {
    bestScore: number;
    recordCompletedGameSession: (result: GameResult) => void;
}) {
    const savedResultKeyRef = useRef('');
    const bestResultKeyRef = useRef('');
    const bestScoreRef = useRef(0);
    const [bestScore, setBestScore] = useState(0);

    useEffect(() => {
        bestScoreRef.current = initialBestScore;
        setBestScore(initialBestScore);
    }, [initialBestScore]);

    const resetSavedResult = useCallback(() => {
        savedResultKeyRef.current = '';
    }, []);

    const maybeSaveResult = useCallback((nextSnapshot: GameSnapshot | null) => {
        if (!nextSnapshot || nextSnapshot.phase !== 'gameover') return;
        const result = nextSnapshot.overlay?.result;
        if (!result) return;

        const key = resultKey(nextSnapshot, result);
        if (savedResultKeyRef.current === key) return;
        savedResultKeyRef.current = key;
        if (result.score > bestScoreRef.current) bestResultKeyRef.current = key;

        recordCompletedGameSession(result);
        setBestScore((current) => {
            const next = Math.max(current, result.score);
            bestScoreRef.current = next;
            return next;
        });
    }, [recordCompletedGameSession]);

    const isBestResult = useCallback((snapshot: GameSnapshot | null, result?: GameResult | null) => {
        const key = resultKey(snapshot, result);
        return bestResultKeyRef.current === key || Number(result?.score || 0) > bestScore;
    }, [bestScore]);

    return {
        bestScore,
        isBestResult,
        maybeSaveResult,
        resetSavedResult
    };
}

