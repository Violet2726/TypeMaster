/**
 * Run Map v2 - Apple 级关卡地图视觉
 */

import { NODE_TYPES, getCurrentActNodes, getAvailableChoices, getCurrentNode } from "@typemaster/domain";
import { drawGlassPanel } from "../components/game/draw-helpers";

export interface RunMapState {
  run: any;
  selectedIndex: number;
  animTime: number;
  transitionAlpha: number;
  transitioning: boolean;
  bgParticles: { x: number; y: number; size: number; alpha: number; speed: number; phase: number }[];
  pathParticles: { x: number; y: number; progress: number; speed: number; fromId: string; toId: string }[];
}

export function createRunMapState(run) {
  const bgParticles = [];
  for (let i = 0; i < 40; i++) {
    bgParticles.push({ x: Math.random(), y: Math.random(), size: 0.5 + Math.random() * 1.5, alpha: 0.1 + Math.random() * 0.3, speed: 0.1 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 });
  }
  return { run, selectedIndex: 0, animTime: 0, transitionAlpha: 1, transitioning: false, bgParticles, pathParticles: [] };
}

function getNodePositions(nodes, w, h) {
  const padding = { top: 100, bottom: 80, left: 80, right: 80 };
  const mapH = h - padding.top - padding.bottom;
  const maxRow = Math.max(...nodes.map(n => n.row));
  return nodes.map(n => {
    const rowRatio = maxRow > 0 ? n.row / maxRow : 0;
    const xCenter = w / 2 + n.col * 130;
    const y = padding.top + rowRatio * mapH;
    return { id: n.id, x: Math.max(40, Math.min(w - 40, xCenter)), y, node: n };
  });
}

