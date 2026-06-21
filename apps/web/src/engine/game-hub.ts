/**
 * Typing Raid Game Hub - Apple 风格中央指挥中心
 * 
 * 设计理念：
 * - 干净、极简的 Apple 美学
 * - 毛玻璃效果和流畅动画
 * - 清晰的信息层级
 * - 触摸友好，响应式设计
 * - 无障碍访问支持
 * 
 * 核心功能：
 * 1. 玩家进度展示（等级、经验值、排名）
 * 2. 每日挑战突出显示
 * 3. 游戏模式卡片预览
 * 4. 排行榜亮点
 * 5. 成就展示
 * 6. 设置访问
 * 7. 流畅的过渡动画
 */

import { COLORS } from '../components/game/colors';
import { getAllChallengeModes } from '@typemaster/domain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerStats {
  rank: string;
  rankZh: string;
  level: number;
  xp: number;
  xpToNext: number;
  totalGames: number;
  bestScore: number;
  bestWpm: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

interface DailyChallenge {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  color: string;
  progress: number;
  target: number;
  completed: boolean;
  reward?: string;
}

interface GameModeCard {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  color: string;
  gradient: string;
  unlocked: boolean;
  bestScore?: number;
  key: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  wave: number;
  isPlayer?: boolean;
}

interface AchievementPreview {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface HubSection {
  id: string;
  label: string;
  labelZh: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hoverProgress: number;
  selected: boolean;
}

interface BackgroundLayer {
  particles: BackgroundParticle[];
  orbs: AmbientOrb[];
  gridLines: GridLine[];
}

interface BackgroundParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  layer: number;
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

interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  speed: number;
}

// ---------------------------------------------------------------------------
// Game Hub Manager
// ---------------------------------------------------------------------------

export class GameHubManager {
  // Background layers
  private bg: BackgroundLayer = { particles: [], orbs: [], gridLines: [] };
  private readonly BG_PARTICLE_COUNT = 60;
  private readonly ORB_COUNT = 4;
  private readonly GRID_LINE_COUNT = 8;

  // Hub sections
  private sections: HubSection[] = [];
  private selectedSectionIndex = 0;
  private sectionTransitionProgress = 0;

  // Player stats
  private playerStats: PlayerStats | null = null;

  // Daily challenge
  private dailyChallenge: DailyChallenge | null = null;

  // Game modes
  private gameModes: GameModeCard[] = [];

  // Leaderboard
  private leaderboard: LeaderboardEntry[] = [];

  // Achievements preview
  private achievementsPreview: AchievementPreview[] = [];

  // Animation state
  private entranceProgress = 0;
  private entranceStartTime = 0;
  private titleGlow = 0;
  private titleScale = 1;
  private sectionGlow = 0;

  // Canvas dimensions
  private width = 800;
  private height = 600;

  // Current time
  private currentTime = 0;

  // Interaction state
  private mouseX = 0;
  private mouseY = 0;
  private isMouseOver = false;

  // Challenge selection state
  private showChallengeSelection = false;
  private challengeSelectionIndex = 0;
  private challengeList: any[] = [];

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  constructor() {
    this.initializeBackground();
    this.initializeSections();
    this.initializeMockData();
  }

