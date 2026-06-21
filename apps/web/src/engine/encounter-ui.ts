/**
 * Encounter UI - 商店/休息/事件界面
 *
 * 当玩家在关卡地图上选择非战斗节点时，显示对应的交互界面。
 * 设计风格：Apple 毛玻璃卡片 + 清晰的信息层级。
 */

import { NODE_TYPES, UPGRADE_DEFS, EVENTS, getShopOffers, purchaseUpgrade, restAction, processEvent } from "@typemaster/domain";
import { drawGlassPanel } from "../components/game/draw-helpers";
import { COLORS } from "../components/game/colors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EncounterType = "shop" | "rest" | "event" | null;

export interface EncounterState {
  type: EncounterType;
  run: any;
  selectedIndex: number;
  offers: any[];         // shop offers
  event: any;            // event definition
  animTime: number;
  result: string | null; // feedback message
  resultTimer: number;
}

// ---------------------------------------------------------------------------
// Create encounter state
// ---------------------------------------------------------------------------

export function createEncounterState(type, run) {
  let offers = [];
  let event = null;
  if (type === "shop") {
    offers = getShopOffers(run);
  }
  if (type === "event") {
    event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  }
  return {
    type, run, selectedIndex: 0, offers, event,
    animTime: 0, result: null, resultTimer: 0,
  };
}

// ---------------------------------------------------------------------------
// Render shop
// ---------------------------------------------------------------------------

function renderShop(ctx, w, h, state, time) {
  const { run, offers, selectedIndex, result, resultTimer } = state;

  // Title
  ctx.save();
  ctx.font = "700 22px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#ffd60a";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("\uD83D\uDED2  \u5546\u5E97", w / 2, 28);
  ctx.font = "400 13px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("\u91D1\u5E01: " + run.coins, w / 2, 58);
  ctx.restore();

  // Cards
  const cardW = Math.min(180, (w - 80) / Math.max(1, offers.length) - 12);
  const cardH = 180;
  const startX = (w - (cardW + 12) * offers.length + 12) / 2;
  const cardY = 100;

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const x = startX + i * (cardW + 12);
    const isSelected = i === selectedIndex;
    const canAfford = run.coins >= offer.cost;

    // Card background
    const alpha = canAfford ? (isSelected ? 0.25 : 0.12) : 0.05;
    drawGlassPanel(ctx, x, cardY, cardW, cardH, 12);
    ctx.fillStyle = isSelected ? offer.color + "20" : "rgba(255,255,255,0.03)";
    ctx.fillRect(x, cardY, cardW, cardH);

    if (isSelected) {
      ctx.strokeStyle = offer.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, cardY + 1, cardW - 2, cardH - 2);
    }

    // Icon
    ctx.save();
    ctx.font = "32px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(offer.icon, x + cardW / 2, cardY + 40);

    // Name
    ctx.font = "600 14px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = canAfford ? "#ffffff" : "rgba(255,255,255,0.3)";
    ctx.fillText(offer.nameZh, x + cardW / 2, cardY + 75);

    // Description
    ctx.font = "400 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = canAfford ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)";
    // Word wrap description
    const desc = offer.description;
    const maxW = cardW - 20;
    let line = "";
    let lineY = cardY + 100;
    for (const ch of desc) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x + cardW / 2, lineY);
        line = ch;
        lineY += 14;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x + cardW / 2, lineY);

    // Cost
    ctx.font = "700 16px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = canAfford ? "#ffd60a" : "rgba(255,214,10,0.3)";
    ctx.fillText("\uD83E\uDE99 " + offer.cost, x + cardW / 2, cardY + cardH - 28);

    // Stack indicator
    if (offer.currentStacks > 0) {
      ctx.font = "500 10px -apple-system, SF Pro Text, system-ui, sans-serif";
      ctx.fillStyle = offer.color;
      ctx.fillText("x" + offer.currentStacks, x + cardW - 16, cardY + 16);
    }

    ctx.restore();
  }

  // Result feedback
  if (result && resultTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, resultTimer);
    ctx.font = "600 16px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = result.includes("\u6210\u529F") ? "#34c759" : "#ff453a";
    ctx.textAlign = "center";
    ctx.fillText(result, w / 2, h - 80);
    ctx.restore();
  }

  // Hint
  ctx.save();
  ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("\u2190 \u2192 \u9009\u62E9  Enter \u8D2D\u4E70  Esc \u79BB\u5F00", w / 2, h - 24);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Render rest
// ---------------------------------------------------------------------------

