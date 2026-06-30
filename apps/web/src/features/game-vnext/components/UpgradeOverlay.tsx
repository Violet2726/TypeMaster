'use client';

import { Sparkles } from 'lucide-react';
import './dialogs.css';

export default function UpgradeOverlay({ choices, onChoose }: { choices: any[], onChoose: (upgradeId: string) => void }) {
    if (!choices?.length) return null;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label="Choose TypeRift upgrade">
            <section className="typerift-panel typerift-panel--wide">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>Construct Online</span>
                        <h2>选择一次构筑升级</h2>
                        <p>按 1 / 2 / 3 或点击卡牌。Weapon 改变清怪方式，Relic 改变风险收益，Glyph 绑定弱字符训练。</p>
                    </div>
                    <div className="typerift-upgrade-grid">
                        {choices.map((choice, index) => (
                            <button
                                key={choice.id}
                                type="button"
                                className={`typerift-card typerift-card--${choice.rarity}`}
                                onClick={() => onChoose(choice.id)}
                                autoFocus={index === 0}
                            >
                                <Sparkles aria-hidden="true" size={20} strokeWidth={2.2} />
                                <strong>{choice.nameZh || choice.name}</strong>
                                <small>{choice.category} · {choice.rarity} · Lv.{choice.stack || 1}</small>
                                <span>{choice.summary}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

