/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import RunResultOverlay from '../RunResultOverlay';
import { getCopy } from '../../../../i18n';

const result = {
    score: 12840,
    wpm: 72,
    accuracy: 96,
    maxCombo: 34,
    areaName: 'Neon Archive',
    areaNameZh: 'Neon Archive',
    durationSeconds: 132,
    enemiesDefeated: 48,
    bossesDefeated: 2,
    endReason: 'extract',
    recommendation: 'Keep the opening clean before adding more pressure.',
    isBest: true,
    upgradeBuild: [
        {
            id: 'relay-lens',
            category: 'relic',
            rarity: 'rare',
            name: 'Relay Lens',
            summary: 'Extends the opening window.',
            stack: 2
        }
    ]
};

describe('RunResultOverlay', () => {
    test('renders the run result as a compact summary sheet with action rows', () => {
        const onAction = vi.fn();
        const { container } = render(
            <RunResultOverlay
                data={result}
                copy={getCopy('en-US')}
                onAction={onAction}
            />
        );

        expect(screen.getByRole('dialog', { name: 'TypeRift result' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '12,840' })).toBeInTheDocument();
        expect(container.querySelector('.typerift-panel--result')).toBeInTheDocument();
        expect(container.querySelector('.typerift-run-summary--result')).toBeInTheDocument();
        expect(container.querySelector('.typerift-stats')).toBeNull();
        expect(container.querySelector('.typerift-pills')).toBeNull();
        expect(container.querySelectorAll('.typerift-result-metrics > span')).toHaveLength(3);
        expect(container.querySelectorAll('.typerift-action-row')).toHaveLength(3);
        expect(container.querySelectorAll('.typerift-action-row--primary')).toHaveLength(1);

        expect(screen.getByText('2:12')).toBeInTheDocument();
        expect(screen.getByText('Neon Archive')).toBeInTheDocument();
        expect(screen.getByText('96%')).toBeInTheDocument();
        expect(screen.getByText('Relay Lens')).toBeInTheDocument();
        expect(screen.getByText('x2')).toBeInTheDocument();
        expect(screen.getByText('Keep the opening clean before adding more pressure.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Run again' }));
        fireEvent.click(screen.getByRole('button', { name: 'Codex' }));
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));

        expect(onAction).toHaveBeenNthCalledWith(1, 'retry');
        expect(onAction).toHaveBeenNthCalledWith(2, 'codex');
        expect(onAction).toHaveBeenNthCalledWith(3, 'menu');
    });
});
