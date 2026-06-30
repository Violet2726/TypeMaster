'use client';

import { Sparkles } from 'lucide-react';
import './dialogs.css';

export default function UpgradeOverlay({ choices, copy, onChoose }: { choices: any[], copy: any, onChoose: (upgradeId: string) => void }) {
    if (!choices?.length) return null;
    const upgradeCopy = copy.game.upgrade;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={upgradeCopy.aria}>
            <section className="typerift-panel typerift-panel--wide">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{upgradeCopy.kicker}</span>
                        <h2>{upgradeCopy.title}</h2>
                        <p>{upgradeCopy.body}</p>
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