  private initializeBackground(): void {
    // Particles
    for (let i = 0; i < this.BG_PARTICLE_COUNT; i++) {
      this.bg.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.15 + 0.05,
        color: COLORS.normal,
        layer: Math.floor(Math.random() * 3),
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Ambient orbs
    for (let i = 0; i < this.ORB_COUNT; i++) {
      this.bg.orbs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        targetX: Math.random() * this.width,
        targetY: Math.random() * this.height,
        size: Math.random() * 150 + 100,
        color: i % 2 === 0 ? 'rgba(74, 158, 255, 0.08)' : 'rgba(168, 85, 247, 0.08)',
        alpha: 0,
        speed: Math.random() * 0.0005 + 0.0003,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Grid lines
    for (let i = 0; i < this.GRID_LINE_COUNT; i++) {
      const isHorizontal = Math.random() > 0.5;
      this.bg.gridLines.push({
        x1: isHorizontal ? 0 : Math.random() * this.width,
        y1: isHorizontal ? Math.random() * this.height : 0,
        x2: isHorizontal ? this.width : Math.random() * this.width,
        y2: isHorizontal ? Math.random() * this.height : this.height,
        alpha: Math.random() * 0.03 + 0.01,
        speed: Math.random() * 0.0002 + 0.0001,
      });
    }
  }

  private initializeSections(): void {
    this.sections = [
      {
        id: 'play',
        label: 'Play',
        labelZh: '开始游戏',
        icon: '▶',
        x: 0, y: 0, width: 0, height: 0,
        hoverProgress: 0,
        selected: true,
      },
      {
        id: 'challenge',
        label: 'Daily Challenge',
        labelZh: '每日挑战',
        icon: '🎯',
        x: 0, y: 0, width: 0, height: 0,
        hoverProgress: 0,
        selected: false,
      },
      {
        id: 'modes',
        label: 'Game Modes',
        labelZh: '游戏模式',
        icon: '🎮',
        x: 0, y: 0, width: 0, height: 0,
        hoverProgress: 0,
        selected: false,
      },
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        labelZh: '排行榜',
        icon: '🏆',
        x: 0, y: 0, width: 0, height: 0,
        hoverProgress: 0,
        selected: false,
      },
      {
        id: 'achievements',
        label: 'Achievements',
        labelZh: '成就',
        icon: '⭐',
        x: 0, y: 0, width: 0, height: 0,
        hoverProgress: 0,
        selected: false,
      },
      {
        id: 'settings',
        label: 'Settings',
        labelZh: '设置',
        icon: '⚙️',
        x: 0, y: 0, width: 0, height: 0,
        hoverProgress: 0,
        selected: false,
      },
    ];
  }

  private initializeMockData(): void {
    // Player stats
    this.playerStats = {
      rank: 'Typist',
      rankZh: '打字员',
      level: 5,
      xp: 1250,
      xpToNext: 2000,
      totalGames: 42,
      bestScore: 15800,
      bestWpm: 85,
      achievementsUnlocked: 12,
      totalAchievements: 35,
    };

    // Daily challenge
    const challenges = getAllChallengeModes();
    if (challenges.length > 0) {
      const today = new Date();
      const dayIndex = today.getDate() % challenges.length;
      const challenge = challenges[dayIndex];
      this.dailyChallenge = {
        id: challenge.id,
        name: challenge.name,
        nameZh: challenge.nameZh,
        description: challenge.description,
        descriptionZh: challenge.descriptionZh,
        icon: '🎯',
        color: challenge.color,
        progress: 0,
        target: 10,
        completed: false,
      };
    }

    // Game modes
    this.gameModes = [
      {
        id: 'classic',
        name: 'Classic',
        nameZh: '经典模式',
        description: 'Complete waves to progress',
        descriptionZh: '完成波次以推进',
        icon: '⚔️',
        color: '#3b9eff',
        gradient: 'linear-gradient(135deg, #3b9eff 0%, #007aff 100%)',
        unlocked: true,
        bestScore: 15800,
        key: 'any',
      },
      {
        id: 'endless',
        name: 'Endless',
        nameZh: '无尽模式',
        description: 'Survive as long as possible',
        descriptionZh: '尽可能存活',
        icon: '∞',
        color: '#ff9f0a',
        gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ff6b00 100%)',
        unlocked: true,
        bestScore: 8500,
        key: 'E',
      },
      {
        id: 'timeAttack',
        name: 'Time Attack',
        nameZh: '限时挑战',
        description: 'Race against the clock',
        descriptionZh: '与时间赛跑',
        icon: '⏱️',
        color: '#ff3b5c',
        gradient: 'linear-gradient(135deg, #ff3b5c 0%, #ff2d55 100%)',
        unlocked: true,
        bestScore: 12500,
        key: 'T',
      },
      {
        id: 'zen',
        name: 'Zen',
        nameZh: '禅模式',
        description: 'Practice without pressure',
        descriptionZh: '无压力练习',
        icon: '🧘',
        color: '#34c759',
        gradient: 'linear-gradient(135deg, #34c759 0%, #30d158 100%)',
        unlocked: true,
        key: 'Z',
      },
      {
        id: 'challenge',
        name: 'Challenges',
        nameZh: '挑战模式',
        description: 'Test specific skills',
        descriptionZh: '测试特定技能',
        icon: '🎯',
        color: '#bf5af2',
        gradient: 'linear-gradient(135deg, #bf5af2 0%, #9b59b6 100%)',
        unlocked: true,
        key: 'C',
      },
    ];

    // Leaderboard
    this.leaderboard = [
      { rank: 1, name: 'Player 1', score: 25800, wave: 15 },
      { rank: 2, name: 'Player 2', score: 22500, wave: 14 },
      { rank: 3, name: 'Player 3', score: 19200, wave: 13 },
      { rank: 4, name: 'You', score: 15800, wave: 12, isPlayer: true },
      { rank: 5, name: 'Player 5', score: 14500, wave: 11 },
    ];

    // Achievements preview
    this.achievementsPreview = [
      { id: 'first_blood', name: 'First Blood', nameZh: '首次击杀', icon: '⚔️', unlocked: true, rarity: 'common' },
      { id: 'combo_master', name: 'Combo Master', nameZh: '连击大师', icon: '🔥', unlocked: true, rarity: 'rare' },
      { id: 'speed_demon', name: 'Speed Demon', nameZh: '速度恶魔', icon: '⚡', unlocked: false, rarity: 'epic' },
      { id: 'perfect_wave', name: 'Perfect Wave', nameZh: '完美波次', icon: '✨', unlocked: false, rarity: 'legendary' },
    ];
  }

