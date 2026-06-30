import { getAssetImage, type LoadedGameAssets } from './asset-loader';
import { arenaBottom, arenaTop, createCamera, mapArenaY, resizeCamera, type GameCamera } from './camera';
import { drawParticles, emitParticles, updateParticles, type GameParticle } from './particles';

type EnemyView = {
    id: string,
    type: string,
    archetype?: string,
    color?: string,
    word: string,
    typed: string,
    xRatio: number,
    y: number,
    hp: number,
    maxHp: number,
    shield?: number,
    isTarget?: boolean,
    elite?: boolean,
    boss?: boolean,
    bossId?: string,
};

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export class TypeRiftRenderer {
    private camera: GameCamera = createCamera();
    private particles: GameParticle[] = [];
    private reducedMotion = false;
    private assets: LoadedGameAssets | null = null;

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

    handleEvents(events: any[], snapshot: any) {
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

    render(ctx: CanvasRenderingContext2D, snapshot: any, deltaTime: number) {
        this.particles = updateParticles(this.particles, deltaTime);
        this.drawBackground(ctx, snapshot);
        this.drawArenaGrid(ctx, snapshot);
        this.drawEnemies(ctx, snapshot?.arena?.enemies || []);
        drawParticles(ctx, this.particles);
        this.drawFallbackStatus(ctx, snapshot);
    }

    private drawBackground(ctx: CanvasRenderingContext2D, snapshot: any) {
        const { width, height } = this.camera;
        const area = snapshot?.area;
        const bg = area?.id ? getAssetImage(this.assets, 'backgrounds', area.id) : null;
        if (bg) {
            ctx.drawImage(bg, 0, 0, width, height);
            ctx.fillStyle = 'rgba(5,7,12,0.28)';
            ctx.fillRect(0, 0, width, height);
            return;
        }

        const palette = area?.palette || ['#64d2ff', '#34c759', '#ffffff'];
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#06080d');
        gradient.addColorStop(0.52, '#11131b');
        gradient.addColorStop(1, '#08070b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, height * 0.82, 20, width * 0.5, height * 0.82, height * 0.8);
        glow.addColorStop(0, `${palette[0]}33`);
        glow.addColorStop(0.48, `${palette[1]}18`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    }

    private drawArenaGrid(ctx: CanvasRenderingContext2D, snapshot: any) {
        const { width } = this.camera;
        const top = arenaTop(this.camera);
        const bottom = arenaBottom(this.camera);
        const heat = clamp((snapshot?.hud?.heat || 0) / 100, 0, 1);

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        for (let index = 1; index < 8; index += 1) {
            const x = (width / 8) * index;
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            ctx.stroke();
        }
        ctx.strokeStyle = `rgba(255,69,58,${0.24 + heat * 0.28})`;
        ctx.beginPath();
        ctx.moveTo(0, bottom);
        ctx.lineTo(width, bottom);
        ctx.stroke();
        ctx.restore();
    }

    private drawEnemies(ctx: CanvasRenderingContext2D, enemies: EnemyView[]) {
        enemies.forEach((enemy) => {
            const size = enemy.boss ? 118 : enemy.elite ? 74 : 56;
            const x = clamp(enemy.xRatio * this.camera.width, size * 0.72, this.camera.width - size * 0.72);
            const y = mapArenaY(this.camera, enemy.y);
            const image = enemy.boss
                ? getAssetImage(this.assets, 'bosses', enemy.bossId || enemy.archetype || enemy.type)
                : getAssetImage(this.assets, 'enemies', enemy.archetype || enemy.type);

            ctx.save();
            ctx.translate(x, y);
            if (enemy.isTarget) this.drawTargetRing(ctx, size, enemy.color || '#64d2ff');
            if (image) ctx.drawImage(image, -size / 2, -size / 2, size, size);
            else this.drawProceduralEnemy(ctx, enemy, size);
            this.drawEnemyHp(ctx, enemy, size);
            this.drawWordPlate(ctx, enemy, size);
            ctx.restore();
        });
    }

    private drawTargetRing(ctx: CanvasRenderingContext2D, size: number, color: string) {
        ctx.strokeStyle = `${color}cc`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.56, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    private drawProceduralEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyView, size: number) {
        const color = enemy.color || '#64d2ff';
        const radius = size * 0.34;
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, 0, 0, 0, radius * 1.4);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.24, color);
        gradient.addColorStop(1, 'rgba(255,255,255,0.08)');
        ctx.fillStyle = gradient;
        ctx.strokeStyle = enemy.elite ? '#ffffff' : 'rgba(255,255,255,0.28)';
        ctx.lineWidth = enemy.elite ? 2.5 : 1.2;
        ctx.beginPath();
        const points = enemy.boss ? 9 : enemy.type === 'static' ? 6 : 7;
        for (let index = 0; index < points; index += 1) {
            const angle = -Math.PI / 2 + (Math.PI * 2 * index) / points;
            const jitter = index % 2 ? 0.74 : 1;
            const px = Math.cos(angle) * radius * jitter;
            const py = Math.sin(angle) * radius * jitter;
            if (index === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    private drawEnemyHp(ctx: CanvasRenderingContext2D, enemy: EnemyView, size: number) {
        if (enemy.maxHp <= 1 && !enemy.shield) return;
        const width = Math.max(46, size * 0.72);
        const ratio = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
        ctx.fillStyle = 'rgba(6,8,12,0.72)';
        ctx.fillRect(-width / 2, -size * 0.48, width, 5);
        ctx.fillStyle = enemy.shield ? '#7ee198' : (enemy.color || '#64d2ff');
        ctx.fillRect(-width / 2, -size * 0.48, width * ratio, 5);
    }

    private drawWordPlate(ctx: CanvasRenderingContext2D, enemy: EnemyView, size: number) {
        const y = size * 0.5;
        ctx.font = `${enemy.boss ? 18 : 15}px "SF Pro Text", Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(enemy.word).width;
        const width = Math.max(58, textWidth + 28);
        ctx.fillStyle = 'rgba(6,8,12,0.78)';
        ctx.strokeStyle = enemy.isTarget ? `${enemy.color || '#64d2ff'}cc` : 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-width / 2, y - 16, width, 32, 8);
        ctx.fill();
        ctx.stroke();

        const typed = enemy.typed || '';
        const remaining = enemy.word.slice(typed.length);
        const typedWidth = ctx.measureText(typed).width;
        const remainingWidth = ctx.measureText(remaining).width;
        const start = -(typedWidth + remainingWidth) / 2;
        ctx.fillStyle = enemy.color || '#64d2ff';
        ctx.fillText(typed, start + typedWidth / 2, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(remaining, start + typedWidth + remainingWidth / 2, y);
    }

    private drawFallbackStatus(ctx: CanvasRenderingContext2D, snapshot: any) {
        if (this.assets?.ready) return;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.54)';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText(`TypeRift asset fallback active · ${snapshot?.area?.name || ''}`, 18, this.camera.height - 22);
        ctx.restore();
    }
}
