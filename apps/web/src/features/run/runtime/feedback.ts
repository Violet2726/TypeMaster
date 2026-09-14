import type { RunEvent, RunState } from '@typerift/domain';
import type { HudFeedback } from '../components/HudOverlay';

/**
 * Tier-2 feedback: turns a batch of domain events into at most one transient HUD message.
 *
 * The engine emits many events per tick; the HUD is only allowed to say one thing at a time,
 * so this picks the most meaningful event by priority and drops the rest.
 */
export function feedbackFromEvents(previous: RunState | null, next: RunState, events: RunEvent[], t: (key: string) => string): Omit<HudFeedback, 'id'> | null {
    if (!events.length) return null;
    const types = new Set(events.map((event) => event.type));

    if (types.has('upgrade-ready')) return { kind: 'level-up', label: t('play.levelUp'), detail: `${t('play.level')} ${next.level + 1}` };
    if (types.has('area-changed')) return { kind: 'area', label: t('play.areaChanged'), detail: `${t('play.area')} ${next.areaIndex + 1}` };
    if (previous && previous.areaIndex === 0 && next.areaIndex >= 1) return { kind: 'extract', label: t('play.extractReady') };
    if (types.has('surge')) return { kind: 'surge', label: t('play.surgeReleased') };

    if (types.has('defeated') && !next.currentTargetHadError) return { kind: 'perfect', label: t('play.perfect') };

    const broke = types.has('error');
    if (broke && previous && previous.combo >= 5) return { kind: 'combo-lost', label: t('play.comboLost'), detail: `×${previous.combo}` };
    if (next.combo > 0 && next.combo % 10 === 0 && previous?.combo !== next.combo) return { kind: 'combo', label: t('play.combo'), detail: `×${next.combo}` };

    return null;
}

/** How long a tier-2 message stays on screen before it disappears. */
export function feedbackDuration(kind: HudFeedback['kind']) {
    return kind === 'combo' ? 900 : 1_600;
}
