/**
 * Run History - 跑局历史记录系统
 *
 * 持久化跑局结果，展示最佳成绩和历史趋势。
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunRecord {
  id: string;
  date: string;
  victory: boolean;
  finalAct: number;
  totalActs: number;
  score: number;
  kills: number;
  coins: number;
  upgrades: string[];
  lives: number;
  maxLives: number;
  duration: number; // ms
  rating: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = "typing-raid-run-history";
const MAX_RECORDS = 20;

export function saveRunRecord(record: RunRecord): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records: RunRecord[] = raw ? JSON.parse(raw) : [];
    records.unshift(record);
    if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function loadRunHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {}
  return [];
}

export function getBestRun(): RunRecord | null {
  const history = loadRunHistory();
  if (history.length === 0) return null;
  return history.reduce((best, r) => r.score > best.score ? r : best);
}

export function getRunStats(): {
  totalRuns: number;
  victories: number;
  bestScore: number;
  bestRating: string;
  avgScore: number;
  totalKills: number;
} {
  const history = loadRunHistory();
  if (history.length === 0) {
    return { totalRuns: 0, victories: 0, bestScore: 0, bestRating: "D", avgScore: 0, totalKills: 0 };
  }
  const victories = history.filter(r => r.victory).length;
  const bestScore = Math.max(...history.map(r => r.score));
  const ratingOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  const bestRating = history.reduce((best, r) => {
    const bVal = (ratingOrder as any)[best] || 0;
    const rVal = (ratingOrder as any)[r.rating] || 0;
    return rVal > bVal ? r.rating : best;
  }, "D");
  const avgScore = Math.round(history.reduce((sum, r) => sum + r.score, 0) / history.length);
  const totalKills = history.reduce((sum, r) => sum + r.kills, 0);
  return { totalRuns: history.length, victories, bestScore, bestRating, avgScore, totalKills };
}

// ---------------------------------------------------------------------------
// Create record from run state
// ---------------------------------------------------------------------------

export function createRunRecord(run: any, rating: string, duration: number): RunRecord {
  return {
    id: "run-" + Date.now().toString(36),
    date: new Date().toISOString(),
    victory: run.victory || false,
    finalAct: run.currentAct + 1,
    totalActs: run.acts.length,
    score: run.totalScore,
    kills: run.totalKills,
    coins: run.coins,
    upgrades: run.upgrades.map((u: any) => u.id),
    lives: run.lives,
    maxLives: run.maxLives,
    duration,
    rating,
  };
}

// ---------------------------------------------------------------------------
// Render history panel
// ---------------------------------------------------------------------------

import { drawGlassPanel } from "../components/game/draw-helpers";
import { UPGRADE_DEFS } from "@typemaster/domain";

export function renderRunHistory(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  const history = loadRunHistory();
  const stats = getRunStats();

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#0a0e1a");
  bgGrad.addColorStop(1, "#111827");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.save();
  ctx.font = "700 24px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("\uD83D\uDCCA  \u8DD1\u5C40\u5386\u53F2", w / 2, 20);
  ctx.restore();

  // Stats cards
  const cardW = 120;
  const cardH = 50;
  const gap = 12;
  const statsData = [
    { label: "\u603B\u5C40\u6570", value: String(stats.totalRuns), color: "#0a84ff" },
    { label: "\u80DC\u5229", value: String(stats.victories), color: "#34c759" },
    { label: "\u6700\u9AD8\u5206", value: String(stats.bestScore), color: "#ffd60a" },
    { label: "\u6700\u4F73\u8BC4\u7EA7", value: stats.bestRating, color: "#ff9f0a" },
  ];
  const startX = (w - (cardW + gap) * statsData.length + gap) / 2;
  for (let i = 0; i < statsData.length; i++) {
    const x = startX + i * (cardW + gap);
    const s = statsData[i];
    drawGlassPanel(ctx, x, 60, cardW, cardH, 8);
    ctx.save();
    ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(s.label, x + cardW / 2, 68);
    ctx.font = "700 18px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, x + cardW / 2, 88);
    ctx.restore();
  }

  // History list
  const listY = 130;
  const rowH = 44;
  const maxShow = Math.min(history.length, Math.floor((h - listY - 40) / rowH));

  for (let i = 0; i < maxShow; i++) {
    const r = history[i];
    const y = listY + i * rowH;
    const isHover = false;

    drawGlassPanel(ctx, 16, y, w - 32, rowH - 4, 8);

    ctx.save();
    // Rating badge
    const ratingColors: Record<string, string> = { S: "#ffd700", A: "#32d74b", B: "#0a84ff", C: "#ff9f0a", D: "#ff453a" };
    ctx.font = "700 16px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = ratingColors[r.rating] || "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(r.rating, 28, y + rowH / 2 - 2);

    // Score
    ctx.font = "600 14px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(r.score), 60, y + rowH / 2 - 2);

    // Act progress
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("\u5E55 " + r.finalAct + "/" + r.totalActs, 140, y + rowH / 2 - 2);

    // Kills
    ctx.fillText("\u2694 " + r.kills, 200, y + rowH / 2 - 2);

    // Upgrades
    let ux = 260;
    ctx.font = "14px -apple-system, system-ui, sans-serif";
    for (const uid of r.upgrades.slice(0, 5)) {
      const def = UPGRADE_DEFS.find((d: any) => d.id === uid);
      if (def) {
        ctx.fillStyle = def.color + "aa";
        ctx.fillText(def.icon, ux, y + rowH / 2 - 2);
        ux += 20;
      }
    }

    // Victory badge
    if (r.victory) {
      ctx.fillStyle = "#34c759";
      ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("\u2713 \u80DC\u5229", w - 28, y + rowH / 2 - 2);
    }

    // Date
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.textAlign = "right";
    const d = new Date(r.date);
    ctx.fillText((d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"), w - 28, y + rowH / 2 + 10);

    ctx.restore();
  }

  if (history.length === 0) {
    ctx.save();
    ctx.font = "400 14px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("\u6682\u65E0\u8DD1\u5C40\u8BB0\u5F55", w / 2, h / 2);
    ctx.restore();
  }

  // Hint
  ctx.save();
  ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("Esc \u8FD4\u56DE", w / 2, h - 24);
  ctx.restore();
}