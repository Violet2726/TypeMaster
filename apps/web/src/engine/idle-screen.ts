/**
 * Idle Screen System - 开场体验革命
 * 
 * Transforms the first impression with:
 * 1. Dynamic multi-layer particle background
 * 2. Title breathing animation with glow
 * 3. Menu items with keyboard indicators
 * 4. Floating ambient orbs
 * 5. Visual hierarchy optimization
 */

import { COLORS } from '../components/game/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackgroundParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  layer: number; // 0=far, 1=mid, 2=near
  phase: number;
}

interface AmbientOrb {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  alpha: number;
  speed: number;
  phase: number;
}

interface MenuItem {
  key: string;
  label: string;
  labelZh: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hoverProgress: number;
}

// ---------------------------------------------------------------------------
// Idle Screen Manager
// ---------------------------------------------------------------------------

export class IdleScreenManager {
  // Background particles
  private bgParticles: BackgroundParticle[] = [];
  private readonly BG_PARTICLE_COUNT = 80;
  
  // Ambient orbs
  private orbs: AmbientOrb[] = [];
  private readonly ORB_COUNT = 5;
  
  // Menu items
  private menuItems: MenuItem[] = [];
  private selectedMenuIndex = 0;
  
  // Animation state
  private titleGlow = 0;
  private titleScale = 1;
  private entranceProgress = 0;
  private entranceStartTime = 0;
  
  // Canvas dimensions
  private width = 800;
  private height = 600;

  constructor() {
    this.initParticles();
    this.initOrbs();
    this.initMenuItems();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  private initParticles(): void {
    this.bgParticles = [];
    for (let i = 0; i < this.BG_PARTICLE_COUNT; i++) {
      this.bgParticles.push(this.createParticle());
    }
  }

  private createParticle(): BackgroundParticle {
    const layer = Math.floor(Math.random() * 3);
    const speed = 0.2 + layer * 0.15;
    const size = 1 + layer * 0.8;
    
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size,
      alpha: 0.1 + layer * 0.15,
      color: layer === 0 ? '#4a9eff' : layer === 1 ? '#64b5f6' : '#90caf9',
      layer,
      phase: Math.random() * Math.PI * 2
    };
  }

