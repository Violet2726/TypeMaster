/**
 * Interactive Tutorial System - 新手引导系统
 * 
 * Apple philosophy: guide through doing, not just showing.
 * Step-by-step interactive tutorial that teaches core mechanics.
 */

import { COLORS } from '../components/game/colors';
import { drawGlassPanel } from '../components/game/draw-helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TutorialStep {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  target: 'enemy' | 'combo' | 'boss' | 'powerup' | 'complete';
  highlight?: { x: number; y: number; w: number; h: number };
  condition: (state: any) => boolean;
  reward?: { xp: number; message: string };
}

// ---------------------------------------------------------------------------
// Tutorial Steps
// ---------------------------------------------------------------------------

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Typing Raid',
    titleZh: '欢迎来到 Typing Raid',
    description: 'Type the words on enemies to destroy them!',
    descriptionZh: '输入敌人身上的单词来消灭它们！',
    target: 'enemy',
    condition: () => true // Always passes - just shown
  },
  {
    id: 'first_kill',
    title: 'First Kill',
    titleZh: '首次击杀',
    description: 'Type the word on the nearest enemy and press the matching keys.',
    descriptionZh: '输入最近敌人身上的单词，按下对应的按键。',
    target: 'enemy',
    condition: (state) => state.enemiesDefeated >= 1,
    reward: { xp: 10, message: 'Great start! +10 XP' }
  },
  {
    id: 'combo_basics',
    title: 'Combo System',
    titleZh: '连击系统',
    description: 'Kill enemies quickly to build combos. Higher combos = more points!',
    descriptionZh: '快速击杀敌人建立连击。更高连击 = 更多分数！',
    target: 'combo',
    condition: (state) => state.combo >= 3,
    reward: { xp: 20, message: 'Combo master! +20 XP' }
  },
  {
    id: 'wave_clear',
    title: 'Wave Clear',
    titleZh: '清除波次',
    description: 'Clear all enemies in a wave to advance. Watch for new enemy types!',
    descriptionZh: '清除一波中的所有敌人以进入下一波。注意新敌人类型！',
    target: 'enemy',
    condition: (state) => state.wave >= 2,
    reward: { xp: 30, message: 'Wave cleared! +30 XP' }
  },
  {
    id: 'boss_intro',
    title: 'Boss Enemy',
    titleZh: 'Boss敌人',
    description: 'Bosses have multiple phases and longer words. Stay focused!',
    descriptionZh: 'Boss有多个阶段和更长的单词。保持专注！',
    target: 'boss',
    condition: (state) => state.wave >= 5,
    reward: { xp: 50, message: 'Boss slayer! +50 XP' }
  },
  {
    id: 'complete',
    title: 'Tutorial Complete!',
    titleZh: '教程完成！',
    description: 'You\'re ready for the real challenge. Good luck!',
    descriptionZh: '你已经准备好迎接真正的挑战了。祝你好运！',
    target: 'complete',
    condition: () => true,
    reward: { xp: 100, message: 'Tutorial master! +100 XP' }
  }
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentStepIndex = 0;
let isActive = false;
let stepStartTime = 0;
let completedSteps: string[] = [];
let lastReward: { xp: number; message: string } | null = null;
let rewardDisplayTime = 0;

