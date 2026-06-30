import type { LoadedGameAssets } from './asset-loader';
import { createCamera, mapArenaY, resizeCamera, type GameCamera } from './camera';
import { drawParticles, emitParticles, updateParticles, type GameParticle } from './particles';
import { drawArenaGrid } from './rendering/arena';
import { drawBackground } from './rendering/background';
import { drawEnemy } from './rendering/enemy';
import { drawFallbackStatus } from './rendering/status';
import type { EnemyView, RenderContext } from './rendering/types';
import type { GameSnapshot } from '../../../types/game';

export class TypeRiftRenderer {
    private camera: GameCamera = createCamera();
    private particles: GameParticle[] = [];
    private reducedMotion = false;
    private assets: LoadedGameAssets | null = null;

    private get renderContext(): RenderContext {
        return {
            assets: this.assets,
            camera: this.camera
        };
    }

    setAssets(assets: LoadedGameAssets | null) {
        this.assets = assets;
    }

    resize(width: number, height: number, dpr = 1) {
        resizeCamera(this.camera, width, height, dpr);
    }

    setReducedMotion(value: boolean) {
        this.reducedMotion = value;
        if (value) this.particles = [];
    }

    handleEvents(events: any[], snapshot: GameSnapshot | null) {
        if (this.reducedMotion) return;

        events.forEach((event) => {
            const enemy = snapshot?.arena?.enemies?.find((item: EnemyView) => item.id === event.enemyId);
            const color = enemy?.color || event.enemy?.color || '#64d2ff';
            const x = ((enemy?.xRatio ?? event.enemy?.xRatio ?? 0.5) * this.camera.width);
            const y = mapArenaY(this.camera, enemy?.y ?? event.enemy?.y ?? 0.62);
            if (['enemy_defeated', 'boss_defeated', 'enemy_shield_broken', 'char_error', 'upgrade_blast'].includes(event.type)) {
                emitParticles(this.particles, x, y, event.type === 'char_error' ? '#ff453a' : color, event.type === 'boss_defeated' ? 42 : 22);
            }
        });
    }

    render(ctx: CanvasRenderingContext2D, snapshot: GameSnapshot | null, deltaTime: number) {
        const render = this.renderContext;
        this.particles = updateParticles(this.particles, deltaTime);
        drawBackground(ctx, snapshot, render);
        drawArenaGrid(ctx, snapshot, render);
        (snapshot?.arena?.enemies || []).forEach((enemy) => drawEnemy(ctx, enemy, render));
        drawParticles(ctx, this.particles);
        drawFallbackStatus(ctx, snapshot, render);
    }
}
