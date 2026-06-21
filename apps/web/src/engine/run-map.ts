/**
 * Run Map - Apple 风格关卡地图渲染器
 *
 * 在 Canvas 上绘制 Slay-the-Spire 风格的节点路径图。
 * 每个节点是一个可交互的选择点，玩家用键盘选择前进方向。
 */

import { NODE_TYPES, getCurrentActNodes, getAvailableChoices, getCurrentNode } from "@typemaster/domain";
import { drawGlassPanel } from "../components/game/draw-helpers";
import { COLORS } from "../components/game/colors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunMapState {
  run: any;
  selectedIndex: number;
  animTime: number;
  transitionAlpha: number;
  transitioning: boolean;
}

// ---------------------------------------------------------------------------
// Create map state
// ---------------------------------------------------------------------------

export function createRunMapState(run) {
  return {
    run,
    selectedIndex: 0,
    animTime: 0,
    transitionAlpha: 1,
    transitioning: false,
  };
}

// ---------------------------------------------------------------------------
// Node position calculation
// ---------------------------------------------------------------------------

function getNodePositions(nodes, w, h) {
  const padding = { top: 100, bottom: 80, left: 60, right: 60 };
  const mapW = w - padding.left - padding.right;
  const mapH = h - padding.top - padding.bottom;
  const maxRow = Math.max(...nodes.map(n => n.row));

  return nodes.map(n => {
    const rowRatio = maxRow > 0 ? n.row / maxRow : 0;
    const xCenter = w / 2 + n.col * 120;
    const y = padding.top + rowRatio * mapH;
    return { id: n.id, x: xCenter, y, node: n };
  });
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function renderRunMap(ctx, w, h, state, time) {
  const { run, selectedIndex } = state;
  if (!run) return;

  const nodes = getCurrentActNodes(run);
  if (nodes.length === 0) return;

  const positions = getNodePositions(nodes, w, h);
  const available = getAvailableChoices(run);
  const currentNode = getCurrentNode(run);
  const actConfig = run.acts[run.currentAct].config;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#0a0e1a");
  bgGrad.addColorStop(1, "#111827");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Act title
  ctx.save();
  ctx.font = "700 24px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(actConfig.nameZh, w / 2, 24);
  ctx.font = "400 13px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("幕 " + (run.currentAct + 1) + " / " + run.acts.length, w / 2, 56);
  ctx.restore();

  // Draw paths
  ctx.save();
  for (const pos of positions) {
    const node = pos.node;
    for (const connId of node.connections) {
      const target = positions.find(p => p.id === connId);
      if (!target) continue;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = node.completed ? "rgba(52,199,89,0.4)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = node.completed ? 2.5 : 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();

  // Draw nodes
  for (const pos of positions) {
    const node = pos.node;
    const typeDef = NODE_TYPES[node.type] || NODE_TYPES.combat;
    const isAvailable = node.available && available.some(a => a.id === node.id);
    const isCurrent = node.current;
    const isSelected = isAvailable && available.indexOf(available.find(a => a.id === node.id)) === selectedIndex;
    const isCompleted = node.completed && !isCurrent;

    const baseRadius = node.type === "boss" ? 28 : 22;
    const pulse = Math.sin(time * 0.003 + pos.x * 0.01) * 0.15 + 1;
    const radius = isAvailable ? baseRadius * pulse : baseRadius;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Glow for available/selected nodes
    if (isAvailable || isSelected) {
      const glowRadius = radius + (isSelected ? 16 : 10);
      const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, glowRadius);
      glowGrad.addColorStop(0, isSelected ? typeDef.color + "80" : typeDef.color + "30");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (isCompleted) {
      ctx.fillStyle = "rgba(52,199,89,0.15)";
      ctx.strokeStyle = "rgba(52,199,89,0.5)";
    } else if (isAvailable) {
      ctx.fillStyle = typeDef.color + "20";
      ctx.strokeStyle = typeDef.color;
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
    }
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = (node.type === "boss" ? "20" : "16") + "px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isCompleted ? "#34c759" : isAvailable ? "#ffffff" : "rgba(255,255,255,0.3)";
    ctx.fillText(isCompleted ? "\u2713" : typeDef.icon, 0, 0);

    // Label below
    ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = isAvailable ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)";
    ctx.fillText(typeDef.nameZh, 0, radius + 14);

    ctx.restore();
  }

  // Bottom: HUD with run info
  drawRunHud(ctx, w, h, run, time);

  // Selection hint
  if (available.length > 0) {
    const sel = available[selectedIndex];
    if (sel) {
      const typeDef = NODE_TYPES[sel.type] || NODE_TYPES.combat;
      ctx.save();
      ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(typeDef.description || typeDef.nameZh, w / 2, h - 16);
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------------------
// Run HUD
// ---------------------------------------------------------------------------

function drawRunHud(ctx, w, h, run, time) {
  const y = h - 50;

  // Glass panel background
  drawGlassPanel(ctx, 12, y, w - 24, 40, 10);

  ctx.save();
  ctx.font = "500 12px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.textBaseline = "middle";

  // Lives
  const livesX = 28;
  ctx.fillStyle = "#ff453a";
  ctx.fillText("\u2764 ​" + run.lives + "/" + run.maxLives, livesX, y + 20);

  // Coins
  ctx.fillStyle = "#ffd60a";
  ctx.fillText("\uD83E� ​" + run.coins, livesX + 90, y + 20);

  // Upgrades
  ctx.fillStyle = "#bf5af2";
  ctx.fillText("\u2728 ​" + run.upgrades.length + " 升级", livesX + 180, y + 20);

  // Score
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + run.totalScore, w - 28, y + 20);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

export function handleRunMapKey(key, state) {
  const available = getAvailableChoices(state.run);
  if (available.length === 0) return { ...state, action: null };

  let newSel = state.selectedIndex;

  if (key === "ArrowLeft" || key === "a" || key === "ArrowUp" || key === "w") {
    newSel = Math.max(0, state.selectedIndex - 1);
  } else if (key === "ArrowRight" || key === "d" || key === "ArrowDown" || key === "s") {
    newSel = Math.min(available.length - 1, state.selectedIndex + 1);
  } else if (key === "Enter" || key === " ") {
    const selected = available[state.selectedIndex];
    if (selected) {
      return { ...state, action: "select", nodeId: selected.id };
    }
  }

  return { ...state, selectedIndex: newSel, action: null };
}