const STORAGE_KEY = 'typing-raid-tutorial-progress';

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadProgress(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveProgress(steps: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  } catch {}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function startTutorial(): void {
  completedSteps = loadProgress();
  
  // Find first incomplete step
  const firstIncomplete = TUTORIAL_STEPS.findIndex(s => !completedSteps.includes(s.id));
  if (firstIncomplete >= 0) {
    currentStepIndex = firstIncomplete;
    isActive = true;
    stepStartTime = performance.now();
  }
}

export function isTutorialActive(): boolean {
  return isActive;
}

export function getCurrentStep(): TutorialStep | null {
  if (!isActive || currentStepIndex >= TUTORIAL_STEPS.length) return null;
  return TUTORIAL_STEPS[currentStepIndex];
}

export function updateTutorialState(gameState: any): void {
  if (!isActive) return;
  
  const step = TUTORIAL_STEPS[currentStepIndex];
  if (!step) return;
  
  // Check if step condition is met
  if (step.condition(gameState)) {
    // Complete this step
    if (!completedSteps.includes(step.id)) {
      completedSteps.push(step.id);
      saveProgress(completedSteps);
      
      // Award reward
      if (step.reward) {
        lastReward = step.reward;
        rewardDisplayTime = performance.now();
      }
    }
    
    // Move to next step
    currentStepIndex++;
    stepStartTime = performance.now();
    
    // Check if tutorial is complete
    if (currentStepIndex >= TUTORIAL_STEPS.length) {
      isActive = false;
    }
  }
}

export function skipTutorial(): void {
  isActive = false;
  // Mark all steps as completed
  TUTORIAL_STEPS.forEach(step => {
    if (!completedSteps.includes(step.id)) {
      completedSteps.push(step.id);
    }
  });
  saveProgress(completedSteps);
}

export function resetTutorial(): void {
  completedSteps = [];
  currentStepIndex = 0;
  isActive = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getLastReward(): { xp: number; message: string } | null {
  if (lastReward && performance.now() - rewardDisplayTime < 3000) {
    return lastReward;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderTutorialOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
): void {
  if (!isActive) return;
  
  const step = TUTORIAL_STEPS[currentStepIndex];
  if (!step) return;
  
  const elapsed = (time - stepStartTime) / 1000;
  const fadeIn = Math.min(1, elapsed / 0.3);
  
  ctx.save();
  ctx.globalAlpha = fadeIn;
  
  // Tutorial panel
  const panelW = 320;
  const panelH = 120;
  const panelX = w / 2 - panelW / 2;
  const panelY = 20;
  
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 16);
  
  // Step indicator
  const stepNum = currentStepIndex + 1;
  const totalSteps = TUTORIAL_STEPS.length;
  
  ctx.font = '500 10px -apple-system, SF Pro Text, system-ui, sans-serif';
  ctx.fillStyle = COLORS.textTertiary;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Step ${stepNum}/${totalSteps}`, panelX + 16, panelY + 12);
  
  // Title
  ctx.font = '600 16px -apple-system, SF Pro Display, system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(step.titleZh, panelX + 16, panelY + 28);
  
  // Description
  ctx.font = '400 12px -apple-system, SF Pro Text, system-ui, sans-serif';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText(step.descriptionZh, panelX + 16, panelY + 52);
  
  // Progress dots
  const dotY = panelY + panelH - 20;
  const dotSpacing = 12;
  const dotsStartX = w / 2 - ((totalSteps - 1) * dotSpacing) / 2;
  
  for (let i = 0; i < totalSteps; i++) {
    const dx = dotsStartX + i * dotSpacing;
    const isCompleted = i < currentStepIndex;
    const isCurrent = i === currentStepIndex;
    
    ctx.beginPath();
    ctx.arc(dx, dotY, isCurrent ? 4 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isCompleted ? COLORS.success : isCurrent ? '#0a84ff' : COLORS.textTertiary;
    ctx.fill();
  }
  
  // Skip button
  const skipText = 'Skip Tutorial';
  ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
  ctx.fillStyle = COLORS.textTertiary;
  ctx.textAlign = 'right';
  ctx.fillText(skipText, panelX + panelW - 16, panelY + 12);
  
  ctx.restore();
  
  // Reward popup
  const reward = getLastReward();
  if (reward) {
    renderRewardPopup(ctx, w, h, time, reward);
  }
}

function renderRewardPopup(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  reward: { xp: number; message: string }
): void {
  const elapsed = (time - rewardDisplayTime) / 1000;
  const fadeOut = Math.max(0, 1 - (elapsed - 2) / 1);
  const slideIn = Math.min(1, elapsed / 0.3);
  
  if (fadeOut <= 0) return;
  
  ctx.save();
  ctx.globalAlpha = fadeOut * slideIn;
  
  const popupW = 200;
  const popupH = 50;
  const popupX = w / 2 - popupW / 2;
  const popupY = h / 2 - popupH / 2 - 50;
  
  drawGlassPanel(ctx, popupX, popupY, popupW, popupH, 12);
  
  ctx.font = '600 14px -apple-system, SF Pro Display, system-ui, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(reward.message, w / 2, popupY + popupH / 2);
  
  ctx.restore();
}
