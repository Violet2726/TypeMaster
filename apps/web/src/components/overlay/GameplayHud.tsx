'use client';

import { Activity, Heart, Target, Zap } from 'lucide-react';
import './overlays.css';

interface HudData {
  score: number;
  waveLabel: string;
  combo: number;
  lives: number;
  maxLives: number;
  accuracy: number;
  wpm: number;
  targetWord: string;
  progress: number;
}

interface GameplayHudProps {
  data: HudData;
}

export default function GameplayHud({ data }: GameplayHudProps) {
  const progress = `${Math.round((data.progress || 0) * 100)}%`;

  return (
    <header className="raid-hud" aria-label="Raid 状态">
      <div className="raid-hud__cluster raid-hud__cluster--primary">
        <div className="raid-hud__metric raid-hud__metric--score">
          <Activity aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{Math.round(data.score).toLocaleString()}</span>
        </div>
        <div className="raid-hud__metric">
          <Target aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{data.waveLabel}</span>
        </div>
        <div className="raid-hud__progress" aria-hidden="true">
          <span style={{ width: progress }} />
        </div>
      </div>

      <div className="raid-hud__target" aria-label={`当前目标 ${data.targetWord || '无'}`}>
        <span>目标</span>
        <strong>{data.targetWord || '...'}</strong>
      </div>

      <div className="raid-hud__cluster raid-hud__cluster--secondary">
        <div className="raid-hud__metric raid-hud__metric--combo">
          <Zap aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{data.combo}</span>
        </div>
        <div className="raid-hud__metric">
          <span>{data.wpm}</span>
          <small>WPM</small>
        </div>
        <div className="raid-hud__metric">
          <span>{data.accuracy}%</span>
        </div>
        <div className="raid-hud__lives" aria-label={`剩余 ${data.lives} 点生命`}>
          <Heart aria-hidden="true" size={16} strokeWidth={2.2} />
          {Array.from({ length: data.maxLives }).map((_, index) => (
            <span key={index} className={index >= data.lives ? 'is-empty' : ''} />
          ))}
        </div>
      </div>
    </header>
  );
}
