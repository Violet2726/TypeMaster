/**
 * Meta Progression - 跨局永久解锁系统
 *
 * 每次跑局获得经验值，解锁永久升级。
 * 升级分为3类: 生存/战斗/经济。
 */

// ---------------------------------------------------------------------------
// Meta upgrades
// ---------------------------------------------------------------------------

export const META_UPGRADES = [
  { id: "meta_extra_life", nameZh: "生命强化", description: "初始最大生命+1", icon: "\u2764", color: "#ff453a", xpCost: 200, category: "survival", maxLevel: 3, effect: { type: "maxLives", value: 1 } },
  { id: "meta_starting_coins", nameZh: "初始金币", description: "每局开始获得50金币", icon: "\uD83E\uDE99", color: "#ffd60a", xpCost: 150, category: "economy", maxLevel: 3, effect: { type: "startingCoins", value: 50 } },
  { id: "meta_coin_bonus", nameZh: "金币加成", description: "击杀金币+20%", icon: "\uD83D\uDCB0", color: "#ffd60a", xpCost: 250, category: "economy", maxLevel: 3, effect: { type: "coinMultiplier", value: 0.2 } },
  { id: "meta_damage_bonus", nameZh: "伤害加成", description: "Boss战额外伤害", icon: "\u2694", color: "#ff9f0a", xpCost: 300, category: "combat", maxLevel: 2, effect: { type: "bossDamage", value: 1 } },
  { id: "meta_shop_discount", nameZh: "商店折扣", description: "商店价格-15%", icon: "\uD83E\uDDFE", color: "#34c759", xpCost: 200, category: "economy", maxLevel: 2, effect: { type: "shopDiscount", value: 0.15 } },
  { id: "meta_xp_bonus", nameZh: "经验加成", description: "获得经验+25%", icon: "\u2B50", color: "#bf5af2", xpCost: 180, category: "progression", maxLevel: 3, effect: { type: "xpMultiplier", value: 0.25 } },
];

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = "typing-raid-meta";

export interface MetaState {
  totalXp: number;
  spentXp: number;
  levels: Record<string, number>; // upgradeId -> level
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalXp: 0, spentXp: 0, levels: {} };
}

export function saveMeta(meta: MetaState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {}
}

// ---------------------------------------------------------------------------
// XP calculation
// ---------------------------------------------------------------------------

export function calculateRunXp(run: any): number {
  let xp = 0;
  xp += run.totalScore * 0.1;
  xp += run.totalKills * 2;
  xp += (run.currentAct) * 20;
  if (run.victory) xp += 100;
  xp += run.upgrades.length * 5;
  return Math.round(xp);
}

export function addRunXp(run: any): { xpEarned: number; levelUps: string[] } {
  const meta = loadMeta();
  const xpEarned = calculateRunXp(run);
  meta.totalXp += xpEarned;

  // Check for level-ups
  const levelUps: string[] = [];
  const availableXp = meta.totalXp - meta.spentXp;
  for (const upgrade of META_UPGRADES) {
    const currentLevel = meta.levels[upgrade.id] || 0;
    if (currentLevel < upgrade.maxLevel) {
      const cost = upgrade.xpCost * (currentLevel + 1);
      if (availableXp >= cost) {
        // Auto-unlock
        meta.levels[upgrade.id] = currentLevel + 1;
        meta.spentXp += cost;
        levelUps.push(upgrade.nameZh);
      }
    }
  }

  saveMeta(meta);
  return { xpEarned, levelUps };
}

// ---------------------------------------------------------------------------
// Apply meta effects
// ---------------------------------------------------------------------------

export function getMetaEffects(): {
  maxLivesBonus: number;
  startingCoins: number;
  coinMultiplier: number;
  bossDamageBonus: number;
  shopDiscount: number;
  xpMultiplier: number;
} {
  const meta = loadMeta();
  let maxLivesBonus = 0;
  let startingCoins = 0;
  let coinMultiplier = 1;
  let bossDamageBonus = 0;
  let shopDiscount = 0;
  let xpMultiplier = 1;

  for (const upgrade of META_UPGRADES) {
    const level = meta.levels[upgrade.id] || 0;
    if (level === 0) continue;
    switch (upgrade.effect.type) {
      case "maxLives": maxLivesBonus += upgrade.effect.value * level; break;
      case "startingCoins": startingCoins += upgrade.effect.value * level; break;
      case "coinMultiplier": coinMultiplier += upgrade.effect.value * level; break;
      case "bossDamage": bossDamageBonus += upgrade.effect.value * level; break;
      case "shopDiscount": shopDiscount += upgrade.effect.value * level; break;
      case "xpMultiplier": xpMultiplier += upgrade.effect.value * level; break;
    }
  }

  return { maxLivesBonus, startingCoins, coinMultiplier, bossDamageBonus, shopDiscount, xpMultiplier };
}

// ---------------------------------------------------------------------------
// Render meta panel
// ---------------------------------------------------------------------------

import { drawGlassPanel } from "../components/game/draw-helpers";

export function renderMetaPanel(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  const meta = loadMeta();
  const availableXp = meta.totalXp - meta.spentXp;

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
  ctx.fillText("\u2B50  \u5143\u8FDB\u5EA6", w / 2, 28);

  // XP bar
  ctx.font = "400 13px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("\u53EF\u7528 XP: " + availableXp, w / 2, 58);
  ctx.restore();

  // Upgrade cards
  const cardW = 200;
  const cardH = 80;
  const gap = 12;
  const cols = Math.min(3, Math.floor((w - 40) / (cardW + gap)));
  const startX = (w - (cardW + gap) * cols + gap) / 2;
  const startY = 80;

  for (let i = 0; i < META_UPGRADES.length; i++) {
    const u = META_UPGRADES[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    const level = meta.levels[u.id] || 0;
    const isMaxed = level >= u.maxLevel;
    const cost = u.xpCost * (level + 1);
    const canAfford = availableXp >= cost && !isMaxed;

    drawGlassPanel(ctx, x, y, cardW, cardH, 10);

    ctx.save();
    // Icon
    ctx.font = "24px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = u.color;
    ctx.fillText(u.icon, x + 12, y + 35);

    // Name
    ctx.font = "600 13px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = canAfford ? "#ffffff" : "rgba(255,255,255,0.5)";
    ctx.fillText(u.nameZh, x + 44, y + 25);

    // Description
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(u.description, x + 44, y + 42);

    // Level dots
    for (let l = 0; l < u.maxLevel; l++) {
      ctx.fillStyle = l < level ? u.color : "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.arc(x + 44 + l * 14, y + 58, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cost or MAX
    if (isMaxed) {
      ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
      ctx.fillStyle = "#34c759";
      ctx.textAlign = "right";
      ctx.fillText("MAX", x + cardW - 12, y + 58);
    } else {
      ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
      ctx.fillStyle = canAfford ? "#ffd60a" : "rgba(255,214,10,0.3)";
      ctx.textAlign = "right";
      ctx.fillText("XP " + cost, x + cardW - 12, y + 58);
    }

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