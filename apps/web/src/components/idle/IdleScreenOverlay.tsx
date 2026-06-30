'use client';

import { BookOpen, CalendarDays, Play, ShieldCheck, Sparkles, Target } from 'lucide-react';
import './idle-screen.css';

interface IdleScreenOverlayProps {
  bestScore: number;
  focusChars: string[];
  mutation?: {
    nameZh?: string;
    name?: string;
    summary?: string;
  } | null;
  codexProgress?: {
    discovered?: number;
    total?: number;
  } | null;
  onAction: (action: string) => void;
}

export default function IdleScreenOverlay({ bestScore, focusChars, mutation, codexProgress, onAction }: IdleScreenOverlayProps) {
  const focusLabel = focusChars.length ? focusChars.join(' / ') : '自动选择';
  const codexLabel = codexProgress?.total ? `${codexProgress.discovered || 0}/${codexProgress.total}` : '0/0';
  const mutationLabel = mutation?.nameZh || mutation?.name || '每日异变';

  return (
    <div className="raid-idle" aria-label="Arcade Rift 模式选择">
      <section className="raid-idle__hero">
        <div className="raid-idle__badge">
          <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
          Arcade Rift
        </div>
        <h1>发光裂隙已开启</h1>
        <p>输入怪物词，收集 relic，击破 Guardian，在撤离门开启时带着构筑和分数离开。</p>
      </section>

      <section className="raid-idle__summary" aria-label="Arcade Rift 状态">
        <div>
          <Sparkles aria-hidden="true" size={17} strokeWidth={2.2} />
          <span>最佳分数</span>
          <strong>{bestScore ? bestScore.toLocaleString() : '未记录'}</strong>
        </div>
        <div>
          <Target aria-hidden="true" size={17} strokeWidth={2.2} />
          <span>弱区字符</span>
          <strong>{focusLabel}</strong>
        </div>
        <div>
          <BookOpen aria-hidden="true" size={17} strokeWidth={2.2} />
          <span>图鉴</span>
          <strong>{codexLabel}</strong>
        </div>
      </section>

      <div className="raid-idle__actions raid-idle__actions--grid">
        <button className="raid-start-button" type="button" onClick={() => onAction('endless-rift')} autoFocus>
          <Play aria-hidden="true" size={20} strokeWidth={2.3} />
          开始无尽裂隙
        </button>
        <button className="raid-secondary-button" type="button" onClick={() => onAction('daily-mutation')}>
          <CalendarDays aria-hidden="true" size={18} strokeWidth={2.2} />
          {mutationLabel}
        </button>
        <button className="raid-secondary-button" type="button" onClick={() => onAction('first-breach')}>
          <ShieldCheck aria-hidden="true" size={18} strokeWidth={2.2} />
          首次破口
        </button>
        <button className="raid-secondary-button" type="button" onClick={() => onAction('codex')}>
          <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
          查看图鉴
        </button>
      </div>

      {mutation?.summary ? <p className="raid-idle__mutation">{mutation.summary}</p> : null}
    </div>
  );
}
