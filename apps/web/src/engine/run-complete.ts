/**
 * Run Complete Screen - 跑局胜利/失败结算界面
 *
 * 当玩家打通3幕或生命耗尽时显示。
 * 展示跑局统计、升级组合、评分等级。
 */

import { NODE_TYPES, UPGRADE_DEFS, getRunStats } from "@typemaster/domain";
import { drawGlassPanel } from "../components/game/draw-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunCompleteState {
  run: any;
  victory: boolean;
  animTime: number;
  rating: string;
  ratingColor: string;
}

// ---------------------------------------------------------------------------
// Rating calculation
// ---------------------------------------------------------------------------

function calculateRunRating(run) {
  const stats = getRunStats(run);
  const actScore = stats.currentAct * 33;
  const killBonus = Math.min(20, stats.totalKills * 0.5);
  const upgradeBonus = Math.min(15, stats.upgradeCount * 5);
  const coinBonus = Math.min(10, stats.coins * 0.05);
  const total = actScore + killBonus + upgradeBonus + coinBonus;

  if (total >= 90) return { rating: "S", color: "#ffd700" };
  if (total >= 70) return { rating: "A", color: "#32d74b" };
  if (total >= 50) return { rating: "B", color: "#0a84ff" };
  if (total >= 30) return { rating: "C", color: "#ff9f0a" };
  return { rating: "D", color: "#ff453a" };
}

// ---------------------------------------------------------------------------
// Create state
// ---------------------------------------------------------------------------

export function createRunCompleteState(run, victory) {
  const { rating, color } = calculateRunRating(run);
  return {
    run, victory, animTime: 0, rating, ratingColor: color,
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderRunComplete(ctx, w, h, state, time) {
  const { run, victory, rating, ratingColor } = state;
  const stats = getRunStats(run);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (victory) {
    bgGrad.addColorStop(0, "#0a1a0a");
    bgGrad.addColorStop(1, "#0a200a");
  } else {
    bgGrad.addColorStop(0, "#1a0a0a");
    bgGrad.addColorStop(1, "#200a0a");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.save();
  ctx.font = "700 28px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = victory ? "#34c759" : "#ff453a";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(victory ? "\u8DD1\u5C40\u80DC\u5229" : "\u8DD1\u5C40\u7ED3\u675F", w / 2, 28);
  ctx.restore();

  // Rating badge
  const badgeR = 40;
  const badgeY = 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, badgeY + badgeR, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = ratingColor + "20";
  ctx.fill();
  ctx.strokeStyle = ratingColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = "700 36px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = ratingColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rating, w / 2, badgeY + badgeR);
  ctx.restore();

  // Stats cards
  const cardW = 160;
  const cardH = 60;
  const gap = 16;
  const statsData = [
    { label: "\u5F53\u524D\u5E55", value: stats.currentAct + " / " + stats.totalActs, color: "#0a84ff" },
    { label: "\u5F97\u5206", value: String(stats.totalScore), color: "#ffd60a" },
    { label: "\u51FB\u6740", value: String(stats.totalKills), color: "#ff9f0a" },
    { label: "\u91D1\u5E01", value: String(stats.coins), color: "#ffd60a" },
    { label: "\u5347\u7EA7", value: String(stats.upgradeCount), color: "#bf5af2" },
    { label: "\u751F\u547D", value: stats.lives + " / " + stats.maxLives, color: "#ff453a" },
  ];
  const cols = 3;
  const rows = 2;
  const totalW = cols * cardW + (cols - 1) * gap;
  const startX = (w - totalW) / 2;
  const startY = 180;

  for (let i = 0; i < statsData.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    const s = statsData[i];

    drawGlassPanel(ctx, x, y, cardW, cardH, 10);
    ctx.save();
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(s.label, x + cardW / 2, y + 18);
    ctx.font = "700 20px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, x + cardW / 2, y + 42);
    ctx.restore();
  }

  // Upgrades collected
  if (run.upgrades.length > 0) {
    const upgY = startY + rows * (cardH + gap) + 16;
    ctx.save();
    ctx.font = "600 14px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.fillText("\u5347\u7EA7\u7EC4\u5408", w / 2, upgY);
    ctx.restore();

    let ux = w / 2 - run.upgrades.length * 24;
    ctx.save();
    ctx.font = "20px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const u of run.upgrades) {
      const def = UPGRADE_DEFS.find(d => d.id === u.id);
      if (!def) continue;
      ctx.fillStyle = def.color;
      ctx.fillText(def.icon, ux, upgY + 28);
      if (u.stacks > 1) {
        ctx.font = "500 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillText("x" + u.stacks, ux + 12, upgY + 38);
        ctx.font = "20px -apple-system, system-ui, sans-serif";
      }
      ux += 48;
    }
    ctx.restore();
  }

  // Actions
  ctx.save();
  ctx.font = "400 13px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "center";
  ctx.fillText("\u6309 Enter \u518D\u6765\u4E00\u5C40  Esc \u8FD4\u56DE\u4E3B\u83DC\u5355", w / 2, h - 32);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export function handleRunCompleteKey(key) {
  if (key === "Enter" || key === " ") return "restart";
  if (key === "Escape") return "menu";
  return null;
}