  private initOrbs(): void {
    this.orbs = [];
    const orbColors = ['#4a9eff60', '#64b5f660', '#90caf960', '#42a5f560', '#2196f360'];
    
    for (let i = 0; i < this.ORB_COUNT; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.orbs.push({
        x,
        y,
        targetX: Math.random() * this.width,
        targetY: Math.random() * this.height,
        size: 80 + Math.random() * 120,
        color: orbColors[i % orbColors.length],
        alpha: 0.08 + Math.random() * 0.07,
        speed: 0.0003 + Math.random() * 0.0002,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private initMenuItems(): void {
    const items = [
      { key: 'ANY', label: 'Start Game', labelZh: '开始游戏', icon: '?' },
      { key: 'D', label: 'Daily Challenge', labelZh: '每日挑战', icon: '?' },
      { key: 'A', label: 'Achievements', labelZh: '成就', icon: '★' },
      { key: 'L', label: 'Leaderboard', labelZh: '排行榜', icon: '?' },
      { key: 'T', label: 'Themes', labelZh: '主题', icon: '◆' },
      { key: 'H', label: 'History', labelZh: '历史', icon: '?' }
    ];
    
    const itemWidth = 140;
    const itemHeight = 36;
    const gap = 12;
    const totalWidth = items.length * itemWidth + (items.length - 1) * gap;
    const startX = (this.width - totalWidth) / 2;
    const y = this.height / 2 + 80;
    
    this.menuItems = items.map((item, i) => ({
      ...item,
      x: startX + i * (itemWidth + gap),
      y,
      width: itemWidth,
      height: itemHeight,
      hoverProgress: 0
    }));
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initMenuItems();
  }

  startEntrance(): void {
    this.entranceStartTime = performance.now();
    this.entranceProgress = 0;
  }

  handleKey(key: string): string | null {
    // Navigate menu
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const dir = key === 'ArrowLeft' ? -1 : 1;
      this.selectedMenuIndex = (this.selectedMenuIndex + dir + this.menuItems.length) % this.menuItems.length;
      return null;
    }
    
    // Select menu item
    const item = this.menuItems[this.selectedMenuIndex];
    if (item) {
      return item.key;
    }
    return null;
  }

  update(dt: number): void {
    const now = performance.now();
    
    // Update entrance animation
    if (this.entranceStartTime > 0) {
      this.entranceProgress = Math.min(1, (now - this.entranceStartTime) / 1200);
    }
    
    // Update title glow
    this.titleGlow = Math.sin(now * 0.002) * 0.3 + 0.7;
    this.titleScale = 1 + Math.sin(now * 0.0015) * 0.02;
    
    // Update background particles
    for (const p of this.bgParticles) {
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;
      
      // Breathing alpha
      p.alpha = (0.1 + p.layer * 0.15) * (0.8 + Math.sin(now * 0.001 + p.phase) * 0.2);
    }
    
    // Update ambient orbs
    for (const orb of this.orbs) {
      // Move toward target
      const dx = orb.targetX - orb.x;
      const dy = orb.targetY - orb.y;
      orb.x += dx * orb.speed * dt * 60;
      orb.y += dy * orb.speed * dt * 60;
      
      // Pick new target when close
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        orb.targetX = Math.random() * this.width;
        orb.targetY = Math.random() * this.height;
      }
      
      // Breathing
      orb.alpha = (0.08 + Math.sin(now * 0.0008 + orb.phase) * 0.03);
    }
    
    // Update menu hover
    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      const isSelected = i === this.selectedMenuIndex;
      const target = isSelected ? 1 : 0;
      item.hoverProgress += (target - item.hoverProgress) * 0.15;
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const { width: w, height: h } = this;
    
    // Draw background particles (far layer first)
    for (let layer = 0; layer < 3; layer++) {
      for (const p of this.bgParticles) {
        if (p.layer !== layer) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha * this.easeInOut(this.entranceProgress);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Draw ambient orbs
    for (const orb of this.orbs) {
      ctx.save();
      ctx.globalAlpha = orb.alpha * this.easeInOut(this.entranceProgress);
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
      grad.addColorStop(0, orb.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Draw title with entrance animation
    this.drawTitle(ctx, w, h, time);
    
    // Draw menu items
    this.drawMenuItems(ctx, w, h, time);
    
    // Draw keyboard hints
    this.drawKeyboardHints(ctx, w, h);
  }

  private drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const entrance = this.easeOutBack(this.entranceProgress);
    if (entrance < 0.01) return;
    
    ctx.save();
    ctx.translate(w / 2, h / 2 - 60);
    ctx.scale(entrance * this.titleScale, entrance * this.titleScale);
    ctx.globalAlpha = entrance;
    
    // Title glow
    ctx.shadowColor = '#4a9eff';
    ctx.shadowBlur = 20 * this.titleGlow;
    
    // Title text
    ctx.font = '700 56px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TYPING RAID', 0, 0);
    
    // Subtitle
    ctx.shadowBlur = 0;
    ctx.font = '400 18px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.globalAlpha = entrance * 0.8;
    ctx.fillText('Master the keys, defeat the swarm', 0, 40);
    
    ctx.restore();
  }

  private drawMenuItems(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.3));
    if (entrance < 0.01) return;
    
    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      const isSelected = i === this.selectedMenuIndex;
      
      ctx.save();
      ctx.globalAlpha = entrance;
      
      // Hover scale
      const scale = 1 + item.hoverProgress * 0.05;
      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(item.x + item.width / 2), -(item.y + item.height / 2));
      
      // Background
      const alpha = 0.1 + item.hoverProgress * 0.15;
      ctx.fillStyle = `rgba(74, 158, 255, ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(item.x, item.y, item.width, item.height, 8);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = `rgba(74, 158, 255, ${0.2 + item.hoverProgress * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Key badge
      const badgeSize = 20;
      const badgeX = item.x + 8;
      const badgeY = item.y + (item.height - badgeSize) / 2;
      
      ctx.fillStyle = isSelected ? '#4a9eff' : 'rgba(74, 158, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 4);
      ctx.fill();
      
      ctx.font = '600 11px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = isSelected ? '#ffffff' : COLORS.textSecondary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.key, badgeX + badgeSize / 2, badgeY + badgeSize / 2);
      
      // Label
      ctx.font = '500 12px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.text : COLORS.textSecondary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.labelZh, badgeX + badgeSize + 8, item.y + item.height / 2);
      
      ctx.restore();
    }
  }

  private drawKeyboardHints(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.6));
    if (entrance < 0.01) return;
    
    ctx.save();
    ctx.globalAlpha = entrance * 0.6;
    ctx.font = '400 11px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('← → 导航   Enter 选择   任意键开始', w / 2, h - 30);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Easing functions
  // ---------------------------------------------------------------------------

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  getSelectedKey(): string | null {
    const item = this.menuItems[this.selectedMenuIndex];
    return item ? item.key : null;
  }

  reset(): void {
    this.selectedMenuIndex = 0;
    this.entranceProgress = 0;
    this.entranceStartTime = 0;
  }
}
