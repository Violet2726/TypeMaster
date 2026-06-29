'use client';

import { Home, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react';
import './overlays.css';

interface RaidResultData {
  score: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  wavesCleared: number;
  enemiesDefeated: number;
  enemiesLeaked: number;
  focusChars: string[];
  durationSeconds: number;
  recommendation: string;
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
  if (data.isVictory && data.accuracy >= 96) return '节奏清晰';
  if (data.isVictory) return '突袭完成';
  if (data.accuracy < 90) return '先稳准确';
  return '继续压阵';
}

export default function GameOverOverlay({ data, onAction }: GameOverOverlayProps) {
  const focus = data.focusChars?.length ? data.focusChars.join(' / ') : '暂无明显弱点';

  return (
    <div className="raid-overlay" role="dialog" aria-modal="true" aria-label={data.isVictory ? '突袭完成' : '突袭中止'}>
      <section className="raid-panel raid-panel--result">
        <div className="raid-result-hero">
          <div className={`raid-result-hero__mark${data.isVictory ? ' is-victory' : ''}`} aria-hidden="true">
            {data.isVictory ? <Trophy size={34} strokeWidth={2.1} /> : <Target size={34} strokeWidth={2.1} />}
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
            <span>速度</span>
            <strong>{data.wpm}</strong>
            <small>WPM</small>
          </div>
          <div>
            <span>准确率</span>
            <strong>{data.accuracy}%</strong>
          </div>
          <div>
            <span>最高连击</span>
            <strong>{data.maxCombo}</strong>
          </div>
          <div>
            <span>完成波次</span>
            <strong>{data.wavesCleared}/5</strong>
          </div>
          <div>
            <span>清除目标</span>
            <strong>{data.enemiesDefeated}</strong>
          </div>
          <div>
            <span>用时</span>
            <strong>{formatDuration(data.durationSeconds)}</strong>
          </div>
        </div>

        <div className="raid-insight">
          <div>
            <span>重点字符</span>
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
            返回菜单
          </button>
        </div>
      </section>
    </div>
  );
}
