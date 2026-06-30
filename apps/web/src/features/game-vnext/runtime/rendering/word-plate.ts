import type { EnemyView } from './types';

export function drawWordPlate(ctx: CanvasRenderingContext2D, enemy: EnemyView, size: number) {
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

