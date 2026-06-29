'use client';

import { DoorOpen, Home, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react';
import './overlays.css';

interface RaidResultData {
  score: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  threatLevel: number;
  monstersDefeated: number;
  eliteDefeated: number;
  enemiesLeaked: number;
  weakestChars?: string[];
  focusChars?: string[];
  durationSeconds: number;
  recommendation: string;
  endReason: 'extract' | 'defeat' | null;
  isVictory: boolean;
  isBest: boolean;
}

interface GameOverOverlayProps {
  data: RaidResultData;
  onAction: (action: string) => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function getVerdict(data: RaidResultData) {
  if (data.endReason === 'extract' && data.accuracy >= 96) return '精准撤离';
  if (data.endReason === 'extract') return '稳定撤离';
  if (data.accuracy < 90) return '先稳准确';
  return '防线告急';
}

export default function GameOverOverlay({ data, onAction }: GameOverOverlayProps) {
  const weakChars = data.weakestChars || data.focusChars || [];
  const focus = weakChars.length ? weakChars.join(' / ') : '暂无明显弱点';
  const HeroIcon = data.endReason === 'extract' ? DoorOpen : Target;

  return (
    <div className="raid-overlay" role="dialog" aria-modal="true" aria-label="无尽突袭结算">
      <section className="raid-panel raid-panel--result">
        <div className="raid-result-hero">
          <div className={`raid-result-hero__mark${data.endReason === 'extract' ? ' is-victory' : ''}`} aria-hidden="true">
            {data.isBest ? <Trophy size={34} strokeWidth={2.1} /> : <HeroIcon size={34} strokeWidth={2.1} />}
          </div>
          <span>{getVerdict(data)}</span>
          <h2>{Math.round(data.score).toLocaleString()}</h2>
          {data.isBest && (
            <p className="raid-best">
              <Sparkles aria-hidden="true" size={14} strokeWidth={2.2} />
              新纪录
            </p>
          )}
        </div>

        <div className="raid-result-grid" aria-label="Raid 结果数据">
          <div>
            <span>存活时间</span>
            <strong>{formatDuration(data.durationSeconds)}</strong>
          </div>
          <div>
            <span>最高威胁</span>
            <strong>{data.threatLevel}</strong>
          </div>
          <div>
            <span>清除怪物</span>
            <strong>{data.monstersDefeated}</strong>
          </div>
          <div>
            <span>精英击败</span>
            <strong>{data.eliteDefeated}</strong>
          </div>
          <div>
            <span>速度</span>
            <strong>{data.wpm}</strong>
            <small>WPM</small>
          </div>
          <div>
            <span>准确率</span>
            <strong>{data.accuracy}%</strong>
          </div>
        </div>

        <div className="raid-insight">
          <div>
            <span>最弱字符</span>
            <strong>{focus}</strong>
          </div>
          <div>
            <span>下一步建议</span>
            <strong>{data.recommendation}</strong>
          </div>
        </div>

        <div className="raid-actions">
          <button className="raid-action raid-action--primary" type="button" onClick={() => onAction('retry')} autoFocus>
            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
            再来一局
          </button>
          <button className="raid-action raid-action--quiet" type="button" onClick={() => onAction('menu')}>
            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
            返回指挥台
          </button>
        </div>
      </section>
    </div>
  );
}
