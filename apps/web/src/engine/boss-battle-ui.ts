/**
 * Boss Battle Visual
 */

export function renderBossBattleUI(
    ctx: CanvasRenderingContext2D,
    w: number, h: number, bossState: any, time: number,
): void {
    if (!bossState) return;
    const phaseConfig = bossState._phaseConfig;
    if (!phaseConfig) return;

    // Phase transition
    if (bossState.phaseTransitioning) {
        const progress = 1 - (bossState.phaseTransitionTimer / 1.5);
        const alpha = progress < 0.5 ? progress * 2 : 2 - progress * 2;
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.translate(w / 2, h / 2 - 60);
        ctx.scale(1.2, 1.2);
        ctx.font = "700 28px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = phaseConfig.color;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = phaseConfig.color; ctx.shadowBlur = 20;
        ctx.fillText(phaseConfig.nameZh, 0, 0);
        ctx.font = "400 13px -apple-system";
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.shadowBlur = 0;
        ctx.fillText(phaseConfig.descriptionZh, 0, 30);
        ctx.restore();
    }

    // Shield indicator
    if (bossState.shieldHp > 0) {
        const sx = 20, sy = h - 70;
        ctx.save(); ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            const px = sx + Math.cos(a) * 12, py = sy + Math.sin(a) * 12;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fillStyle = "rgba(245,158,11,0.3)"; ctx.fill();
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 1.5; ctx.stroke();
        for (let i = 0; i < bossState.shieldMaxHp; i++) {
            ctx.beginPath(); ctx.arc(sx+18+i*10, sy, 3, 0, Math.PI*2);
            i < bossState.shieldHp ? (ctx.fillStyle="#f59e0b", ctx.fill()) : (ctx.strokeStyle="rgba(245,158,11,0.3)", ctx.lineWidth=1, ctx.stroke());
        }
        ctx.font = "500 9px -apple-system"; ctx.fillStyle = "rgba(245,158,11,0.8)";
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText("SHIELD", sx, sy + 14); ctx.restore();
    }

    // Weak point indicator
    if (bossState.weakPointActive) {
        const wpP = bossState.weakPointTimer / (phaseConfig.weakPointDuration || 3.0);
        ctx.save(); ctx.fillStyle = "rgba(239,68,68,0.2)";
        ctx.beginPath(); ctx.roundRect(w/2-30, 30, 60, 3, 1.5); ctx.fill();
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.roundRect(w/2-30, 30, 60*wpP, 3, 1.5); ctx.fill();
        ctx.font = "600 10px -apple-system"; ctx.fillStyle = "#ef4444";
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText("WEAK POINT x3", w/2, 27); ctx.restore();
    }

    // Counter warning
    if (phaseConfig.counterInterval > 0 && bossState.counterTimer < 1.5) {
        const urg = 1 - bossState.counterTimer / 1.5;
        ctx.save(); ctx.globalAlpha = urg * 0.8; ctx.fillStyle = "#ef4444";
        ctx.font = "700 11px -apple-system"; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText("! COUNTER INCOMING !", w/2, h - 25); ctx.restore();
    }
}