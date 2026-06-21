/**
 * Leaderboard - Local top scores with rank indicators.
 *
 * Shows top 10 scores from localStorage with rank badges.
 * Apple philosophy: clean competition, personal bests matter most.
 */

import { COLORS } from "../components/game/colors";
import { drawGlassPanel } from "../components/game/draw-helpers";

function getScale(w, h) { return Math.max(0.6, Math.min(1.2, w / 800)); }

const STORAGE_KEY = 'typing-raid-leaderboard';
const MAX_ENTRIES = 10;

const RANK_BADGES = [
    { rank: 1, label: '1st', color: '#ffd700', glow: 'rgba(255,215,0,0.4)' },
    { rank: 2, label: '2nd', color: '#c0c0c0', glow: 'rgba(192,192,192,0.3)' },
    { rank: 3, label: '3rd', color: '#cd7f32', glow: 'rgba(205,127,50,0.3)' },
];

export function loadLeaderboard() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

export function saveToLeaderboard(entry) {
    const board = loadLeaderboard();
    board.push({
        score: entry.score,
        wave: entry.wave,
        wpm: entry.wpm,
        accuracy: entry.accuracy,
        maxCombo: entry.maxCombo,
        rating: entry.rating || 'D',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
    });
    // Sort by score descending, keep top 10
    board.sort((a, b) => b.score - a.score);
    const trimmed = board.slice(0, MAX_ENTRIES);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
    return trimmed;
}

export function getLeaderboardRank(score) {
    const board = loadLeaderboard();
    for (let i = 0; i < board.length; i++) {
        if (score >= board[i].score) return i + 1;
    }
    return board.length + 1;
}

// ---------------------------------------------------------------------------
// Achievement Share Text
// ---------------------------------------------------------------------------

export function generateAchievementShareText(achievementState, achievements) {
    const unlocked = achievements.filter(a => achievementState[a.id] && achievementState[a.id].unlocked);
    const total = achievements.length;
    
    let text = 'Typing Raid - Achievement Report\n';
    text += '================================\n\n';
    text += 'Unlocked: ' + unlocked.length + ' / ' + total + '\n\n';
    
    if (unlocked.length > 0) {
        text += 'Recent Unlocks:\n';
        unlocked.slice(-5).forEach(a => {
            text += '  [' + a.icon + '] ' + a.nameZh + ' - ' + a.desc + '\n';
        });
    }
    
    text += '\nPlay at: typing-raid.app';
    return text;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

let isOpen = false;
let scrollOffset = 0;

export function openLeaderboard() { isOpen = true; scrollOffset = 0; }
export function closeLeaderboard() { isOpen = false; }
export function isLeaderboardOpen() { return isOpen; }

export function handleLeaderboardKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape' || e.key === 'l' || e.key === 'L') {
        closeLeaderboard();
        return;
    }
    if (e.key === 'ArrowUp') { scrollOffset = Math.max(0, scrollOffset - 1); return; }
    if (e.key === 'ArrowDown') { scrollOffset++; return; }
}

export function renderLeaderboard(ctx, w, h, time) {
    if (!isOpen) return;
    
    const s = getScale(w, h);
    const board = loadLeaderboard();
    
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, w, h);
    
    // Title
    ctx.font = '700 ' + Math.round(24 * s) + 'px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Leaderboard', w / 2, 30);
    
    // Subtitle
    ctx.font = '500 ' + Math.round(11 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText('Top ' + Math.min(board.length, MAX_ENTRIES) + ' scores', w / 2, 58);
    
    if (board.length === 0) {
        ctx.font = '400 ' + Math.round(14 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
        ctx.fillStyle = COLORS.textTertiary;
        ctx.fillText('No games played yet', w / 2, h / 2);
        ctx.fillText('Play a game to see your scores here', w / 2, h / 2 + 24);
    } else {
        // Score list
        const listY = 85;
        const rowH = 44;
        const rowW = Math.min(420, w - 40);
        
        board.slice(scrollOffset, scrollOffset + 8).forEach((entry, i) => {
            const rank = scrollOffset + i + 1;
            const ry = listY + i * (rowH + 6);
            const rx = w / 2 - rowW / 2;
            
            // Row background
            drawGlassPanel(ctx, rx, ry, rowW, rowH, 8);
            
            // Rank badge
            const badge = RANK_BADGES.find(b => b.rank === rank);
            if (badge) {
                ctx.fillStyle = badge.color;
                ctx.shadowColor = badge.glow;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(rx + 22, ry + rowH / 2, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                ctx.font = '700 ' + Math.round(10 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(badge.label, rx + 22, ry + rowH / 2);
            } else {
                ctx.font = '600 ' + Math.round(11 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
                ctx.fillStyle = COLORS.textTertiary;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('#' + rank, rx + 22, ry + rowH / 2);
            }
            
            // Score
            ctx.font = '700 ' + Math.round(16 * s) + 'px -apple-system, SF Pro Display, system-ui, sans-serif';
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(String(entry.score), rx + 46, ry + 8);
            
            // Rating badge
            const ratingColors = { S: '#ffd700', A: '#34c759', B: '#3b9eff', C: '#ffcc02', D: '#ff3b5c' };
            ctx.font = '700 ' + Math.round(12 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
            ctx.fillStyle = ratingColors[entry.rating] || COLORS.textTertiary;
            ctx.textAlign = 'right';
            ctx.fillText(entry.rating, rx + rowW - 10, ry + 8);
            
            // Details
            ctx.font = '400 ' + Math.round(9 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
            ctx.fillStyle = COLORS.textTertiary;
            ctx.textAlign = 'left';
            ctx.fillText('Wave ' + entry.wave + '  |  ' + entry.wpm + ' WPM  |  ' + entry.accuracy + '%  |  ' + entry.date, rx + 46, ry + 28);
        });
    }
    
    // Navigation hint
    ctx.font = '400 ' + Math.round(10 * s) + 'px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('L/Esc close  |  ���� scroll', w / 2, h - 15);
}