function renderRest(ctx, w, h, state, time) {
  const { run, selectedIndex } = state;
  const choices = [
    { icon: "\u2764", label: "\u6062\u590D\u751F\u547D", desc: "\u6062\u590D 30% \u6700\u5927\u751F\u547D", color: "#ff453a" },
    { icon: "\u2728", label: "\u5F3A\u5316\u5347\u7EA7", desc: "\u968F\u673A\u5F3A\u5316\u4E00\u4E2A\u53EF\u5806\u53E0\u5347\u7EA7", color: "#bf5af2" },
  ];

  ctx.save();
  ctx.font = "700 22px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#34c759";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("\uD83C\uDFD5  \u4F11\u606F\u7AD9", w / 2, 28);
  ctx.font = "400 13px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("\u751F\u547D: " + run.lives + " / " + run.maxLives, w / 2, 58);
  ctx.restore();

  const cardW = 220;
  const cardH = 140;
  const gap = 24;
  const startX = (w - cardW * 2 - gap) / 2;
  const cardY = h / 2 - cardH / 2;

  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    const x = startX + i * (cardW + gap);
    const isSelected = i === selectedIndex;

    drawGlassPanel(ctx, x, cardY, cardW, cardH, 14);
    if (isSelected) {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, cardY + 1, cardW - 2, cardH - 2);
    }

    ctx.save();
    ctx.font = "40px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.icon, x + cardW / 2, cardY + 45);

    ctx.font = "600 16px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(c.label, x + cardW / 2, cardY + 85);

    ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(c.desc, x + cardW / 2, cardY + 110);
    ctx.restore();
  }

  ctx.save();
  ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("\u2190 \u2192 \u9009\u62E9  Enter \u786E\u8BA4", w / 2, h - 24);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Render event
// ---------------------------------------------------------------------------

function renderEvent(ctx, w, h, state, time) {
  const { event, selectedIndex, result, resultTimer } = state;
  if (!event) return;

  ctx.save();
  ctx.font = "700 22px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#bf5af2";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("\u2753  " + event.nameZh, w / 2, 28);
  ctx.restore();

  // Description
  ctx.save();
  ctx.font = "400 15px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText(event.description, w / 2, 75);
  ctx.restore();

  // Choice cards
  const choices = event.choices;
  const cardW = 240;
  const cardH = 130;
  const gap = 24;
  const startX = (w - cardW * choices.length - gap * (choices.length - 1)) / 2;
  const cardY = h / 2 - cardH / 2;

  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    const x = startX + i * (cardW + gap);
    const isSelected = i === selectedIndex;
    const color = i === 0 ? "#34c759" : "#ff9f0a";

    drawGlassPanel(ctx, x, cardY, cardW, cardH, 14);
    if (isSelected) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, cardY + 1, cardW - 2, cardH - 2);
    }

    ctx.save();
    ctx.font = "600 15px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(c.labelZh, x + cardW / 2, cardY + 40);

    ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(c.description, x + cardW / 2, cardY + 70);
    ctx.restore();
  }

  // Result feedback
  if (result && resultTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, resultTimer);
    ctx.font = "600 16px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = "#34c759";
    ctx.textAlign = "center";
    ctx.fillText(result, w / 2, h - 80);
    ctx.restore();
  }

  ctx.save();
  ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.fillText("\u2190 \u2192 \u9009\u62E9  Enter \u786E\u8BA4", w / 2, h - 24);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------

export function renderEncounter(ctx, w, h, state, time) {
  if (!state || !state.type) return;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#0a0e1a");
  bgGrad.addColorStop(1, "#111827");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  switch (state.type) {
    case "shop": renderShop(ctx, w, h, state, time); break;
    case "rest": renderRest(ctx, w, h, state, time); break;
    case "event": renderEvent(ctx, w, h, state, time); break;
  }
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

export function handleEncounterKey(key, state) {
  if (!state || !state.type) return { ...state, action: null };

  let newSel = state.selectedIndex;
  let maxSel = 0;

  if (state.type === "shop") maxSel = state.offers.length - 1;
  if (state.type === "rest") maxSel = 1;
  if (state.type === "event") maxSel = state.event ? state.event.choices.length - 1 : 0;

  if (key === "ArrowLeft" || key === "a") {
    newSel = Math.max(0, state.selectedIndex - 1);
  } else if (key === "ArrowRight" || key === "d") {
    newSel = Math.min(maxSel, state.selectedIndex + 1);
  } else if (key === "Enter" || key === " ") {
    return handleEncounterSelect(state);
  } else if (key === "Escape") {
    if (state.type === "shop") return { ...state, action: "leave" };
  }

  return { ...state, selectedIndex: newSel, action: null };
}

function handleEncounterSelect(state) {
  if (state.type === "shop") {
    const offer = state.offers[state.selectedIndex];
    if (!offer) return { ...state, action: null };
    const result = purchaseUpgrade(state.run, offer.id);
    if (result.success) {
      return { ...state, run: result.run, action: "purchased", result: "\u8D2D\u4E70\u6210\u529F: " + offer.nameZh, resultTimer: 1.5 };
    } else {
      const msg = result.reason === "insufficient_coins" ? "\u91D1\u5E01\u4E0D\u8DB3" : "\u5DF2\u8FBE\u4E0A\u9650";
      return { ...state, result: msg, resultTimer: 1.5 };
    }
  }
  if (state.type === "rest") {
    const choice = state.selectedIndex === 0 ? "heal" : "upgrade";
    const newRun = restAction(state.run, choice);
    const msg = choice === "heal" ? "\u751F\u547D\u5DF2\u6062\u590D" : "\u5347\u7EA7\u5DF2\u5F3A\u5316";
    return { ...state, run: newRun, action: "rested", result: msg, resultTimer: 1.5 };
  }
  if (state.type === "event") {
    const newRun = processEvent(state.run, state.event, state.selectedIndex);
    return { ...state, run: newRun, action: "event_done", result: "\u4E8B\u4EF6\u5B8C\u6210", resultTimer: 1.5 };
  }
  return { ...state, action: null };
}