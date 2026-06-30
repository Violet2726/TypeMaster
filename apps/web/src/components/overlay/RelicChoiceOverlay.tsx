'use client';

import { Sparkles } from 'lucide-react';
import './overlays.css';

interface RelicChoice {
  id: string;
  name: string;
  nameZh?: string;
  rarity: string;
  summary: string;
  stack?: number;
}

interface RelicChoiceOverlayProps {
  choices: RelicChoice[];
  onChoose: (relicId: string) => void;
}

export default function RelicChoiceOverlay({ choices, onChoose }: RelicChoiceOverlayProps) {
  if (!choices.length) return null;

  return (
    <div className="raid-overlay raid-overlay--soft" role="dialog" aria-modal="true" aria-label="选择 relic">
      <section className="raid-panel raid-panel--relic">
        <div className="raid-panel__heading">
          <span>Relic Choice</span>
          <h2>选择一个 relic</h2>
          <p>按 1 / 2 / 3 或点击选择。当前构筑会影响本局后续怪物、得分和撤离收益。</p>
        </div>
        <div className="raid-relic-grid">
          {choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              className={`raid-relic-card raid-relic-card--${choice.rarity}`}
              onClick={() => onChoose(choice.id)}
              autoFocus={index === 0}
            >
              <span className="raid-relic-card__index">{index + 1}</span>
              <Sparkles aria-hidden="true" size={18} strokeWidth={2.2} />
              <strong>{choice.nameZh || choice.name}</strong>
              <small>{choice.rarity} · Lv.{choice.stack || 1}</small>
              <span>{choice.summary}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
