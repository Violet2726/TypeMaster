/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import PauseOverlay from '../PauseOverlay';
import { getCopy } from '../../../../i18n';

const stats = {
    areaName: 'Neon Archive',
    areaNameZh: '霓虹档案馆',
    combo: 12,
    extractAvailable: false,
    score: 4200
};

describe('PauseOverlay', () => {
    test('renders pause state as a compact summary with one primary action list', () => {
        const onAction = vi.fn();
        const { container } = render(
            <PauseOverlay
                stats={stats}
                copy={getCopy('en-US')}
                onAction={onAction}
            />
        );

        const dialog = screen.getByRole('dialog', { name: 'TypeRift paused' });
        expect(within(dialog).getByRole('heading', { name: 'TypeRift' })).toBeInTheDocument();
        expect(container.querySelector('.typerift-run-summary')).toBeInTheDocument();
        expect(container.querySelector('.typerift-stats')).toBeNull();
        expect(container.querySelectorAll('.typerift-action-row')).toHaveLength(4);
        expect(container.querySelectorAll('.typerift-action-row--primary')).toHaveLength(1);
        expect(screen.getByText('4,200')).toBeInTheDocument();
        expect(screen.getByText('霓虹档案馆')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Extract' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

        expect(onAction).toHaveBeenCalledWith('resume');
    });
});
