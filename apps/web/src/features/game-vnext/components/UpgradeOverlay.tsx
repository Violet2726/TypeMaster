'use client';

import { Sparkles } from 'lucide-react';
import { AppCard } from '../../../components/app/AppPrimitives';
import './dialogs.css';

function toneForRarity(rarity: string) {
    if (rarity === 'rare') return 'primary';
    if (rarity === 'epic' || rarity === 'legendary') return 'warning';
    return 'default';
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
                            <AppCard
                                key={choice.id}
                                className={`typerift-upgrade-card typerift-upgrade-card--${choice.rarity}`}
                                icon={Sparkles}
                                kicker={`${choice.category} / ${choice.rarity} / Lv.${choice.stack || 1}`}
                                title={choice.nameZh || choice.name}
                                body={choice.summary}
                                tone={toneForRarity(choice.rarity)}
                                onClick={() => onChoose(choice.id)}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

