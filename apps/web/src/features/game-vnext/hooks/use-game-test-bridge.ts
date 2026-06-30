import { useEffect, type RefObject } from 'react';
import type { GameEngine } from '../runtime/game-engine';
import type { TypeRiftRenderer } from '../runtime/canvas-renderer';
import type { GameCommitUpdate } from './use-game-engine';
import type { GameSnapshot } from '../../../types/game';

export function useGameTestBridge({
    canvasRef,
    commitUpdate,
    engineRef,
    maybeSaveResult,
    rendererRef,
    snapshotRef
}: {
    canvasRef: RefObject<HTMLCanvasElement>;
    commitUpdate: GameCommitUpdate;
    engineRef: RefObject<GameEngine | null>;
    maybeSaveResult: (snapshot: GameSnapshot | null) => void;
    rendererRef: RefObject<TypeRiftRenderer | null>;
    snapshotRef: RefObject<GameSnapshot | null>;
}) {
    useEffect(() => {
        (window as any).render_game_to_text = function () {
            const current = snapshotRef.current;
            if (!current) return '{}';
            return JSON.stringify({
                phase: current.phase,
                mode: current.mode,
                hud: current.hud,
                enemies: current.arena.enemies.map((enemy) => ({
                    id: enemy.id,
                    type: enemy.type,
                    word: enemy.word,
                    typed: enemy.typed,
                    y: Number(enemy.y.toFixed(3))
                }))
            });
        };

        (window as any).advanceTime = function (ms: number) {
            const engine = engineRef.current;
            const renderer = rendererRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!engine || !renderer || !ctx) return;

            const steps = Math.max(1, Math.round(ms / 16));
            let update = { snapshot: engine.snapshot, events: [] as any[] };
            for (let index = 0; index < steps; index += 1) {
                update = engine.tick(1 / 60);
            }
            commitUpdate(update, true);
            renderer.render(ctx, update.snapshot, 1 / 60);
            maybeSaveResult(update.snapshot);
        };

        return () => {
            delete (window as any).render_game_to_text;
            delete (window as any).advanceTime;
        };
    }, [canvasRef, commitUpdate, engineRef, maybeSaveResult, rendererRef, snapshotRef]);
}

