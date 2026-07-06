'use client';

import { BookOpen, ChevronRight, Shield, Sparkles, Swords, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameCodexEntry, GameCodexProgress } from '../../../types/game';
import './dialogs.css';
import './codex.css';

type GameCopy = ReturnType<typeof getCopy>;

function entryTitle(entry: GameCodexEntry) {
    return entry.nameZh || entry.name || entry.id;
}

function entryMeta(entry: GameCodexEntry, fallback: string) {
    if (entry.category) return entry.category;
    if (entry.defeated) return fallback;
    return fallback;
}

function CodexSection({
    empty,
    entries,
    fallback,
    icon: Icon,
    title
}: {
    empty: string;
    entries: GameCodexEntry[];
    fallback: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <section className="typerift-codex-section" aria-label={title}>
            <div className="typerift-codex-section__head">
                <span>
                    <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
                    <strong>{title}</strong>
                </span>
                <small>{entries.length}</small>
            </div>
            <div className="typerift-codex-list">
                {entries.length ? entries.map((entry) => (
                    <div key={entry.id} className="typerift-codex-row">
                        <span>
                            <strong>{entryTitle(entry)}</strong>
                            <small>{entryMeta(entry, fallback)}</small>
                        </span>
                    </div>
                )) : (
                    <div className="typerift-codex-row typerift-codex-row--empty">
                        <span>
                            <strong>{empty}</strong>
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}

export default function CodexOverlay({ codex, copy, onClose }: { codex?: GameCodexProgress | null, copy: GameCopy, onClose: () => void }) {
    const enemies = codex?.enemies || [];
    const bosses = codex?.bosses || [];
    const upgrades = codex?.upgrades || [];
    const codexCopy = copy.game.codexDialog;
    const hasEntries = Boolean(enemies.length || bosses.length || upgrades.length);
    const discovered = codex?.discovered || 0;
    const total = codex?.total || 33;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={codexCopy.aria}>
            <section className="typerift-panel typerift-panel--codex">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{copy.game.codex}</span>
                        <h2>{codexCopy.title}</h2>
                    </div>
                    <div className="typerift-run-summary typerift-run-summary--codex" aria-label={codexCopy.progress}>
                        <span>
                            <small>{codexCopy.progress}</small>
                            <strong>{discovered}/{total}</strong>
                        </span>
                        <span>
                            <small>{codexCopy.enemies}</small>
                            <strong>{enemies.length}</strong>
                        </span>
                        <span>
                            <small>{codexCopy.upgrades}</small>
                            <strong>{upgrades.length}</strong>
                        </span>
                    </div>
                    {!hasEntries ? (
                        <div className="typerift-codex-empty">
                            <BookOpen aria-hidden="true" size={20} strokeWidth={2.2} />
                            <div>
                                <strong>{codexCopy.emptyTitle}</strong>
                                <small>{codexCopy.emptyBody}</small>
                            </div>
                        </div>
                    ) : null}
                    <div className="typerift-codex-sections">
                        <CodexSection
                            title={codexCopy.enemies}
                            empty={codexCopy.emptyEnemies}
                            entries={enemies}
                            fallback={codexCopy.enemyDiscovered}
                            icon={Swords}
                        />
                        <CodexSection
                            title={codexCopy.bosses}
                            empty={codexCopy.emptyBosses}
                            entries={bosses}
                            fallback={codexCopy.bossDefeated}
                            icon={Shield}
                        />
                        <CodexSection
                            title={codexCopy.upgrades}
                            empty={codexCopy.emptyUpgrades}
                            entries={upgrades}
                            fallback={codexCopy.upgradeDiscovered}
                            icon={Sparkles}
                        />
                    </div>
                    <div className="typerift-action-list">
                        <button className="typerift-action-row typerift-action-row--primary" type="button" onClick={onClose} aria-label={codexCopy.close} autoFocus>
                            <span>
                                <X aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{codexCopy.close}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
