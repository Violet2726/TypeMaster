/**
 * Social Features - Share and compare results
 * 
 * Apple philosophy: share accomplishments, inspire others.
 * Features:
 * 1. Generate shareable result cards
 * 2. Copy results to clipboard
 * 3. Simulated friend leaderboard
 */

import { COLORS } from '../components/game/colors';
import { drawGlassPanel } from '../components/game/draw-helpers';

interface GameResult {
  score: number;
  wave: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  gameMode: string;
  date: string;
}

interface FriendScore {
  name: string;
  score: number;
  wave: number;
  wpm: number;
  avatar: string;
}

// ---------------------------------------------------------------------------
// Simulated Friend Data
// ---------------------------------------------------------------------------

const FRIEND_SCORES: FriendScore[] = [
  { name: 'Alex', score: 8500, wave: 15, wpm: 65, avatar: 'A' },
  { name: 'Maria', score: 6200, wave: 12, wpm: 58, avatar: 'M' },
  { name: 'Chen', score: 5800, wave: 11, wpm: 52, avatar: 'C' },
  { name: 'Yuki', score: 4500, wave: 9, wpm: 48, avatar: 'Y' },
  { name: 'Max', score: 3200, wave: 7, wpm: 42, avatar: 'M' },
];

// ---------------------------------------------------------------------------
// Share Text Generation
// ---------------------------------------------------------------------------

export function generateShareText(result: GameResult): string {
  const modeEmoji: Record<string, string> = {
    classic: '?',
    endless: '?',
    timeAttack: '?',
    zen: '?',
    daily: '?',
  };
  
  const emoji = modeEmoji[result.gameMode] || '?';
  
  return `Typing Raid ${emoji}

Score: ${result.score}
Wave: ${result.wave}
WPM: ${result.wpm}
Accuracy: ${result.accuracy}%
Max Combo: ${result.maxCombo}x

Can you beat my score?`;
}

export function generateShareCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  result: GameResult
): void {
  // Card dimensions
  const cardW = 320;
  const cardH = 200;
  const cardX = w / 2 - cardW / 2;
  const cardY = h / 2 - cardH / 2;
  
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, w, h);
  
  // Card
  drawGlassPanel(ctx, cardX, cardY, cardW, cardH, 20);
  
  // Title
  ctx.font = '700 24px -apple-system, SF Pro Display, system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Share Result', w / 2, cardY + 20);
  
  // Score (large)
  ctx.font = '700 48px -apple-system, SF Pro Display, system-ui, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(String(result.score), w / 2, cardY + 60);
  
  // Metrics
  const metrics = [
    { label: 'Wave', value: result.wave },
    { label: 'WPM', value: result.wpm },
    { label: 'Accuracy', value: result.accuracy + '%' },
    { label: 'Combo', value: result.maxCombo + 'x' },
  ];
  
  const metricW = cardW / metrics.length;
  metrics.forEach((m, i) => {
    const mx = cardX + i * metricW + metricW / 2;
    const my = cardY + 130;
    
    ctx.font = '600 16px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.fillText(String(m.value), mx, my);
    
    ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.fillText(m.label, mx, my + 20);
  });
  
  // Buttons
  const btnW = 120;
  const btnH = 36;
  const btnY = cardY + cardH - 50;
  
  // Copy button
  const copyBtnX = w / 2 - btnW - 10;
  drawGlassPanel(ctx, copyBtnX, btnY, btnW, btnH, 8);
  ctx.font = '500 12px -apple-system, SF Pro Text, system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Copy Text', copyBtnX + btnW / 2, btnY + btnH / 2);
  
  // Close button
  const closeBtnX = w / 2 + 10;
  drawGlassPanel(ctx, closeBtnX, btnY, btnW, btnH, 8);
  ctx.fillText('Close', closeBtnX + btnW / 2, btnY + btnH / 2);
}

// ---------------------------------------------------------------------------
// Friend Leaderboard
// ---------------------------------------------------------------------------

export function getFriendLeaderboard(playerScore: number): FriendScore[] {
  const allScores = [
    ...FRIEND_SCORES,
    { name: 'You', score: playerScore, wave: 0, wpm: 0, avatar: '?' },
  ];
  
  return allScores.sort((a, b) => b.score - a.score);
}

export function getPlayerRank(playerScore: number): number {
  const leaderboard = getFriendLeaderboard(playerScore);
  return leaderboard.findIndex(s => s.name === 'You') + 1;
}

export function drawFriendLeaderboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  playerScore: number
): void {
  const leaderboard = getFriendLeaderboard(playerScore);
  
  drawGlassPanel(ctx, x, y, w, h, 16);
  
  // Title
  ctx.font = '600 14px -apple-system, SF Pro Display, system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Friend Leaderboard', x + w / 2, y + 12);
  
  // List
  const itemH = 32;
  const listY = y + 36;
  
  leaderboard.slice(0, 5).forEach((entry, i) => {
    const iy = listY + i * itemH;
    const isPlayer = entry.name === 'You';
    
    // Rank
    ctx.font = '600 12px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : COLORS.textSecondary;
    ctx.textAlign = 'left';
    ctx.fillText('#' + (i + 1), x + 12, iy + 8);
    
    // Avatar
    ctx.fillStyle = isPlayer ? '#0a84ff' : 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(x + 36, iy + 14, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = '600 10px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = isPlayer ? '#ffffff' : COLORS.textSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(entry.avatar, x + 36, iy + 14);
    
    // Name
    ctx.font = isPlayer ? '600 12px -apple-system, SF Pro Text, system-ui, sans-serif' : '400 12px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = isPlayer ? '#0a84ff' : COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(entry.name, x + 52, iy + 8);
    
    // Score
    ctx.font = '600 12px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'right';
    ctx.fillText(String(entry.score), x + w - 12, iy + 8);
  });
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function generateResultShareText(result: GameResult): string {
  return generateShareText(result);
}
