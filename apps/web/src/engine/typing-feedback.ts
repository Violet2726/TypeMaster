/**
 * Typing Feedback System - ´ò×Ö½»»¥¸ïÃü
 * 
 * Transforms the core typing experience with:
 * 1. Character pop animation (scale + glow on each keystroke)
 * 2. Word completion burst (satisfying particle explosion)
 * 3. Typing rhythm pulse (UI responds to typing speed)
 * 4. Error shake (word shakes on wrong key)
 * 5. Auto-target highlight (glowing line to active enemy)
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CharAnimState {
  char: string;
  index: number;
  startTime: number;
  scale: number;
  glow: number;
  color: string;
}

interface ShakeState {
  startTime: number;
  intensity: number;
  duration: number;
}

interface CompletionBurst {
  x: number;
  y: number;
  startTime: number;
  color: string;
  word: string;
}

interface RhythmPulse {
  lastTypeTime: number;
  bpm: number;
  intensity: number;
}

// ---------------------------------------------------------------------------
// Typing Feedback Manager
// ---------------------------------------------------------------------------

export class TypingFeedbackManager {
  // Character animations per enemy
  private charAnims: Map<string, CharAnimState[]> = new Map();
  
  // Shake states per enemy
  private shakes: Map<string, ShakeState> = new Map();
  
  // Completion bursts
  private bursts: CompletionBurst[] = [];
  
  // Rhythm tracking
  private rhythm: RhythmPulse = {
    lastTypeTime: 0,
    bpm: 0,
    intensity: 0
  };
  
  // Timing constants
  private readonly CHAR_POP_DURATION = 300; // ms
  private readonly CHAR_POP_SCALE = 1.4;
  private readonly SHAKE_DURATION = 200; // ms
  private readonly SHAKE_INTENSITY = 4;
  private readonly BURST_DURATION = 600; // ms
  private readonly RHYTHM_DECAY = 0.95;
  private readonly RHYTHM_WINDOW = 2000; // ms for BPM calculation
  
  // BPM history for smooth calculation
  private typeTimes: number[] = [];

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Called when a character is typed correctly
   */
  onCharCorrect(enemyId: string, charIndex: number, char: string, x: number, y: number): void {
    const now = performance.now();
    
    // Add character animation
    const anims = this.charAnims.get(enemyId) || [];
    anims.push({
      char,
      index: charIndex,
      startTime: now,
      scale: this.CHAR_POP_SCALE,
      glow: 1.0,
      color: COLORS.success
    });
    this.charAnims.set(enemyId, anims);
    
    // Update rhythm
    this.updateRhythm(now);
  }

  /**
   * Called when a character is typed incorrectly
   */
  onCharError(enemyId: string, x: number, y: number): void {
    const now = performance.now();
    
    // Trigger shake
    this.shakes.set(enemyId, {
      startTime: now,
      intensity: this.SHAKE_INTENSITY,
      duration: this.SHAKE_DURATION
    });
  }

  /**
   * Called when a word is completed (enemy killed)
   */
  onWordComplete(enemyId: string, word: string, x: number, y: number, color: string): void {
    // Add completion burst
    this.bursts.push({
      x,
      y,
      startTime: performance.now(),
      color,
      word
    });
    
    // Clear char anims for this enemy
    this.charAnims.delete(enemyId);
    this.shakes.delete(enemyId);
  }

  /**
   * Update all animations
   */
  update(dt: number): void {
    const now = performance.now();
    
    // Update character animations
    for (const [enemyId, anims] of this.charAnims) {
      const active = anims.filter(a => now - a.startTime < this.CHAR_POP_DURATION);
      if (active.length === 0) {
        this.charAnims.delete(enemyId);
      } else {
        this.charAnims.set(enemyId, active);
      }
    }
    
    // Update shakes
    for (const [enemyId, shake] of this.shakes) {
      if (now - shake.startTime > shake.duration) {
        this.shakes.delete(enemyId);
      }
    }
    
    // Update bursts
    this.bursts = this.bursts.filter(b => now - b.startTime < this.BURST_DURATION);
    
    // Decay rhythm intensity
    this.rhythm.intensity *= this.RHYTHM_DECAY;
    
    // Clean old type times
    const windowStart = now - this.RHYTHM_WINDOW;
    this.typeTimes = this.typeTimes.filter(t => t > windowStart);
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /**
   * Draw word with character animations
   */
  drawWord(
    ctx: CanvasRenderingContext2D,
    enemyId: string,
    word: string,
    typed: string,
    x: number,
    y: number,
    fontSize: number = 13
  ): void {
    const now = performance.now();
    const shake = this.shakes.get(enemyId);
    const charAnims = this.charAnims.get(enemyId) || [];
    
    ctx.save();
    ctx.translate(x, y);
    
    // Apply shake offset
    if (shake) {
      const progress = (now - shake.startTime) / shake.duration;
      const shakeAmount = shake.intensity * (1 - progress);
      ctx.translate(
        (Math.random() - 0.5) * shakeAmount * 2,
        (Math.random() - 0.5) * shakeAmount * 2
      );
    }
    
    ctx.font = `600 ${fontSize}px -apple-system, SF Pro Text, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Measure full word width for centering
    const fullWidth = ctx.measureText(word).width;
    const startX = -fullWidth / 2;
    
    let currentX = startX;
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const charWidth = ctx.measureText(char).width;
      
      if (i < typed.length) {
        // Typed character - check for pop animation
        const anim = charAnims.find(a => a.index === i);
        
        if (anim) {
          const progress = (now - anim.startTime) / this.CHAR_POP_DURATION;
          const scale = 1 + (this.CHAR_POP_SCALE - 1) * (1 - progress);
          const glow = 1 - progress;
          
          ctx.save();
          ctx.translate(currentX + charWidth / 2, fontSize / 2);
          ctx.scale(scale, scale);
          ctx.translate(-(currentX + charWidth / 2), -(fontSize / 2));
          
          // Glow effect
          ctx.fillStyle = COLORS.success;
          ctx.shadowColor = COLORS.success;
          ctx.shadowBlur = 12 * glow;
          ctx.textAlign = 'left';
          ctx.fillText(char, currentX, 0);
          
          ctx.restore();
        } else {
          // Static typed character
          ctx.fillStyle = COLORS.success;
          ctx.textAlign = 'left';
          ctx.fillText(char, currentX, 0);
        }
      } else {
        // Untyped character
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = 'left';
        ctx.fillText(char, currentX, 0);
      }
      
      currentX += charWidth;
    }
    
    ctx.restore();
  }

  /**
   * Draw completion burst effect
   */
  drawBursts(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();
    
    for (const burst of this.bursts) {
      const progress = (now - burst.startTime) / this.BURST_DURATION;
      const alpha = 1 - progress;
      const scale = 1 + progress * 0.5;
      
      ctx.save();
      ctx.translate(burst.x, burst.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      
      // Expanding ring
      ctx.strokeStyle = burst.color;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(0, 0, 30 * progress, 0, Math.PI * 2);
      ctx.stroke();
      
      // Word flash
      ctx.font = '700 24px -apple-system, SF Pro Display, system-ui, sans-serif';
      ctx.fillStyle = burst.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillText(burst.word, 0, -20 * progress);
      
      ctx.restore();
    }
  }

  /**
   * Draw rhythm pulse overlay
   */
  drawRhythmPulse(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.rhythm.intensity < 0.1) return;
    
    const alpha = this.rhythm.intensity * 0.15;
    
    // Subtle border pulse
    ctx.save();
    ctx.strokeStyle = COLORS.success;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha;
    ctx.strokeRect(0, 0, width, height);
    ctx.restore();
  }

  /**
   * Draw auto-target highlight line
   */
  drawTargetLine(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    progress: number
  ): void {
    const now = performance.now();
    const pulse = Math.sin(now * 0.005) * 0.2 + 0.8;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3 * pulse;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -now * 0.02;
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private updateRhythm(now: number): void {
    this.typeTimes.push(now);
    
    // Calculate BPM from recent typing
    if (this.typeTimes.length >= 2) {
      const recentTimes = this.typeTimes.slice(-10);
      const intervals = [];
      for (let i = 1; i < recentTimes.length; i++) {
        intervals.push(recentTimes[i] - recentTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      this.rhythm.bpm = 60000 / avgInterval;
      this.rhythm.intensity = Math.min(1, this.rhythm.bpm / 120); // Normalize to 120 BPM
    }
    
    this.rhythm.lastTypeTime = now;
  }

  /**
   * Get current rhythm intensity (0-1)
   */
  getRhythmIntensity(): number {
    return this.rhythm.intensity;
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.charAnims.clear();
    this.shakes.clear();
    this.bursts = [];
    this.typeTimes = [];
    this.rhythm = { lastTypeTime: 0, bpm: 0, intensity: 0 };
  }
}
