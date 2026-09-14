'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Compass, Keyboard, RadioTower, Sparkles, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RunMode } from '@typerift/domain';
import { GameButton, GameDialog } from '@typerift/ui';
import { listLocalRuns } from '../../../lib/storage';

type ModeOption = {
    mode: RunMode;
    titleKey: string;
    metaKey: string;
    icon: ReactNode;
    tone: 'accent' | 'quiet' | 'ghost';
};

const RETURNING_OPTIONS: ModeOption[] = [
    { mode: 'expedition', titleKey: 'mode.expedition', metaKey: 'mode.expeditionMeta', icon: <Compass size={18} />, tone: 'accent' },
    { mode: 'daily-rift', titleKey: 'mode.daily-rift', metaKey: 'mode.dailyRiftMeta', icon: <CalendarDays size={18} />, tone: 'quiet' },
    { mode: 'repair-trial', titleKey: 'mode.repair-trial', metaKey: 'mode.repairMeta', icon: <Wrench size={18} />, tone: 'quiet' },
    { mode: 'first-rift', titleKey: 'mode.first-rift', metaKey: 'mode.firstRiftMeta', icon: <Sparkles size={18} />, tone: 'ghost' }
];

/**
 * Entry gate for /play without an explicit mode (guidance §4).
 *
 * A first-time player gets exactly one decision. Once a run exists the full mode list appears,
 * with the next expedition still the loudest option.
 */
export function ModeSelectOverlay({
    allowTouch,
    onSelect,
    onExit,
    t
}: {
    allowTouch: boolean;
    onSelect: (mode: RunMode) => void;
    onExit: () => void;
    t: (key: string) => string;
}) {
    const runs = useQuery({ queryKey: ['local-runs'], queryFn: listLocalRuns });
    const isFirstRun = (runs.data?.length ?? 0) === 0;

    if (runs.isLoading) {
        return (
            <div className="run-loading">
                <RadioTower size={26} />
                {t('play.loading')}
            </div>
        );
    }

    if (isFirstRun) {
        return (
            <GameDialog open tone="battle" title="TypeRift" description={t('mode.firstRunBody')} dismissOnEscape={false} onClose={onExit}>
                <GameButton block tone="accent" icon={<ArrowRight size={18} />} onClick={() => onSelect('first-rift')}>
                    {t('mode.begin')}
                </GameButton>
                <p className="mode-gate__hint">{t('mode.firstRunHint')}</p>
            </GameDialog>
        );
    }

    return (
        <GameDialog open tone="battle" width="wide" title={t('mode.choose')} description={t('mode.chooseBody')} onClose={onExit}>
            <div className="mode-gate">
                {RETURNING_OPTIONS.map((option) => (
                    <button key={option.mode} type="button" className={`mode-option is-${option.tone}`} onClick={() => onSelect(option.mode)}>
                        <span className="mode-option__icon" aria-hidden="true">
                            {option.icon}
                        </span>
                        <span className="mode-option__copy">
                            <strong>{t(option.titleKey)}</strong>
                            <span>{t(option.metaKey)}</span>
                        </span>
                        <ArrowRight size={18} aria-hidden="true" />
                    </button>
                ))}
                {allowTouch ? (
                    <button type="button" className="mode-option is-ghost" onClick={() => onSelect('quick-pulse')}>
                        <span className="mode-option__icon" aria-hidden="true">
                            <Keyboard size={18} />
                        </span>
                        <span className="mode-option__copy">
                            <strong>{t('mode.quick-pulse')}</strong>
                            <span>{t('mode.quickPulseMeta')}</span>
                        </span>
                        <ArrowRight size={18} aria-hidden="true" />
                    </button>
                ) : null}
            </div>
        </GameDialog>
    );
}
