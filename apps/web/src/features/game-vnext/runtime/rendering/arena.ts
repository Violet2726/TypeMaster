import { arenaBottom, arenaTop } from '../camera';
import { clamp } from './math';
import type { RenderContext, SnapshotView } from './types';

export function drawArenaGrid(ctx: CanvasRenderingContext2D, snapshot: SnapshotView, render: RenderContext) {
    const { width } = render.camera;
    const top = arenaTop(render.camera);
    const bottom = arenaBottom(render.camera);
    const heat = clamp((snapshot?.hud?.heat || 0) / 100, 0, 1);
    const energy = clamp((snapshot?.hud?.energy || 0) / 100, 0, 1);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    ctx.lineWidth = 1;
    for (let index = 1; index < 8; index += 1) {
        const x = (width / 8) * index;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
    }
    const lineGlow = ctx.createLinearGradient(0, bottom - 18, 0, bottom + 18);
    lineGlow.addColorStop(0, 'rgba(255,255,255,0)');
    lineGlow.addColorStop(0.5, `rgba(255,69,58,${0.16 + heat * 0.22})`);
    lineGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lineGlow;
    ctx.fillRect(0, bottom - 18, width, 36);

    ctx.strokeStyle = `rgba(255,69,58,${0.28 + heat * 0.34})`;
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    ctx.lineTo(width, bottom);
    ctx.stroke();

    if (energy > 0) {
        ctx.strokeStyle = `rgba(100,210,255,${0.12 + energy * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(width * 0.5 - width * 0.24 * energy, bottom - 10);
        ctx.lineTo(width * 0.5 + width * 0.24 * energy, bottom - 10);
        ctx.stroke();
    }
    ctx.restore();
}