  // ---------------------------------------------------------------------------
  // Resize handler
  // ---------------------------------------------------------------------------

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.recalculateLayout();
  }

  private recalculateLayout(): void {
    const w = this.width;
    const h = this.height;
    const isMobile = w < 768;

    // Section dimensions
    const sectionWidth = isMobile ? w - 40 : Math.min(280, (w - 80) / 3);
    const sectionHeight = isMobile ? 60 : 80;
    const gap = isMobile ? 12 : 16;

    // Calculate section positions
    const startX = isMobile ? 20 : (w - (sectionWidth * 3 + gap * 2)) / 2;
    const startY = isMobile ? h - (sectionHeight * 6 + gap * 5) - 20 : h - sectionHeight - 30;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (isMobile) {
        section.x = startX;
        section.y = startY + i * (sectionHeight + gap);
        section.width = sectionWidth;
        section.height = sectionHeight;
      } else {
        // Desktop: horizontal layout at bottom
        section.x = startX + i * (sectionWidth + gap);
        section.y = startY;
        section.width = sectionWidth;
        section.height = sectionHeight;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Update logic
  // ---------------------------------------------------------------------------

  update(dt: number, time: number): void {
    this.currentTime = time;

    // Entrance animation
    if (this.entranceStartTime === 0) {
      this.entranceStartTime = time;
    }
    this.entranceProgress = Math.min(1, (time - this.entranceStartTime) / 1500);

    // Update background
    this.updateBackground(dt, time);

    // Update sections
    this.updateSections(dt, time);

    // Update title animation
    this.titleGlow = (Math.sin(time * 0.002) + 1) / 2;
    this.titleScale = 1 + Math.sin(time * 0.001) * 0.02;
    this.sectionGlow = (Math.sin(time * 0.003) + 1) / 2;
  }

  private updateBackground(dt: number, time: number): void {
    // Update particles
    for (const p of this.bg.particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      // Wrap around
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Breathing alpha
      p.alpha = (0.05 + Math.sin(time * 0.001 + p.phase) * 0.03);
    }

    // Update orbs
    for (const orb of this.bg.orbs) {
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
      orb.alpha = (0.06 + Math.sin(time * 0.0008 + orb.phase) * 0.03);
    }

    // Update grid lines
    for (const line of this.bg.gridLines) {
      line.alpha = (0.01 + Math.sin(time * line.speed + line.x1) * 0.01);
    }
  }

  private updateSections(dt: number, time: number): void {
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const isSelected = i === this.selectedSectionIndex;
      const target = isSelected ? 1 : 0;
      section.hoverProgress += (target - section.hoverProgress) * 0.15;
      section.selected = isSelected;
    }
  }

  // ---------------------------------------------------------------------------
  // Render logic
  // ---------------------------------------------------------------------------

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;

    const time = this.currentTime;

    // Draw background
    this.drawBackground(ctx, time);

    // Draw title
    this.drawTitle(ctx, width, height, time);

    // Draw player stats
    this.drawPlayerStats(ctx, width, height, time);

    // Draw daily challenge
    this.drawDailyChallenge(ctx, width, height, time);

    // Draw game modes preview
    this.drawGameModesPreview(ctx, width, height, time);

    // Draw sections
    this.drawSections(ctx, width, height, time);

    // Draw footer hints
    this.drawFooterHints(ctx, width, height, time);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, COLORS.bgGradientStart);
    grad.addColorStop(1, COLORS.bgGradientEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid lines
    ctx.save();
    for (const line of this.bg.gridLines) {
      ctx.globalAlpha = line.alpha * this.easeInOut(this.entranceProgress);
      ctx.strokeStyle = 'rgba(74, 158, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    }
    ctx.restore();

    // Particles
    for (let layer = 0; layer < 3; layer++) {
      for (const p of this.bg.particles) {
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

    // Ambient orbs
    for (const orb of this.bg.orbs) {
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
  }

  private drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const entrance = this.easeOutBack(this.entranceProgress);
    if (entrance < 0.01) return;

    ctx.save();
    ctx.translate(w / 2, 60);
    ctx.scale(entrance * this.titleScale, entrance * this.titleScale);
    ctx.globalAlpha = entrance;

    // Title glow
    ctx.shadowColor = '#4a9eff';
    ctx.shadowBlur = 30 * this.titleGlow;

    // Title text
    ctx.font = '700 48px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TYPING RAID', 0, 0);

    // Subtitle
    ctx.shadowBlur = 0;
    ctx.font = '400 16px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.globalAlpha = entrance * 0.8;
    ctx.fillText('Master the keys, defeat the swarm', 0, 35);

    ctx.restore();
  }

  private drawPlayerStats(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!this.playerStats) return;

    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.2));
    if (entrance < 0.01) return;

    const isMobile = w < 768;
    const cardWidth = isMobile ? w - 40 : 300;
    const cardHeight = isMobile ? 100 : 120;
    const cardX = isMobile ? 20 : w - cardWidth - 20;
    const cardY = isMobile ? 120 : 20;

    ctx.save();
    ctx.globalAlpha = entrance;

    // Glass card
    this.drawGlassCard(ctx, cardX, cardY, cardWidth, cardHeight, 16);

    // Rank badge
    const badgeSize = 40;
    const badgeX = cardX + 16;
    const badgeY = cardY + 16;

    ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 8);
    ctx.fill();

    ctx.font = '600 18px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.playerStats.rankZh, badgeX + badgeSize / 2, badgeY + badgeSize / 2);

    // Level and XP
    ctx.font = '600 14px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText('Lv.' + this.playerStats.level, badgeX + badgeSize + 12, badgeY + 12);

    // XP bar
    const xpBarWidth = cardWidth - badgeSize - 50;
    const xpBarHeight = 6;
    const xpBarX = badgeX + badgeSize + 12;
    const xpBarY = badgeY + 30;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 3);
    ctx.fill();

    const xpProgress = this.playerStats.xp / this.playerStats.xpToNext;
    const xpGrad = ctx.createLinearGradient(xpBarX, 0, xpBarX + xpBarWidth * xpProgress, 0);
    xpGrad.addColorStop(0, '#3b9eff');
    xpGrad.addColorStop(1, '#007aff');
    ctx.fillStyle = xpGrad;
    ctx.beginPath();
    ctx.roundRect(xpBarX, xpBarY, xpBarWidth * xpProgress, xpBarHeight, 3);
    ctx.fill();

    // Stats row
    const statsY = badgeY + badgeSize + 16;
    const stats = [
      { label: '游戏', value: this.playerStats.totalGames },
      { label: '最高分', value: this.playerStats.bestScore },
      { label: 'WPM', value: this.playerStats.bestWpm },
      { label: '成就', value: this.playerStats.achievementsUnlocked + '/' + this.playerStats.totalAchievements },
    ];

    const statWidth = (cardWidth - 32) / stats.length;
    for (let i = 0; i < stats.length; i++) {
      const statX = cardX + 16 + i * statWidth;
      ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textSecondary;
      ctx.textAlign = 'center';
      ctx.fillText(stats[i].label, statX + statWidth / 2, statsY);

      ctx.font = '600 14px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.fillText(String(stats[i].value), statX + statWidth / 2, statsY + 16);
    }

    ctx.restore();
  }

  private drawDailyChallenge(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!this.dailyChallenge) return;

    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.3));
    if (entrance < 0.01) return;

    const isMobile = w < 768;
    const cardWidth = isMobile ? w - 40 : 320;
    const cardHeight = isMobile ? 80 : 100;
    const cardX = isMobile ? 20 : w - cardWidth - 20;
    const cardY = isMobile ? 230 : 160;

    ctx.save();
    ctx.globalAlpha = entrance;

    // Glass card with color accent
    this.drawGlassCard(ctx, cardX, cardY, cardWidth, cardHeight, 16);
    this.drawColorAccent(ctx, cardX, cardY, cardHeight, this.dailyChallenge.color);

    // Icon
    ctx.font = '24px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.dailyChallenge.icon, cardX + 32, cardY + cardHeight / 2);

    // Title
    ctx.font = '600 16px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(this.dailyChallenge.nameZh, cardX + 60, cardY + 24);

    // Description
    ctx.font = '400 12px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText(this.dailyChallenge.descriptionZh, cardX + 60, cardY + 44);

    // Progress
    const progressWidth = cardWidth - 80;
    const progressHeight = 4;
    const progressX = cardX + 60;
    const progressY = cardY + 60;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 2);
    ctx.fill();

    const progress = this.dailyChallenge.progress / this.dailyChallenge.target;
    ctx.fillStyle = this.dailyChallenge.color;
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth * progress, progressHeight, 2);
    ctx.fill();

    // Progress text
    ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = 'right';
    ctx.fillText(this.dailyChallenge.progress + '/' + this.dailyChallenge.target, cardX + cardWidth - 16, cardY + 44);

    ctx.restore();
  }

  private drawGameModesPreview(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.4));
    if (entrance < 0.01) return;

    const isMobile = w < 768;
    const previewCount = isMobile ? 2 : 4;
    const cardWidth = isMobile ? (w - 60) / 2 : 120;
    const cardHeight = isMobile ? 70 : 80;
    const gap = isMobile ? 10 : 12;
    const startX = isMobile ? 20 : (w - (cardWidth * previewCount + gap * (previewCount - 1))) / 2;
    const startY = isMobile ? 320 : 160;

    ctx.save();
    ctx.globalAlpha = entrance;

    for (let i = 0; i < Math.min(previewCount, this.gameModes.length); i++) {
      const mode = this.gameModes[i];
      const cardX = startX + i * (cardWidth + gap);
      const cardY = startY;

      // Glass card
      this.drawGlassCard(ctx, cardX, cardY, cardWidth, cardHeight, 12);

      // Color accent
      this.drawColorAccent(ctx, cardX, cardY, cardHeight, mode.color);

      // Icon
      ctx.font = '24px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mode.icon, cardX + cardWidth / 2, cardY + 28);

      // Name
      ctx.font = '600 12px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.fillText(mode.nameZh, cardX + cardWidth / 2, cardY + 52);

      // Best score
      if (mode.bestScore) {
        ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
        ctx.fillStyle = COLORS.textSecondary;
        ctx.fillText('最高: ' + mode.bestScore, cardX + cardWidth / 2, cardY + 66);
      }
    }

    ctx.restore();
  }

  private drawSections(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.5));
    if (entrance < 0.01) return;

    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const isSelected = section.selected;

      ctx.save();
      ctx.globalAlpha = entrance;

      // Hover scale
      const scale = 1 + section.hoverProgress * 0.08;
      ctx.translate(section.x + section.width / 2, section.y + section.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(section.x + section.width / 2), -(section.y + section.height / 2));

      // Glass card
      this.drawGlassCard(ctx, section.x, section.y, section.width, section.height, 12);

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(section.x, section.y, section.width, section.height, 12);
        ctx.stroke();

        // Glow effect
        ctx.shadowColor = '#4a9eff';
        ctx.shadowBlur = 20 * this.sectionGlow;
        ctx.beginPath();
        ctx.roundRect(section.x, section.y, section.width, section.height, 12);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Icon
      ctx.font = '20px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(section.icon, section.x + 24, section.y + section.height / 2);

      // Label
      ctx.font = '500 14px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.text : COLORS.textSecondary;
      ctx.textAlign = 'left';
      ctx.fillText(section.labelZh, section.x + 48, section.y + section.height / 2);

      // Keyboard shortcut
      ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textTertiary;
      ctx.textAlign = 'right';
      const shortcut = this.getSectionShortcut(section.id);
      ctx.fillText(shortcut, section.x + section.width - 16, section.y + section.height / 2);

      ctx.restore();
    }
  }

  private drawFooterHints(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const entrance = this.easeOutBack(Math.max(0, this.entranceProgress - 0.7));
    if (entrance < 0.01) return;

    const isMobile = w < 768;
    const hintY = isMobile ? h - 20 : h - 30;

    ctx.save();
    ctx.globalAlpha = entrance * 0.6;
    ctx.font = '400 11px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('← → 导航   Enter 选择   任意键开始', w / 2, hintY);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Helper: Draw glass card
  // ---------------------------------------------------------------------------

  private drawGlassCard(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    // Background
    ctx.fillStyle = COLORS.glassBg;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();

    // Border
    ctx.strokeStyle = COLORS.glassBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight
    ctx.strokeStyle = COLORS.glassHighlight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + radius, y + 1);
    ctx.lineTo(x + width - radius, y + 1);
    ctx.stroke();
  }

  // ---------------------------------------------------------------------------
  // Helper: Draw color accent
  // ---------------------------------------------------------------------------

  private drawColorAccent(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, color: string): void {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.roundRect(x, y, 4, height, [4, 0, 0, 4]);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------------------
  // Helper: Get section shortcut
  // ---------------------------------------------------------------------------
  private getSectionShortcut(sectionId: string): string {
    switch (sectionId) {
      case 'play': return '任意键';
      case 'challenge': return 'D';
      case 'modes': return 'M';
      case 'leaderboard': return 'L';
      case 'achievements': return 'A';
      case 'settings': return 'S';
      default: return '';
    }
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
  // Input handling
  // ---------------------------------------------------------------------------
  handleKey(key: string): string | null {
    switch (key) {
      case 'ArrowLeft':
        this.selectedSectionIndex = Math.max(0, this.selectedSectionIndex - 1);
        return null;
      case 'ArrowRight':
        this.selectedSectionIndex = Math.min(this.sections.length - 1, this.selectedSectionIndex + 1);
        return null;
      case 'Enter':
        return this.sections[this.selectedSectionIndex].id;
      case 'd':
      case 'D':
        return 'challenge';
      case 'm':
      case 'M':
        return 'modes';
      case 'l':
      case 'L':
        return 'leaderboard';
      case 'a':
      case 'A':
        return 'achievements';
      case 's':
      case 'S':
        return 'settings';
      default:
        // Any other key starts classic mode
        return 'play';
    }
  }
  // ---------------------------------------------------------------------------
  // Mouse interaction
  // ---------------------------------------------------------------------------
  handleMouseMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.isMouseOver = true;
    // Update selected section based on mouse position
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (x >= section.x && x <= section.x + section.width &&
          y >= section.y && y <= section.y + section.height) {
        this.selectedSectionIndex = i;
        break;
      }
    }
  }
  handleClick(x: number, y: number): string | null {
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      if (x >= section.x && x <= section.x + section.width &&
          y >= section.y && y <= section.y + section.height) {
        return section.id;
      }
    }
    return null;
  }
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  getSelectedSection(): string {
    return this.sections[this.selectedSectionIndex].id;
  }
  reset(): void {
    this.selectedSectionIndex = 0;
    this.entranceProgress = 0;
    this.entranceStartTime = 0;
  }
  updatePlayerStats(stats: Partial<PlayerStats>): void {
    if (this.playerStats) {
      Object.assign(this.playerStats, stats);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Challenge selection rendering
  // ---------------------------------------------------------------------------

  private drawChallengeSelection(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    if (!this.showChallengeSelection) return;

    // Overlay background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    // Challenge selection panel
    const panelWidth = Math.min(500, w - 40);
    const panelHeight = Math.min(400, h - 80);
    const panelX = (w - panelWidth) / 2;
    const panelY = (h - panelHeight) / 2;

    this.drawGlassCard(ctx, panelX, panelY, panelWidth, panelHeight, 20);

    // Title
    ctx.font = '700 24px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('挑战模式选择', w / 2, panelY + 40);

    // Challenge list
    const challenges = getAllChallengeModes();
    const itemHeight = 60;
    const startY = panelY + 80;

    for (let i = 0; i < challenges.length; i++) {
      const challenge = challenges[i];
      const itemY = startY + i * itemHeight;
      const isSelected = i === this.challengeSelectionIndex;

      // Item background
      if (isSelected) {
        ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(panelX + 20, itemY, panelWidth - 40, itemHeight - 10, 8);
        ctx.fill();
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Challenge name
      ctx.font = '600 16px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.text : COLORS.textSecondary;
      ctx.textAlign = 'left';
      ctx.fillText(challenge.nameZh, panelX + 40, itemY + 20);

      // Challenge description
      ctx.font = '400 12px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textTertiary;
      ctx.fillText(challenge.descriptionZh, panelX + 40, itemY + 40);

      // Challenge icon
      ctx.font = '20px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(challenge.icon, panelX + panelWidth - 40, itemY + 25);
    }

    // Instructions
    ctx.font = '400 12px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.textAlign = 'center';
    ctx.fillText('↑ ↓ 选择   Enter 确认   Esc 返回', w / 2, panelY + panelHeight - 20);
  }

  // Update handleKey to manage challenge selection
  handleChallengeKey(key: string): string | null {
    if (!this.showChallengeSelection) return null;

    const challenges = getAllChallengeModes();
    
    switch (key) {
      case 'ArrowUp':
        this.challengeSelectionIndex = Math.max(0, this.challengeSelectionIndex - 1);
        return null;
      case 'ArrowDown':
        this.challengeSelectionIndex = Math.min(challenges.length - 1, this.challengeSelectionIndex + 1);
        return null;
      case 'Enter':
        this.showChallengeSelection = false;
        return 'challenge:' + challenges[this.challengeSelectionIndex].id;
      case 'Escape':
        this.showChallengeSelection = false;
        return null;
      default:
        return null;
    }
  }

  openChallengeSelection(): void {
    this.showChallengeSelection = true;
    this.challengeSelectionIndex = 0;
  }

  isChallengeSelectionOpen(): boolean {
    return this.showChallengeSelection;
  }

  updateDailyChallenge(challenge: Partial<DailyChallenge>): void {
    if (this.dailyChallenge) {
      Object.assign(this.dailyChallenge, challenge);
    }
  }
}






