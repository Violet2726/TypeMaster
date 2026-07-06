'use client';

import { Check, ChevronsUp, Keyboard, Pause, RadioTower } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { getCopy } from '../../../i18n';
import './dialogs.css';

type GameCopy = ReturnType<typeof getCopy>;

type HelpCommand = {
    icon: LucideIcon;
    label: string;
    value: string;
};

export default function HelpOverlay({ copy, onClose }: { copy: GameCopy, onClose: () => void }) {
    const gameCopy = copy.game;
    const commands: HelpCommand[] = [
        { icon: Keyboard, label: gameCopy.helpCommands.attack, value: gameCopy.helpCommands.attackInput },
        { icon: RadioTower, label: gameCopy.helpCommands.surge, value: gameCopy.helpCommands.surgeInput },
        { icon: ChevronsUp, label: gameCopy.helpCommands.upgrade, value: gameCopy.helpCommands.upgradeInput },
        { icon: Pause, label: gameCopy.helpCommands.pause, value: gameCopy.helpCommands.pauseInput }
    ];
    const overlay = (
        <div className="typerift-overlay typerift-overlay--sheet" role="dialog" aria-modal="true" aria-label={gameCopy.helpTitle}>
            <section className="typerift-sheet typerift-sheet--help">
                <div className="typerift-sheet__inner">
                    <div className="typerift-sheet__grabber" aria-hidden="true" />
                    <div className="typerift-sheet__header">
                        <span>{gameCopy.help}</span>
                        <h2>{gameCopy.helpTitle}</h2>
                    </div>
                    <div className="typerift-help-list" aria-label={gameCopy.helpTitle}>
                        {commands.map(({ icon: Icon, label, value }) => (
                            <span className="typerift-help-command" key={label}>
                                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{label}</strong>
                                <small>{value}</small>
                            </span>
                        ))}
                    </div>
                    <button className="typerift-sheet__done" type="button" onClick={onClose} autoFocus>
                        <Check aria-hidden="true" size={18} strokeWidth={2.2} />
                        <span>{gameCopy.helpDismiss}</span>
                    </button>
                </div>
            </section>
        </div>
    );

    return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
