/**
 * Boss Intro - Boss战前的紧张开场
 *
 * 全屏黑底，Boss名称从远处飞入，HP条缓慢填充。
 * 持续约3秒后自动消失，开始战斗。
 */

import { drawGlassPanel } from "../components/game/draw-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BossIntroState {
  bossName: string;
  bossHp: number;
  actName: string;
  startTime: number;
  duration: number; // ms
  active: boolean;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function createBossIntro(bossName, bossHp, actName) {
  return {
    bossName, bossHp, actName, startTime: performance.now(), duration: 3000, active: true,
  };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function updateBossIntro(state) {
  if (!state || !state.active) return state;
  const elapsed = performance.now() - state.startTime;
  if (elapsed >= state.duration) { return { ...state, active: false }; }
  return state;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderBossIntro(ctx, w, h, state, time) {
  if (!state || !state.active) return;

  const elapsed = time - state.startTime;
  const progress = Math.min(1, elapsed / state.duration);

  // Dark overlay with fade-in
  const overlayAlpha = Math.min(0.85, progress * 2);
  ctx.fillStyle = "rgba(0,0,0," + overlayAlpha + ")";
  ctx.fillRect(0, 0, w, h);

  // Red accent lines
  const lineProgress = Math.min(1, progress * 1.5);
  ctx.save();
  ctx.strokeStyle = "rgba(255,69,58,0.4)";
  ctx.lineWidth = 2;
  const lineY = h / 2 - 40;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, lineY);
  ctx.lineTo(w * 0.1 + (w * 0.8) * lineProgress, lineY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.9, lineY + 80);
  ctx.lineTo(w * 0.9 - (w * 0.8) * lineProgress, lineY + 80);
  ctx.stroke();
  ctx.restore();

  // Boss name - scale in from large
  const nameProgress = Math.max(0, Math.min(1, (progress - 0.1) * 2));
  const nameScale = 1 + (1 - nameProgress) * 0.5;
  const nameAlpha = nameProgress;
  ctx.save();
  ctx.globalAlpha = nameAlpha;
  ctx.translate(w / 2, h / 2);
  ctx.scale(nameScale, nameScale);
  ctx.font = "700 36px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#ff453a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.bossName, 0, -10);
  ctx.restore();

  // Act name subtitle
  const subProgress = Math.max(0, Math.min(1, (progress - 0.3) * 2));
  ctx.save();
  ctx.globalAlpha = subProgress * 0.6;
  ctx.font = "400 14px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(state.actName, w / 2, h / 2 + 30);
  ctx.restore();

  // HP bar
  const hpProgress = Math.max(0, Math.min(1, (progress - 0.4) * 2));
  if (hpProgress > 0) {
    const barW = 200;
    const barH = 6;
    const barX = (w - barW) / 2;
    const barY = h / 2 + 55;
    ctx.save();
    ctx.globalAlpha = hpProgress * 0.8;
    // Background
    drawGlassPanel(ctx, barX, barY, barW, barH, 3);
    // Fill
    ctx.fillStyle = "#ff453a";
    ctx.fillRect(barX, barY, barW * hpProgress, barH);
    // HP text
    ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText("HP " + state.bossHp, w / 2, barY + 20);
    ctx.restore();
  }

  // Warning flash at start
  if (progress < 0.15) {
    ctx.save();
    ctx.globalAlpha = (1 - progress / 0.15) * 0.3;
    ctx.fillStyle = "#ff453a";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Is active
// ---------------------------------------------------------------------------

export function isBossIntroActive(state) {
  return state && state.active;
}