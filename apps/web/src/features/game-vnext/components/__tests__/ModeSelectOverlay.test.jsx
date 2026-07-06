/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import ModeSelectOverlay from '../ModeSelectOverlay';
import { getCopy } from '../../../../i18n';

describe('ModeSelectOverlay', () => {
    test('renders mode choices as a compact sheet list', () => {
        const onStart = vi.fn();
        const { container } = render(
            <ModeSelectOverlay
                bestScore={12840}
                codexProgress={{ discovered: 7, total: 33 }}
                copy={getCopy('en-US')}
                onStart={onStart}
            />
        );

        expect(screen.getByRole('dialog', { name: 'TypeRift mode select' })).toBeInTheDocument();
        expect(container.querySelectorAll('.typerift-mode-row')).toHaveLength(3);
        expect(container.querySelector('.typerift-mode-card')).toBeNull();
        expect(container.querySelector('.app-metric-card')).toBeNull();
        expect(screen.getByText('12,840')).toBeInTheDocument();
        expect(screen.getByText('7/33')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Expedition').closest('button'));

        expect(onStart).toHaveBeenCalledWith('expedition');
    });
});
