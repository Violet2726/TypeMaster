/** @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog.jsx';

describe('ConfirmDialog', () => {
    test('renders actions and dispatches handlers', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <ConfirmDialog
                isOpen
                title="Leave this practice?"
                body="This will discard the current round."
                confirmLabel="Leave anyway"
                cancelLabel="Stay"
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        expect(screen.getByRole('dialog', { name: 'Leave this practice?' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
        fireEvent.click(screen.getByRole('button', { name: 'Leave anyway' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
