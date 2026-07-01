'use client';

import { Sparkles } from 'lucide-react';
import './dialogs.css';

function assetPath(id: string) {
    return `/game/typerift/relics/${id}.webp`;
}

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
                                className={`typerift-upgrade-card typerift-upgrade-card--${choice.rarity}`}
                                type="button"
                                onClick={() => onChoose(choice.id)}
                                autoFocus={index === 0}
                            >
                                <span className="typerift-upgrade-card__number">{index + 1}</span>
                                <span className="typerift-upgrade-card__art">
                                    <img src={assetPath(choice.id)} alt="" aria-hidden="true" />
                                    <Sparkles aria-hidden="true" size={16} strokeWidth={2.2} />
                                </span>
                                <span className="typerift-upgrade-card__copy">
                                    <small>{choice.category} / {choice.rarity} / Lv.{choice.stack || 1}</small>
                                    <strong>{choice.nameZh || choice.name}</strong>
                                    <span>{choice.summary}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
