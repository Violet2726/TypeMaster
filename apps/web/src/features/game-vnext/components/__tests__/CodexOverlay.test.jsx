/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import CodexOverlay from '../CodexOverlay';
import { getCopy } from '../../../../i18n';

const codex = {
    discovered: 3,
    total: 33,
    enemies: [
        { id: 'spark', name: 'Spark', discovered: true }
    ],
    bosses: [
        { id: 'archive-seraph', name: 'Archive Seraph', discovered: true, defeated: true }
    ],
    upgrades: [
        {
            id: 'glass-orbit',
            category: 'weapon',
            name: 'Glass Orbit',
            discovered: true
        }
    ]
};

describe('CodexOverlay', () => {
    test('renders discovered codex entries as grouped lists', () => {
        const onClose = vi.fn();
        const { container } = render(
            <CodexOverlay
                codex={codex}
                copy={getCopy('en-US')}
                onClose={onClose}
            />
        );

        expect(screen.getByRole('dialog', { name: 'TypeRift codex' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Echo Siege Codex' })).toBeInTheDocument();
        expect(container.querySelector('.typerift-panel--codex')).toBeInTheDocument();
        expect(container.querySelector('.typerift-run-summary--codex')).toBeInTheDocument();
        expect(container.querySelectorAll('.typerift-codex-section')).toHaveLength(3);
        expect(container.querySelector('.typerift-codex-grid')).toBeNull();
        expect(container.querySelector('.typerift-codex-entry')).toBeNull();

        expect(screen.getByText('3/33')).toBeInTheDocument();
        expect(screen.getAllByText('Enemies')).toHaveLength(2);
        expect(screen.getByText('Bosses')).toBeInTheDocument();
        expect(screen.getAllByText('Upgrades')).toHaveLength(2);
        expect(screen.getByText('Spark')).toBeInTheDocument();
        expect(screen.getByText('Archive Seraph')).toBeInTheDocument();
        expect(screen.getByText('Glass Orbit')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('keeps empty codex state grouped instead of showing cards', () => {
        const { container } = render(
            <CodexOverlay
                codex={{ discovered: 0, total: 33 }}
                copy={getCopy('en-US')}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('Awaiting first descent')).toBeInTheDocument();
        expect(screen.getByText('No enemies discovered')).toBeInTheDocument();
        expect(screen.getByText('No bosses defeated')).toBeInTheDocument();
        expect(screen.getByText('No upgrades logged')).toBeInTheDocument();
        expect(container.querySelectorAll('.typerift-codex-row--empty')).toHaveLength(3);
        expect(container.querySelector('.typerift-codex-grid')).toBeNull();
    });
});
