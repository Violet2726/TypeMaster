'use client';

import { CalendarDays, Play, ShieldCheck, Sparkles, Target } from 'lucide-react';
import './idle-screen.css';

interface IdleScreenOverlayProps {
  bestScore: number;
  focusChars: string[];
  onAction: (action: string) => void;
}

export default function IdleScreenOverlay({ bestScore, focusChars, onAction }: IdleScreenOverlayProps) {
  const focusLabel = focusChars.length ? focusChars.join(' / ') : '自动选择';

  return (
    <div className="raid-idle" aria-label="无尽突袭开始菜单">
      <section className="raid-idle__hero">
        <div className="raid-idle__badge">
          <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
          训练型无尽街机
        </div>
        <h1>无尽突袭</h1>
        <p>输入怪物身上的词，守住字符裂隙，在营门开启时撤离，或继续挑战更高威胁。</p>
      </section>

      <section className="raid-idle__summary" aria-label="Raid 准备状态">
        <div>
          <Sparkles aria-hidden="true" size={17} strokeWidth={2.2} />
          <span>最好成绩</span>
          <strong>{bestScore ? bestScore.toLocaleString() : '未记录'}</strong>
        </div>
        <div>
          <Target aria-hidden="true" size={17} strokeWidth={2.2} />
          <span>聚焦字符</span>
          <strong>{focusLabel}</strong>
        </div>
      </section>

      <div className="raid-idle__actions">
        <button className="raid-start-button" type="button" onClick={() => onAction('start')} autoFocus>
          <Play aria-hidden="true" size={20} strokeWidth={2.3} />
          开始无尽突袭
        </button>
        <button className="raid-secondary-button" type="button" onClick={() => onAction('daily-focus')}>
          <CalendarDays aria-hidden="true" size={18} strokeWidth={2.2} />
          每日聚焦
        </button>
      </div>
    </div>
  );
}
