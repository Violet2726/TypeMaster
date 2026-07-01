'use client';

import { X } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameCodexEntry, GameCodexProgress } from '../../../types/game';
import './dialogs.css';
import './codex.css';

type GameCopy = ReturnType<typeof getCopy>;

export default function CodexOverlay({ codex, copy, onClose }: { codex?: GameCodexProgress | null, copy: GameCopy, onClose: () => void }) {
    const enemies = codex?.enemies || [];
    const bosses = codex?.bosses || [];
    const upgrades = codex?.upgrades || [];
    const codexCopy = copy.game.codexDialog;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={codexCopy.aria}>
            <section className="typerift-panel typerift-panel--wide">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{copy.game.codex} {codex?.discovered || 0}/{codex?.total || 33}</span>
                        <h2>{codexCopy.title}</h2>
                    </div>
                    <button className="typerift-action" type="button" onClick={onClose} aria-label={codexCopy.close}>
                        <X aria-hidden="true" size={18} strokeWidth={2.2} />
                        {codexCopy.close}
                    </button>
                    <div className="typerift-codex-grid">
                        {[...enemies, ...bosses, ...upgrades].map((entry: GameCodexEntry) => (
                            <div key={entry.id} className="typerift-codex-entry is-open">
                                <strong>{entry.nameZh || entry.name || entry.id}</strong>
                                <small>{entry.category || (entry.defeated ? codexCopy.bossDefeated : codexCopy.enemyDiscovered)}</small>
                            </div>
                        ))}
                        {!enemies.length && !bosses.length && !upgrades.length ? (
                            <div className="typerift-codex-entry">
                                <strong>{codexCopy.emptyTitle}</strong>
                                <small>{codexCopy.emptyBody}</small>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
}
