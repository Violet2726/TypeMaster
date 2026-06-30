import { getAssetImage } from '../asset-loader';
import type { RenderContext, SnapshotView } from './types';

export function drawBackground(ctx: CanvasRenderingContext2D, snapshot: SnapshotView, render: RenderContext) {
    const { width, height } = render.camera;
    const area = snapshot?.area;
    const bg = snapshot?.phase !== 'idle' && area?.id ? getAssetImage(render.assets, 'backgrounds', area.id) : null;
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
