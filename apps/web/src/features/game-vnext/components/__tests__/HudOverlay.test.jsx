/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import HudOverlay from '../HudOverlay';
import { getCopy } from '../../../../i18n';

const hud = {
    score: 12840,
    areaIndex: 1,
    areaName: 'Neon Archive',
    areaNameZh: 'Neon Archive',
    combo: 12,
    maxCombo: 18,
    lives: 4,
    maxLives: 5,
    heat: 23,
    energy: 80,
    surgeReady: false,
    level: 3,
    xp: 24,
    nextUpgradeXp: 40,
    accuracy: 96,
    wpm: 72,
    targetWord: 'focus',
    targetTyped: 'fo',
    progress: 0.42,
    elapsedSeconds: 92,
    durationSeconds: 360,
    extractAvailable: false,
    upgradeCount: 2
};

describe('HudOverlay', () => {
    test('renders the run HUD as grouped glanceable status sections', () => {
        const onSurge = vi.fn();
        const { container } = render(
            <HudOverlay
                data={hud}
                copy={getCopy('en-US')}
                onSurge={onSurge}
            />
        );

        expect(screen.getByRole('banner', { name: 'TypeRift status' })).toBeInTheDocument();
        expect(container.querySelector('.typerift-hud__primary')).toBeInTheDocument();
        expect(container.querySelector('.typerift-hud__target')).toBeInTheDocument();
        expect(container.querySelector('.typerift-hud__rail')).toBeInTheDocument();
        expect(container.querySelector('.typerift-hud__cluster')).toBeNull();
        expect(container.querySelector('.typerift-hud__progress')).toBeNull();
        expect(container.querySelectorAll('.typerift-hud__metric')).toHaveLength(5);
        expect(container.querySelectorAll('.typerift-hud__lives span')).toHaveLength(5);

        expect(screen.getByText('12,840')).toBeInTheDocument();
        expect(screen.getByText('Neon Archive')).toBeInTheDocument();
        expect(screen.getByText('fo')).toBeInTheDocument();
        expect(screen.getByText('cus')).toBeInTheDocument();
        expect(screen.getByText('1:32')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('Lv 3')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Surge' }));

        expect(onSurge).toHaveBeenCalledTimes(1);
    });
});
