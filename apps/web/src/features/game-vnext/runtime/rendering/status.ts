import type { RenderContext, SnapshotView } from './types';

export function drawFallbackStatus(ctx: CanvasRenderingContext2D, snapshot: SnapshotView, render: RenderContext) {
    if (render.assets?.ready) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.54)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText(`TypeRift resource fallback / ${snapshot?.area?.nameZh || snapshot?.area?.name || ''}`, 18, render.camera.height - 22);
    ctx.restore();
}

