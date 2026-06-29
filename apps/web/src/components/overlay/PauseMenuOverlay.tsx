'use client';

import { Home, Play, RotateCcw } from 'lucide-react';
import './overlays.css';

interface PauseStats {
  score: number;
  waveLabel: string;
  combo: number;
  lives: number;
  accuracy: number;
  wpm: number;
}

interface PauseMenuOverlayProps {
  stats: PauseStats;
  onAction: (action: string) => void;
}

export default function PauseMenuOverlay({ stats, onAction }: PauseMenuOverlayProps) {
  return (
    <div className="raid-overlay" role="dialog" aria-modal="true" aria-label="突袭已暂停">
      <section className="raid-panel raid-panel--pause">
        <div className="raid-panel__heading">
          <span>已暂停</span>
          <h2>打字突袭</h2>
        </div>

        <div className="raid-pause-summary" aria-label="当前突袭数据">
          <div>
            <span>得分</span>
            <strong>{Math.round(stats.score).toLocaleString()}</strong>
          </div>
          <div>
            <span>波次</span>
            <strong>{stats.waveLabel}</strong>
          </div>
          <div>
            <span>连击</span>
            <strong>{stats.combo}</strong>
          </div>
          <div>
            <span>速度</span>
            <strong>{stats.wpm}</strong>
          </div>
          <div>
            <span>准确率</span>
            <strong>{stats.accuracy}%</strong>
          </div>
          <div>
            <span>生命</span>
            <strong>{stats.lives}</strong>
          </div>
        </div>

        <div className="raid-actions">
          <button className="raid-action raid-action--primary" type="button" onClick={() => onAction('resume')} autoFocus>
            <Play aria-hidden="true" size={18} strokeWidth={2.2} />
            继续
          </button>
          <button className="raid-action" type="button" onClick={() => onAction('retry')}>
            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
            重试
          </button>
          <button className="raid-action raid-action--quiet" type="button" onClick={() => onAction('quit')}>
            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
            返回
          </button>
        </div>
      </section>
    </div>
  );
}
