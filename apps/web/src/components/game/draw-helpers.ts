import { COLORS } from './colors';

export function drawProgressRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    progress: number, // 0 to 1
    color: string
) {
    if (progress <= 0) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
}

export function drawGlassPanel(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number = 12,
    colors = COLORS
) {
    ctx.fillStyle = colors.glassBg;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    ctx.strokeStyle = colors.glassBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    const highlightGradient = ctx.createLinearGradient(x, y, x, y + height * 0.3);
    highlightGradient.addColorStop(0, colors.glassHighlight);
    highlightGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height * 0.3, [radius, radius, 0, 0]);
    ctx.fill();
}
