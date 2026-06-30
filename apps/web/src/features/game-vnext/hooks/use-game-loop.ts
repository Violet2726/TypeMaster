import { useEffect, useRef, type RefObject } from 'react';
import type { GameEngine } from '../runtime/game-engine';
import type { TypeRiftRenderer } from '../runtime/canvas-renderer';
import type { GameCommitUpdate } from './use-game-engine';
import type { GameSnapshot } from '../../../types/game';

export function useGameLoop({
    canvasRef,
    commitUpdate,
    engineRef,
    maybeSaveResult,
    rendererRef
}: {
    canvasRef: RefObject<HTMLCanvasElement>;
    commitUpdate: GameCommitUpdate;
    engineRef: RefObject<GameEngine | null>;
    maybeSaveResult: (snapshot: GameSnapshot | null) => void;
    rendererRef: RefObject<TypeRiftRenderer | null>;
}) {
    const frameRef = useRef<number>(0);
    const lastFrameTimeRef = useRef(0);

    useEffect(() => {
        function loop(timestamp: number) {
            const canvas = canvasRef.current;
            const engine = engineRef.current;
            const renderer = rendererRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !engine || !renderer || !ctx) {
                frameRef.current = requestAnimationFrame(loop);
                return;
            }

            if (document.hidden) {
                lastFrameTimeRef.current = timestamp;
                frameRef.current = requestAnimationFrame(loop);
                return;
            }

            if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
            const delta = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.08);
            lastFrameTimeRef.current = timestamp;

            const update = engine.tick(delta);
            commitUpdate(update);
            renderer.render(ctx, update.snapshot, delta);
            maybeSaveResult(update.snapshot);

            frameRef.current = requestAnimationFrame(loop);
        }

        frameRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frameRef.current);
            lastFrameTimeRef.current = 0;
        };
    }, [canvasRef, commitUpdate, engineRef, maybeSaveResult, rendererRef]);
}

