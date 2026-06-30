import { arenaBottom, arenaTop } from '../camera';
import { clamp } from './math';
import type { RenderContext, SnapshotView } from './types';

export function drawArenaGrid(ctx: CanvasRenderingContext2D, snapshot: SnapshotView, render: RenderContext) {
    const { width } = render.camera;
    const top = arenaTop(render.camera);
    const bottom = arenaBottom(render.camera);
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

