'use client';

import { DoorOpen, Home, Play, RotateCcw } from 'lucide-react';
import './overlays.css';

interface PauseStats {
  score: number;
  threatLevel: number;
  combo: number;
  lives: number;
  accuracy: number;
  wpm: number;
  elapsedSeconds: number;
  extractAvailable: boolean;
  nextExtractThreatLevel?: number;
}

interface PauseMenuOverlayProps {
  stats: PauseStats;
  onAction: (action: string) => void;
}

function formatDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export default function PauseMenuOverlay({ stats, onAction }: PauseMenuOverlayProps) {
  return (
    <div className="raid-overlay" role="dialog" aria-modal="true" aria-label="无尽突袭已暂停">
      <section className="raid-panel raid-panel--pause">
        <div className="raid-panel__heading">
          <span>{stats.extractAvailable ? '营门已开启' : '已暂停'}</span>
          <h2>无尽突袭</h2>
          <p>
            {stats.extractAvailable
              ? '现在撤离会保存本局成绩，也可以继续挑战更高威胁。'
              : `下一个营门在威胁 ${stats.nextExtractThreatLevel || 3} 开启。`}
          </p>
        </div>

        <div className="raid-pause-summary" aria-label="当前突袭数据">
          <div>
            <span>得分</span>
            <strong>{Math.round(stats.score).toLocaleString()}</strong>
          </div>
          <div>
            <span>威胁</span>
            <strong>{stats.threatLevel}</strong>
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
            <span>存活</span>
            <strong>{formatDuration(stats.elapsedSeconds)}</strong>
          </div>
        </div>

        <div className="raid-actions">
          <button className="raid-action raid-action--primary" type="button" onClick={() => onAction('resume')} autoFocus>
            <Play aria-hidden="true" size={18} strokeWidth={2.2} />
            继续
          </button>
          <button
            className={`raid-action${stats.extractAvailable ? ' raid-action--extract' : ''}`}
            type="button"
            onClick={() => onAction('extract')}
            disabled={!stats.extractAvailable}
          >
            <DoorOpen aria-hidden="true" size={18} strokeWidth={2.2} />
            撤离并结算
          </button>
          <button className="raid-action" type="button" onClick={() => onAction('retry')}>
            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
            重试
          </button>
          <button className="raid-action raid-action--quiet" type="button" onClick={() => onAction('quit')}>
            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
            返回指挥台
          </button>
        </div>
      </section>
    </div>
  );
}
