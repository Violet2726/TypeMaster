'use client';

import { X } from 'lucide-react';
import './dialogs.css';
import './codex.css';

export default function CodexOverlay({ codex, onClose }: { codex: any, onClose: () => void }) {
    const enemies = codex?.enemies || [];
    const bosses = codex?.bosses || [];
    const upgrades = codex?.upgrades || [];

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label="TypeRift codex">
            <section className="typerift-panel typerift-panel--wide">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>Codex {codex?.discovered || 0}/{codex?.total || 33}</span>
                        <h2>Echo Siege 图鉴</h2>
                    </div>
                    <button className="typerift-action" type="button" onClick={onClose} aria-label="Close TypeRift codex">
                        <X aria-hidden="true" size={18} strokeWidth={2.2} />
                        关闭
                    </button>
                    <div className="typerift-codex-grid">
                        {[...enemies, ...bosses, ...upgrades].map((entry: any) => (
                            <div key={entry.id} className="typerift-codex-entry is-open">
                                <strong>{entry.nameZh || entry.name || entry.id}</strong>
                                <small>{entry.category || (entry.defeated ? 'boss defeated' : 'enemy discovered')}</small>
                            </div>
                        ))}
                        {!enemies.length && !bosses.length && !upgrades.length ? (
                            <div className="typerift-codex-entry">
                                <strong>Awaiting first descent</strong>
                                <small>v7 starts with a clean game codex.</small>
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
}

