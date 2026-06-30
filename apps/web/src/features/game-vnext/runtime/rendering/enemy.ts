import { getAssetImage } from '../asset-loader';
import { mapArenaY } from '../camera';
import { clamp } from './math';
import type { EnemyView, RenderContext } from './types';
import { drawWordPlate } from './word-plate';

function drawTargetRing(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.strokeStyle = `${color}cc`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawProceduralEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyView, size: number) {
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

function drawEnemyHp(ctx: CanvasRenderingContext2D, enemy: EnemyView, size: number) {
    if (enemy.maxHp <= 1 && !enemy.shield) return;
    const width = Math.max(46, size * 0.72);
    const ratio = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
    ctx.fillStyle = 'rgba(6,8,12,0.72)';
    ctx.fillRect(-width / 2, -size * 0.48, width, 5);
    ctx.fillStyle = enemy.shield ? '#7ee198' : (enemy.color || '#64d2ff');
    ctx.fillRect(-width / 2, -size * 0.48, width * ratio, 5);
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyView, render: RenderContext) {
    const size = enemy.boss ? 118 : enemy.elite ? 74 : 56;
    const x = clamp(enemy.xRatio * render.camera.width, size * 0.72, render.camera.width - size * 0.72);
    const y = mapArenaY(render.camera, enemy.y);
    const image = enemy.boss
        ? getAssetImage(render.assets, 'bosses', enemy.bossId || enemy.archetype || enemy.type)
        : getAssetImage(render.assets, 'enemies', enemy.archetype || enemy.type);

    ctx.save();
    ctx.translate(x, y);
    if (enemy.isTarget) drawTargetRing(ctx, size, enemy.color || '#64d2ff');
    if (image) ctx.drawImage(image, -size / 2, -size / 2, size, size);
    else drawProceduralEnemy(ctx, enemy, size);
    drawEnemyHp(ctx, enemy, size);
    drawWordPlate(ctx, enemy, size);
    ctx.restore();
}

