'use client';

import { ChevronRight, Sparkles } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameUpgradeSnapshot } from '../../../types/game';
import './dialogs.css';

type GameCopy = ReturnType<typeof getCopy>;

function assetPath(id: string) {
    return `/game/typerift/relics/${id}.webp`;
}

export default function UpgradeOverlay({ choices, copy, onChoose }: { choices: GameUpgradeSnapshot[], copy: GameCopy, onChoose: (upgradeId: string) => void }) {
    if (!choices?.length) return null;
    const upgradeCopy = copy.game.upgrade;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={upgradeCopy.aria}>
            <section className="typerift-panel typerift-panel--upgrade">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{upgradeCopy.kicker}</span>
                        <h2>{upgradeCopy.title}</h2>
                        <p>{upgradeCopy.body}</p>
                    </div>
                    <div className="typerift-upgrade-list">
                        {choices.map((choice, index) => (
                            <button
                                key={choice.id}
                                className={`typerift-upgrade-row typerift-upgrade-row--${choice.rarity}`}
                                type="button"
                                onClick={() => onChoose(choice.id)}
                                autoFocus={index === 0}
                            >
                                <span className="typerift-upgrade-row__index" aria-hidden="true">{index + 1}</span>
                                <span className="typerift-upgrade-row__art">
                                    <img src={assetPath(choice.id)} alt="" aria-hidden="true" />
                                    <Sparkles aria-hidden="true" size={16} strokeWidth={2.2} />
                                </span>
                                <span className="typerift-upgrade-row__copy">
                                    <small>
                                        <span>{choice.category}</span>
                                        <span>{choice.rarity}</span>
                                        <span>Lv.{choice.stack || 1}</span>
                                    </small>
                                    <strong>{choice.nameZh || choice.name}</strong>
                                    <span>{choice.summary}</span>
                                </span>
                                <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
