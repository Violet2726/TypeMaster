/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import HelpOverlay from '../HelpOverlay';
import { getCopy } from '../../../../i18n';

describe('HelpOverlay', () => {
    test('renders controls as a compact sheet command list', () => {
        const onClose = vi.fn();
        const { baseElement } = render(
            <HelpOverlay
                copy={getCopy('en-US')}
                onClose={onClose}
            />
        );

        const dialog = screen.getByRole('dialog', { name: 'Controls' });
        expect(dialog).toHaveClass('typerift-overlay--sheet');
        expect(within(dialog).getByRole('heading', { name: 'Controls' })).toBeInTheDocument();
        expect(baseElement.querySelector('.typerift-sheet--help')).toBeInTheDocument();
        expect(baseElement.querySelector('.typerift-panel')).toBeNull();
        expect(baseElement.querySelector('.typerift-actions')).toBeNull();
        expect(baseElement.querySelectorAll('.typerift-help-command')).toHaveLength(4);
        expect(screen.getByText('Attack')).toBeInTheDocument();
        expect(screen.getByText('Space / button')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