function renderBg(ctx, w, h, state, time) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#060a14");
  bgGrad.addColorStop(0.5, "#0a0e1a");
  bgGrad.addColorStop(1, "#0d1220");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  for (const pt of state.bgParticles) {
    const px = pt.x * w;
    const py = (pt.y * h + time * pt.speed * 0.02) % h;
    const twinkle = Math.sin(time * 0.002 + pt.phase) * 0.3 + 0.7;
    ctx.fillStyle = "rgba(120,140,200," + (pt.alpha * twinkle) + ")";
    ctx.beginPath();
    ctx.arc(px, py, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPaths(ctx, positions, nodes, state, time) {
  for (const pos of positions) {
    const node = pos.node;
    for (const connId of node.connections) {
      const target = positions.find(pp => pp.id === connId);
      if (!target) continue;
      const isCompleted = node.completed && target.node.completed;
      const isAvailable = target.node.available;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(target.x, target.y);
      if (isCompleted) { ctx.strokeStyle = "rgba(52,199,89,0.3)"; ctx.lineWidth = 2.5; }
      else if (isAvailable) { ctx.strokeStyle = "rgba(10,132,255,0.25)"; ctx.lineWidth = 2; }
      else { ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1; }
      ctx.stroke();
      ctx.restore();
      if (isAvailable) {
        for (let i = 0; i < 3; i++) {
          const t = ((time * 0.0003 + i / 3) % 1);
          const px = pos.x + (target.x - pos.x) * t;
          const py = pos.y + (target.y - pos.y) * t;
          const alpha = Math.sin(t * Math.PI) * 0.6;
          ctx.fillStyle = "rgba(10,132,255," + alpha + ")";
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function renderNodes(ctx, positions, state, time, w, h) {
  const { run, selectedIndex } = state;
  const available = getAvailableChoices(run);
  for (const pos of positions) {
    const node = pos.node;
    const typeDef = NODE_TYPES[node.type] || NODE_TYPES.combat;
    const isAvailable = node.available && available.some(a => a.id === node.id);
    const selIdx = available.indexOf(available.find(a => a.id === node.id));
    const isSelected = isAvailable && selIdx === selectedIndex;
    const isCompleted = node.completed && !node.current;
    const isBoss = node.type === "boss";
    const baseRadius = isBoss ? 28 : 22;
    const breathe = Math.sin(time * 0.003 + pos.x * 0.01) * 0.12 + 1;
    const radius = isAvailable ? baseRadius * breathe : baseRadius;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    if (isBoss && isAvailable) {
      const pulsePhase = (time * 0.002) % 1;
      const pulseR = radius + 10 + pulsePhase * 20;
      const pulseAlpha = (1 - pulsePhase) * 0.4;
      ctx.strokeStyle = "rgba(255,69,58," + pulseAlpha + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (isSelected) {
      const glowR = radius + 18;
      const glow = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, glowR);
      glow.addColorStop(0, typeDef.color + "60");
      glow.addColorStop(0.6, typeDef.color + "20");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    } else if (isAvailable) {
      const glowR = radius + 10;
      const glow = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, glowR);
      glow.addColorStop(0, typeDef.color + "30");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    if (isCompleted) { ctx.fillStyle = "rgba(52,199,89,0.1)"; ctx.strokeStyle = "rgba(52,199,89,0.5)"; }
    else if (isAvailable) { ctx.fillStyle = typeDef.color + "15"; ctx.strokeStyle = typeDef.color; }
    else { ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.strokeStyle = "rgba(255,255,255,0.08)"; }
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fill();
    ctx.stroke();
    ctx.font = (isBoss ? "20" : "16") + "px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isCompleted ? "#34c759" : isAvailable ? "#ffffff" : "rgba(255,255,255,0.25)";
    ctx.fillText(isCompleted ? "\u2713" : typeDef.icon, 0, 0);
    ctx.font = "500 11px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = isAvailable ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)";
    ctx.fillText(typeDef.nameZh, 0, radius + 16);
    ctx.restore();
  }
}

function renderHud(ctx, w, h, run, time) {
  const y = h - 56;
  drawGlassPanel(ctx, 12, y, w - 24, 44, 12);
  ctx.save();
  ctx.font = "500 12px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ff453a";
  ctx.fillText("\u2764 " + run.lives + "/" + run.maxLives, 28, y + 22);
  ctx.fillStyle = "#ffd60a";
  ctx.fillText("\uD83E\uDE99 " + run.coins, 120, y + 22);
  ctx.fillStyle = "#bf5af2";
  ctx.fillText("\u2728 " + run.upgrades.length + " \u5347\u7EA7", 220, y + 22);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + run.totalScore, w - 28, y + 22);
  ctx.restore();
  const completedNodes = run.acts[run.currentAct].nodes.filter(n => n.completed).length;
  const totalNodes = run.acts[run.currentAct].nodes.length;
  const progress = completedNodes / totalNodes;
  const barW = w - 24;
  const barX = 12;
  const barY = y - 8;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(barX, barY, barW, 3);
  const progGrad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
  progGrad.addColorStop(0, "#0a84ff");
  progGrad.addColorStop(1, "#34c759");
  ctx.fillStyle = progGrad;
  ctx.fillRect(barX, barY, barW * progress, 3);
}

export function renderRunMap(ctx, w, h, state, time) {
  const { run } = state;
  if (!run) return;
  const nodes = getCurrentActNodes(run);
  if (nodes.length === 0) return;
  const positions = getNodePositions(nodes, w, h);
  const available = getAvailableChoices(run);
  const actConfig = run.acts[run.currentAct].config;
  renderBg(ctx, w, h, state, time);
  renderPaths(ctx, positions, nodes, state, time);
  renderNodes(ctx, positions, state, time, w, h);
  ctx.save();
  ctx.font = "700 24px -apple-system, SF Pro Display, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(actConfig.nameZh, w / 2, 20);
  ctx.font = "400 13px -apple-system, SF Pro Text, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("\u5E55 " + (run.currentAct + 1) + " / " + run.acts.length, w / 2, 50);
  ctx.restore();
  renderHud(ctx, w, h, run, time);
  if (available.length > 0) {
    const sel = available[state.selectedIndex];
    if (sel) {
      const typeDef = NODE_TYPES[sel.type] || NODE_TYPES.combat;
      ctx.save();
      ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(typeDef.description || typeDef.nameZh, w / 2, h - 16);
      ctx.restore();
    }
  }
}

// Touch/click handling for run map
export function handleRunMapClick(x, y, state, w, h) {
  const { run, selectedIndex } = state;
  const nodes = getCurrentActNodes(run);
  if (nodes.length === 0) return { ...state, action: null };
  const positions = getNodePositions(nodes, w, h);
  const available = getAvailableChoices(run);

  // Check if click is on an available node
  for (const pos of positions) {
    const node = pos.node;
    const isAvailable = node.available && available.some(a => a.id === node.id);
    if (!isAvailable) continue;
    const dx = x - pos.x;
    const dy = y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = node.type === "boss" ? 35 : 28;
    if (dist < hitRadius) {
      const selIdx = available.indexOf(available.find(a => a.id === node.id));
      return { ...state, selectedIndex: selIdx, action: "select", nodeId: node.id };
    }
  }

  // Check if click is on HUD area (bottom)
  if (y > h - 60) {
    // Left/right halves for navigation
    if (x < w / 2) {
      return handleRunMapKey("ArrowLeft", state);
    } else {
      return handleRunMapKey("ArrowRight", state);
    }
  }

  return { ...state, action: null };
}

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
    if (selected) return { ...state, action: "select", nodeId: selected.id };
  }
  return { ...state, selectedIndex: newSel, action: null };
}