/**
 * Battle VFX System - Õ½¶·ÊÓ¾õÉý¼¶
 * 
 * Enhances combat feel with:
 * 1. Death slow-motion (brief time dilation on kills)
 * 2. Screen flash (full-screen color burst)
 * 3. Combo chain visual (lightning between enemies)
 * 4. Background pulse (reacts to combat intensity)
 * 5. Kill streak aura (visual glow for streaks)
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScreenFlash {
  color: string;
  startTime: number;
  duration: number;
  maxAlpha: number;
}

interface SlowMotion {
  startTime: number;
  duration: number;
  factor: number; // 0.0 - 1.0
}

interface ComboChain {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  startTime: number;
  duration: number;
  width: number;
}

interface BackgroundPulse {
  intensity: number;
  color: string;
  decay: number;
}

interface KillStreak {
  count: number;
  lastKillTime: number;
  auraAlpha: number;
  auraColor: string;
}

// ---------------------------------------------------------------------------
// Battle VFX Manager
// ---------------------------------------------------------------------------

export class BattleVfxManager {
  // Screen flash
  private flash: ScreenFlash | null = null;
  
  // Slow motion
  private slowMo: SlowMotion | null = null;
  private slowMoFactor = 1.0;
  
  // Combo chains
  private chains: ComboChain[] = [];
  
  // Background pulse
  private bgPulse: BackgroundPulse = {
    intensity: 0,
    color: COLORS.normal,
    decay: 0.92
  };
  
  // Kill streak
  private streak: KillStreak = {
    count: 0,
    lastKillTime: 0,
    auraAlpha: 0,
    auraColor: COLORS.normal
  };
  
  // Timing constants
  private readonly FLASH_DURATION = 200; // ms
  private readonly SLOW_MO_DURATION = 150; // ms
  private readonly SLOW_MO_FACTOR = 0.3;
  private readonly CHAIN_DURATION = 300; // ms
  private readonly STREAK_WINDOW = 2000; // ms
  private readonly STREAK_COLORS = [
    COLORS.normal,    // 1-2 kills
    COLORS.fast,      // 3-4 kills
    COLORS.warning,   // 5-6 kills
    COLORS.error,     // 7-8 kills
    '#ff6b6b',        // 9+ kills
  ];

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Trigger on enemy kill
   */
  onEnemyKill(x: number, y: number, enemyType: string, combo: number, chainCount: number): void {
    const now = performance.now();
    
    // Screen flash (intensity based on combo)
    const flashIntensity = Math.min(1, combo / 10);
    this.flash = {
      color: enemyType === 'boss' ? '#ff6b6b' : COLORS.normal,
      startTime: now,
      duration: this.FLASH_DURATION * (1 + flashIntensity * 0.5),
      maxAlpha: 0.15 + flashIntensity * 0.15
    };
    
    // Slow motion (brief on kill)
    if (chainCount >= 2 || combo >= 5) {
      this.slowMo = {
        startTime: now,
        duration: this.SLOW_MO_DURATION * (1 + chainCount * 0.1),
        factor: this.SLOW_MO_FACTOR
      };
    }
    
    // Update kill streak
    if (now - this.streak.lastKillTime < this.STREAK_WINDOW) {
      this.streak.count++;
    } else {
      this.streak.count = 1;
    }
    this.streak.lastKillTime = now;
    
    // Streak aura color
    const colorIndex = Math.min(this.STREAK_COLORS.length - 1, Math.floor(this.streak.count / 2));
    this.streak.auraColor = this.STREAK_COLORS[colorIndex];
    this.streak.auraAlpha = Math.min(0.4, this.streak.count * 0.05);
    
    // Background pulse
    this.bgPulse.intensity = Math.min(1, this.bgPulse.intensity + 0.2 + chainCount * 0.1);
    this.bgPulse.color = this.streak.auraColor;
  }

  /**
   * Trigger combo chain visual between two points
   */
  triggerComboChain(fromX: number, fromY: number, toX: number, toY: number, combo: number): void {
    const now = performance.now();
    const colorIndex = Math.min(this.STREAK_COLORS.length - 1, Math.floor(combo / 3));
    
    this.chains.push({
      fromX,
      fromY,
      toX,
      toY,
      color: this.STREAK_COLORS[colorIndex],
      startTime: now,
      duration: this.CHAIN_DURATION,
      width: 2 + Math.min(4, combo * 0.5)
    });
  }

  /**
   * Update all effects
   */
  update(dt: number): void {
    const now = performance.now();
    
    // Update flash
    if (this.flash && now - this.flash.startTime > this.flash.duration) {
      this.flash = null;
    }
    
    // Update slow motion
    if (this.slowMo) {
      const progress = (now - this.slowMo.startTime) / this.slowMo.duration;
      if (progress >= 1) {
        this.slowMo = null;
        this.slowMoFactor = 1.0;
      } else {
        // Smooth ease out
        this.slowMoFactor = 1.0 - (this.slowMo.factor * (1 - progress));
      }
    }
    
    // Update chains
    this.chains = this.chains.filter(c => now - c.startTime < c.duration);
    
    // Update background pulse
    this.bgPulse.intensity *= this.bgPulse.decay;
    if (this.bgPulse.intensity < 0.01) this.bgPulse.intensity = 0;
    
    // Update streak aura decay
    if (now - this.streak.lastKillTime > this.STREAK_WINDOW) {
      this.streak.auraAlpha *= 0.95;
      if (this.streak.auraAlpha < 0.01) {
        this.streak.count = 0;
        this.streak.auraAlpha = 0;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /**
   * Draw screen flash overlay
   */
  drawFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.flash) return;
    
    const now = performance.now();
    const progress = (now - this.flash.startTime) / this.flash.duration;
    const alpha = this.flash.maxAlpha * (1 - progress);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.flash.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /**
   * Draw combo chain lightning
   */
  drawChains(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    
    for (const chain of this.chains) {
      const progress = (now - chain.startTime) / chain.duration;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = chain.color;
      ctx.lineWidth = chain.width * (1 - progress * 0.5);
      ctx.shadowColor = chain.color;
      ctx.shadowBlur = 10;
      
      // Draw lightning path with jitter
      ctx.beginPath();
      ctx.moveTo(chain.fromX, chain.fromY);
      
      const segments = 6;
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = chain.fromX + (chain.toX - chain.fromX) * t;
        const y = chain.fromY + (chain.toY - chain.fromY) * t;
        
        // Add jitter perpendicular to the line
        if (i < segments) {
          const dx = chain.toX - chain.fromX;
          const dy = chain.toY - chain.fromY;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / len;
          const ny = dx / len;
          const jitter = (Math.random() - 0.5) * 20 * (1 - progress);
          ctx.lineTo(x + nx * jitter, y + ny * jitter);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Draw background pulse effect
   */
  drawBackgroundPulse(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.bgPulse.intensity < 0.01) return;
    
    ctx.save();
    ctx.globalAlpha = this.bgPulse.intensity * 0.2;
    
    // Radial gradient from center
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    grad.addColorStop(0, this.bgPulse.color);
    grad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /**
   * Draw kill streak aura around the game area
   */
  drawStreakAura(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.streak.auraAlpha < 0.01) return;
    
    ctx.save();
    ctx.globalAlpha = this.streak.auraAlpha;
    ctx.strokeStyle = this.streak.auraColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = this.streak.auraColor;
    ctx.shadowBlur = 20;
    
    // Draw pulsing border
    const pulse = Math.sin(performance.now() * 0.005) * 0.2 + 0.8;
    ctx.globalAlpha *= pulse;
    
    ctx.strokeRect(5, 5, width - 10, height - 10);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  /**
   * Get current slow-motion factor (1.0 = normal speed)
   */
  getSlowMoFactor(): number {
    return this.slowMoFactor;
  }

  /**
   * Get current streak count
   */
  getStreakCount(): number {
    return this.streak.count;
  }

  /**
   * Get current background pulse intensity
   */
  getBgPulseIntensity(): number {
    return this.bgPulse.intensity;
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.flash = null;
    this.slowMo = null;
    this.slowMoFactor = 1.0;
    this.chains = [];
    this.bgPulse.intensity = 0;
    this.streak = { count: 0, lastKillTime: 0, auraAlpha: 0, auraColor: COLORS.normal };
  }
}
