/**
 * Game Over Screen - Apple-style celebration with rating and history.
 *
 * Transforms the basic stat panel into a cinematic reveal:
 * 1. Score counter animates up with spring physics
 * 2. Rating badge (S/A/B/C) appears with glow
 * 3. Stats reveal one by one with staggered timing
 * 4. "NEW RECORD" badge pulses if this is the best score
 * 5. Action prompts fade in last
 */

import { COLORS } from "../components/game/colors";
import { calculateXp, getRankProgress, loadTotalXp, addXp } from "@typemaster/domain";
import { drawGlassPanel } from "../components/game/draw-helpers";
import { generateShareText, copyToClipboard, drawFriendLeaderboard } from "./social-features";

function getScale(w: number, h: number): number { return Math.max(0.6, Math.min(1.2, w / 800)); }

export interface GameOverResult {
    score: number;
    wave: number;
    wpm: number;
    accuracy: number;
    maxCombo: number;
    enemiesDefeated: number;
    durationSeconds: number;
    perfectWaves: number;
}

export type Rating = "S" | "A" | "B" | "C" | "D";

const RATING_CONFIG: Record<Rating, { color: string; glow: string; label: string; labelZh: string; subtitle: string; minScore: number }> = {
    S: { color: "#ffd700", glow: "rgba(255,215,0,0.6)", label: "LEGENDARY", labelZh: "传奇", subtitle: "Absolute mastery", minScore: 5000 },
    A: { color: "#32d74b", glow: "rgba(50,215,75,0.5)", label: "EXCELLENT", labelZh: "卓越", subtitle: "Outstanding performance", minScore: 3000 },
    B: { color: "#0a84ff", glow: "rgba(10,132,255,0.5)", label: "GREAT", labelZh: "出色", subtitle: "Strong typing skills", minScore: 1500 },
    C: { color: "#ff9f0a", glow: "rgba(255,159,10,0.5)", label: "GOOD", labelZh: "良好", subtitle: "Room to grow", minScore: 500 },
    D: { color: "#ff453a", glow: "rgba(255,69,58,0.5)", label: "KEEP TRYING", labelZh: "加油", subtitle: "Keep practicing!", minScore: 0 },
};

const STORAGE_KEY = "typing-raid-best";

interface BestRecord {
    score: number;
    wave: number;
    maxCombo: number;
    wpm: number;
}

function loadBest(): BestRecord {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return { score: 0, wave: 0, maxCombo: 0, wpm: 0 };
}

function saveBest(record: BestRecord): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {}
}

export function calculateRating(result: GameOverResult): Rating {
    const s = result.score;
    if (s >= RATING_CONFIG.S.minScore) return "S";
    if (s >= RATING_CONFIG.A.minScore) return "A";
    if (s >= RATING_CONFIG.B.minScore) return "B";
    if (s >= RATING_CONFIG.C.minScore) return "C";
    return "D";
}

export function checkAndSaveBest(result: GameOverResult): { isNewRecord: boolean; best: BestRecord; xpEarned: number; rankProgress: any; rankUp: boolean } {
    const best = loadBest();
    const isNew = result.score > best.score;
    if (isNew) {
        saveBest({ score: result.score, wave: result.wave, maxCombo: result.maxCombo, wpm: result.wpm });
    }

    // Calculate XP and update rank
    const xpEarned = calculateXp(result);
    const prevXp = loadTotalXp();
    const newXp = addXp(xpEarned);
    const rankProgress = getRankProgress(newXp);
    const prevRank = getRankProgress(prevXp);
    const rankUp = rankProgress.current.id !== prevRank.current.id;

    return { isNewRecord: isNew, best: isNew ? { score: result.score, wave: result.wave, maxCombo: result.maxCombo, wpm: result.wpm } : best, xpEarned, rankProgress, rankUp };
}


// ---------------------------------------------------------------------------
// Animated State
// ---------------------------------------------------------------------------

interface AnimState {
    startTime: number;
    rating: Rating;
    isNewRecord: boolean;
    best: BestRecord;
    result: GameOverResult;
    // Animated counters
    displayScore: number;
    revealedStats: number;    // how many stats revealed (0-6)
    actionsVisible: boolean;
    ratingScale: number;
    ratingGlow: number;
    // Growth/progression
    xpEarned?: number;
    rankProgress?: any;
    rankUp?: boolean;
}

let anim: AnimState | null = null;

export function initGameOver(result: GameOverResult): void {
    const rating = calculateRating(result);
    const { isNewRecord, best } = checkAndSaveBest(result);
    anim = {
        startTime: performance.now(),
        rating, isNewRecord, best, result,
        displayScore: 0, revealedStats: 0, actionsVisible: false,
        ratingScale: 0, ratingGlow: 0,
    };
}

export function clearGameOver(): void { anim = null; }

// ---------------------------------------------------------------------------
// Easing helpers
// ---------------------------------------------------------------------------

function easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderGameOver(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!anim) return;

    const elapsed = (time - anim.startTime) / 1000; // seconds
    const result = anim.result;
    const ratingCfg = RATING_CONFIG[anim.rating];

    // Update animated state
    // Score counter: animate from 0 to final over 1.2s
    const scoreProgress = Math.min(1, elapsed / 1.2);
    anim.displayScore = Math.round(result.score * easeOutCubic(scoreProgress));

    // Rating badge: appears at 0.8s with bounce
    const ratingProgress = Math.max(0, Math.min(1, (elapsed - 0.8) / 0.4));
    anim.ratingScale = easeOutBack(ratingProgress);
    anim.ratingGlow = ratingProgress * (0.5 + Math.sin(time * 0.005) * 0.3);

    // Stats reveal: stagger 0.3s each, starting at 1.5s
    anim.revealedStats = Math.min(6, Math.max(0, Math.floor((elapsed - 1.5) / 0.25)));

    // Actions: appear at 3.5s
    anim.actionsVisible = elapsed > 3.5;

    // --- Draw ---

    // Overlay fade-in (0.3s)
    const overlayAlpha = Math.min(1, elapsed / 0.3);
    ctx.save();
    ctx.globalAlpha = overlayAlpha;
    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // Main glass panel
    const panelW = 480;
    const panelH = 440;
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH, 24);

    // Title
    const titleProgress = Math.min(1, elapsed / 0.5);
    ctx.globalAlpha = titleProgress;
    ctx.font = "700 28px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Mission Complete", w / 2, panelY + 40);
    ctx.globalAlpha = 1;

    // Score with animated counter
    const scoreY = panelY + 90;
    ctx.font = "400 12px -apple-system, SF Pro Text, system-ui, sans-serif";
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = "center";
    ctx.fillText("SCORE", w / 2, scoreY - 18);

    ctx.font = "800 56px -apple-system, SF Pro Display, system-ui, sans-serif";
    ctx.fillStyle = ratingCfg.color;
    ctx.shadowColor = ratingCfg.glow;
    ctx.shadowBlur = 20 * anim.ratingGlow;
    ctx.fillText(String(anim.displayScore), w / 2, scoreY + 18);
    ctx.shadowBlur = 0;

    // Rating badge (appears with bounce)
    if (ratingProgress > 0) {
        const badgeX = w / 2 + 80;
        const badgeY = scoreY + 18;
        ctx.save();
        ctx.translate(badgeX, badgeY);
        ctx.scale(anim.ratingScale, anim.ratingScale);

        // Badge circle
        ctx.fillStyle = ratingCfg.color;
        ctx.shadowColor = ratingCfg.glow;
        ctx.shadowBlur = 15 * anim.ratingGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        // Badge letter
        ctx.shadowBlur = 0;
        ctx.font = "800 24px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(anim.rating, 0, 0);

        // Rating label
        ctx.font = "600 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = ratingCfg.color;
        ctx.fillText(ratingCfg.labelZh + " " + ratingCfg.label, 0, 38);

        ctx.restore();
    }

    // NEW RECORD badge
    if (anim.isNewRecord && ratingProgress > 0.5) {
        const recordAlpha = Math.min(1, (elapsed - 1.2) / 0.3);
        const recordPulse = Math.sin(time * 0.006) * 0.15 + 0.85;
        ctx.save();
        ctx.globalAlpha = recordAlpha * recordPulse;

        const recX = w / 2;
        const recY = panelY + 165;

        drawGlassPanel(ctx, recX - 70, recY - 12, 140, 24, 12);

        ctx.font = "700 11px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("NEW RECORD", recX, recY);

        ctx.restore();
    }

    // Stats grid with staggered reveal
    const statsData = [
        { label: "WAVE", value: String(result.wave), diff: result.wave - anim.best.wave, accent: "#3b82f6" },
        { label: "WPM", value: String(result.wpm), diff: result.wpm - anim.best.wpm, accent: "#8b5cf6" },
        { label: "ACCURACY", value: result.accuracy + "%", diff: 0, accent: "#06b6d4" },
        { label: "COMBO", value: String(result.maxCombo), diff: result.maxCombo - anim.best.maxCombo, accent: "#f59e0b" },
        { label: "KILLS", value: String(result.enemiesDefeated), diff: 0, accent: "#ef4444" },
        { label: "PERFECT", value: String(result.perfectWaves), diff: 0, accent: "#22c55e" },
    ];

    const gridStartY = panelY + 200;
    const cellW = 130;
    const cellH = 50;
    const gridCols = 3;

    statsData.forEach((s, i) => {
        if (i >= anim.revealedStats) return;

        const statElapsed = elapsed - 1.5 - i * 0.25;
        const statProgress = Math.min(1, statElapsed / 0.3);
        const statScale = easeOutBack(statProgress);

        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const sx = w / 2 - (gridCols * cellW) / 2 + col * (cellW + 10);
        const sy = gridStartY + row * (cellH + 10);

        ctx.save();
        ctx.translate(sx + cellW / 2, sy + cellH / 2);
        ctx.scale(statScale, statScale);
        ctx.translate(-(sx + cellW / 2), -(sy + cellH / 2));

        drawGlassPanel(ctx, sx, sy, cellW, cellH, 10);
        // Accent left border
        ctx.fillStyle = (s as any).accent;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(sx, sy + 8, 3, cellH - 16, 1.5);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(s.label, sx + cellW / 2, sy + 8);

        ctx.font = "600 20px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = COLORS.text;
        ctx.textBaseline = "bottom";
        ctx.fillText(s.value, sx + cellW / 2, sy + cellH - 6);

        // Best comparison indicator
        if (s.diff > 0 && anim.isNewRecord) {
            ctx.font = "600 9px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = "#32d74b";
            ctx.textAlign = "right";
            ctx.textBaseline = "top";
            ctx.fillText("+" + s.diff, sx + cellW - 6, sy + 6);
        }

        ctx.restore();
    });

    // XP earned display (appears with stats)
    if (anim.revealedStats >= 6 && anim.xpEarned !== undefined) {
        const xpAlpha = Math.min(1, (elapsed - 3.0) / 0.3);
        ctx.save();
        ctx.globalAlpha = xpAlpha;
        
        const xpY = panelY + 340;
        
        // XP label and value
        ctx.font = "400 10px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textTertiary;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("EXPERIENCE EARNED", w / 2, xpY - 14);
        
        ctx.font = "700 22px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = "#ffd700";
        ctx.shadowColor = "rgba(255,215,0,0.4)";
        ctx.shadowBlur = 8;
        ctx.fillText("+" + anim.xpEarned + " XP", w / 2, xpY + 2);
        ctx.shadowBlur = 0;
        
        // Rank progress bar
        if (anim.rankProgress) {
            const rp = anim.rankProgress;
            const barW = 200;
            const barH = 4;
            const barX = w / 2 - barW / 2;
            const barY = xpY + 28;
            
            // Background
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, 2);
            ctx.fill();
            
            // Fill
            ctx.fillStyle = rp.current.color;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * rp.progress, barH, 2);
            ctx.fill();
            
            // Rank label
            ctx.font = "600 9px -apple-system, SF Pro Text, system-ui, sans-serif";
            ctx.fillStyle = rp.current.color;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(rp.current.nameZh + " " + rp.current.icon, barX, barY + 8);
            
            // Next rank
            if (rp.next) {
                ctx.textAlign = "right";
                ctx.fillStyle = COLORS.textTertiary;
                ctx.fillText(rp.next.nameZh + " " + rp.next.icon, barX + barW, barY + 8);
            } else {
                ctx.textAlign = "right";
                ctx.fillStyle = rp.current.color;
                ctx.fillText("MAX", barX + barW, barY + 8);
            }
        }
        
        // Rank up celebration
        if (anim.rankUp) {
            const rankUpPulse = Math.sin(time * 0.006) * 0.2 + 0.8;
            ctx.globalAlpha = xpAlpha * rankUpPulse;
            ctx.font = "700 14px -apple-system, SF Pro Display, system-ui, sans-serif";
            ctx.fillStyle = anim.rankProgress.current.color;
            ctx.textAlign = "center";
            ctx.fillText("RANK UP!", w / 2, xpY + 50);
        }
        
        ctx.restore();
    }

    // Action prompts
    if (anim.actionsVisible) {
        const actionAlpha = Math.min(1, (elapsed - 3.5) / 0.5);
        ctx.save();
        ctx.globalAlpha = actionAlpha;

        const actionY = panelY + panelH - 30;

        ctx.font = "500 14px -apple-system, SF Pro Text, system-ui, sans-serif";
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Press R to play again  |  Esc to exit", w / 2, actionY);

        // Pulsing R indicator
        const rPulse = Math.sin(time * 0.004) * 0.2 + 0.8;
        ctx.globalAlpha = actionAlpha * rPulse;
        ctx.font = "700 14px -apple-system, SF Pro Display, system-ui, sans-serif";
        ctx.fillStyle = COLORS.text;
        ctx.fillText("R", w / 2 - 128, actionY);

        ctx.restore();
    }

    ctx.restore();
}



// ---------------------------------------------------------------------------
// Share Functions
// ---------------------------------------------------------------------------

export function shareResult(): void {
    if (!anim?.result) return;
    
    const shareText = generateShareText({
        score: anim.result.score,
        wave: anim.result.wave,
        wpm: anim.result.wpm,
        accuracy: anim.result.accuracy,
        maxCombo: anim.result.maxCombo,
        gameMode: 'classic',
        date: new Date().toLocaleDateString(),
    });
    
    copyToClipboard(shareText).then(success => {
        if (success) {
            console.log('Copied to clipboard!');
        }
    });
}

export function showFriendLeaderboard(): void {
    if (!anim?.result) return;
    console.log('Show friend leaderboard');
}

