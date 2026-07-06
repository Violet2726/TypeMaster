/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import UpgradeOverlay from '../UpgradeOverlay';
import { getCopy } from '../../../../i18n';

const choices = [
    {
        id: 'glass-orbit',
        category: 'relic',
        rarity: 'rare',
        name: 'Glass Orbit',
        summary: 'Extends the opening window.',
        stack: 2
    },
    {
        id: 'pulse-lance',
        category: 'weapon',
        rarity: 'common',
        name: 'Pulse Lance',
        summary: 'Adds a clean strike on precise input.',
        stack: 1
    },
    {
        id: 'mirror-glyph',
        category: 'glyph',
        rarity: 'epic',
        name: 'Mirror Glyph',
        summary: 'Repeats weak characters under safer pressure.',
        stack: 1
    }
];

describe('UpgradeOverlay', () => {
    test('renders upgrade choices as a compact selectable list', () => {
        const onChoose = vi.fn();
        const { container } = render(
            <UpgradeOverlay
                choices={choices}
                copy={getCopy('en-US')}
                onChoose={onChoose}
            />
        );

        expect(screen.getByRole('dialog', { name: 'Choose TypeRift upgrade' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Choose a build upgrade' })).toBeInTheDocument();
        expect(screen.getByText('Press 1 / 2 / 3 or choose a row. Weapons clear enemies, relics change risk, and glyphs bind training pressure.')).toBeInTheDocument();
        expect(container.querySelector('.typerift-panel--upgrade')).toBeInTheDocument();
        expect(container.querySelectorAll('.typerift-upgrade-row')).toHaveLength(3);
        expect(container.querySelector('.typerift-upgrade-grid')).toBeNull();
        expect(container.querySelector('.typerift-upgrade-card')).toBeNull();

        expect(screen.getByText('Glass Orbit')).toBeInTheDocument();
        expect(screen.getByText('Lv.2')).toBeInTheDocument();
        expect(screen.getByText('Repeats weak characters under safer pressure.')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Mirror Glyph').closest('button'));

        expect(onChoose).toHaveBeenCalledWith('mirror-glyph');
    });
});
