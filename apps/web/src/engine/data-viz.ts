/**
 * Data Visualization System - 数据可视化
 * 
 * Enhanced statistics visualization with:
 * 1. Multi-metric sparklines (score, WPM, accuracy, combo)
 * 2. Progress indicators (improvement trends)
 * 3. Performance radar chart
 * 4. Session summary cards
 */

import { COLORS } from '../components/game/colors';
import { drawGlassPanel } from '../components/game/draw-helpers';

interface GameRecord {
  score: number;
  wave: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  date: string;
}

interface MetricTrend {
  label: string;
  values: number[];
  color: string;
  unit: string;
  improvement: number; // percentage change
}

// ---------------------------------------------------------------------------
// Data Visualization Renderer
// ---------------------------------------------------------------------------

export class DataVizRenderer {
  private records: GameRecord[] = [];
  
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  
  setRecords(records: GameRecord[]): void {
    this.records = records;
  }
  
  // ---------------------------------------------------------------------------
  // Sparkline Rendering
  // ---------------------------------------------------------------------------
  
  drawSparkline(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    values: number[],
    color: string,
    showDots: boolean = false
  ): void {
    if (values.length < 2) return;
    
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    
    ctx.save();
    
    // Gradient fill
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const px = x + (i / (values.length - 1)) * w;
      const py = y + h - ((values[i] - min) / range) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Line
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const px = x + (i / (values.length - 1)) * w;
      const py = y + h - ((values[i] - min) / range) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Dots
    if (showDots && values.length <= 20) {
      for (let i = 0; i < values.length; i++) {
        const px = x + (i / (values.length - 1)) * w;
        const py = y + h - ((values[i] - min) / range) * h;
        
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
  
  // ---------------------------------------------------------------------------
  // Metric Trend Cards
  // ---------------------------------------------------------------------------
  
  drawMetricCard(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    trend: MetricTrend
  ): void {
    ctx.save();
    
    // Card background
    drawGlassPanel(ctx, x, y, w, h, 12);
    
    // Label
    ctx.font = '500 11px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(trend.label, x + 12, y + 10);
    
    // Current value
    const current = trend.values[trend.values.length - 1] || 0;
    ctx.font = '700 24px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(this.formatValue(current, trend.unit), x + 12, y + 28);
    
    // Improvement indicator
    if (trend.improvement !== 0) {
      const isPositive = trend.improvement > 0;
      const arrow = isPositive ? '↑' : '↓';
      const color = isPositive ? COLORS.success : COLORS.error;
      
      ctx.font = '600 12px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(arrow + ' ' + Math.abs(trend.improvement).toFixed(1) + '%', x + w - 12, y + 12);
    }
    
    // Mini sparkline
    const sparkW = w - 24;
    const sparkH = 24;
    this.drawSparkline(ctx, x + 12, y + h - sparkW - 8, sparkW, sparkH, trend.values, trend.color);
    
    ctx.restore();
  }
  
  // ---------------------------------------------------------------------------
  // Performance Radar Chart
  // ---------------------------------------------------------------------------
  
  drawRadarChart(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    metrics: { label: string; value: number; max: number }[]
  ): void {
    if (metrics.length < 3) return;
    
    const sides = metrics.length;
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2;
    
    ctx.save();
    
    // Grid circles
    for (let ring = 1; ring <= 4; ring++) {
      const r = (radius * ring) / 4;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = COLORS.textTertiary + '30';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Axis lines
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = COLORS.textTertiary + '20';
      ctx.stroke();
    }
    
    // Data polygon
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const idx = i % sides;
      const angle = startAngle + idx * angleStep;
      const value = metrics[idx].value / metrics[idx].max;
      const r = radius * Math.min(1, value);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#0a84ff30';
    ctx.fill();
    ctx.strokeStyle = '#0a84ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Labels
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const labelR = radius + 16;
      const x = cx + Math.cos(angle) * labelR;
      const y = cy + Math.sin(angle) * labelR;
      
      ctx.font = '500 10px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textSecondary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metrics[i].label, x, y);
    }
    
    ctx.restore();
  }
  
  // ---------------------------------------------------------------------------
  // Session Summary Card
  // ---------------------------------------------------------------------------
  
  drawSessionSummary(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    record: GameRecord
  ): void {
    ctx.save();
    
    drawGlassPanel(ctx, x, y, w, h, 16);
    
    // Score (large)
    ctx.font = '700 32px -apple-system, SF Pro Display, system-ui, sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(record.score), x + w / 2, y + 30);
    
    // Score label
    ctx.font = '400 10px -apple-system, SF Pro Text, system-ui, sans-serif';
    ctx.fillStyle = COLORS.textTertiary;
    ctx.fillText('SCORE', x + w / 2, y + 50);
    
    // Metrics row
    const metrics = [
      { label: 'WPM', value: record.wpm },
      { label: 'ACC', value: record.accuracy + '%' },
      { label: 'WAVE', value: record.wave },
      { label: 'COMBO', value: record.maxCombo }
    ];
    
    const metricW = w / metrics.length;
    for (let i = 0; i < metrics.length; i++) {
      const mx = x + i * metricW + metricW / 2;
      const my = y + 70;
      
      ctx.font = '600 14px -apple-system, SF Pro Display, system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.fillText(String(metrics[i].value), mx, my);
      
      ctx.font = '400 9px -apple-system, SF Pro Text, system-ui, sans-serif';
      ctx.fillStyle = COLORS.textTertiary;
      ctx.fillText(metrics[i].label, mx, my + 16);
    }
    
    ctx.restore();
  }
  
  // ---------------------------------------------------------------------------
  // Trend Calculation
  // ---------------------------------------------------------------------------
  
  calculateTrends(): MetricTrend[] {
    if (this.records.length < 2) return [];
    
    const recent = this.records.slice(0, 10);
    const older = this.records.slice(10, 20);
    
    return [
      {
        label: 'Score',
        values: recent.map(r => r.score).reverse(),
        color: '#0a84ff',
        unit: '',
        improvement: this.calcImprovement(recent.map(r => r.score), older.map(r => r.score))
      },
      {
        label: 'WPM',
        values: recent.map(r => r.wpm).reverse(),
        color: '#30d158',
        unit: 'wpm',
        improvement: this.calcImprovement(recent.map(r => r.wpm), older.map(r => r.wpm))
      },
      {
        label: 'Accuracy',
        values: recent.map(r => r.accuracy).reverse(),
        color: '#ff9f0a',
        unit: '%',
        improvement: this.calcImprovement(recent.map(r => r.accuracy), older.map(r => r.accuracy))
      },
      {
        label: 'Max Combo',
        values: recent.map(r => r.maxCombo).reverse(),
        color: '#bf5af2',
        unit: 'x',
        improvement: this.calcImprovement(recent.map(r => r.maxCombo), older.map(r => r.maxCombo))
      }
    ];
  }
  
  getRadarMetrics(): { label: string; value: number; max: number }[] {
    if (this.records.length === 0) return [];
    
    const recent = this.records.slice(0, 5);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    return [
      { label: 'Speed', value: avg(recent.map(r => r.wpm)), max: 120 },
      { label: 'Accuracy', value: avg(recent.map(r => r.accuracy)), max: 100 },
      { label: 'Endurance', value: avg(recent.map(r => r.wave)), max: 20 },
      { label: 'Combo', value: avg(recent.map(r => r.maxCombo)), max: 30 },
      { label: 'Score', value: avg(recent.map(r => r.score)) / 100, max: 100 }
    ];
  }
  
  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  
  private calcImprovement(recent: number[], older: number[]): number {
    if (older.length === 0) return 0;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (olderAvg === 0) return 0;
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }
  
  private formatValue(value: number, unit: string): string {
    if (unit === '%') return value.toFixed(1) + '%';
    if (unit === 'wpm') return Math.round(value) + ' wpm';
    if (unit === 'x') return value + 'x';
    return String(Math.round(value));
  }
}
