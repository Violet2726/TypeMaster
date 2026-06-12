/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../../../i18n';
import { setMockNavigation } from '../../../../test/next-navigation';
import { AppFrame } from '../../../../application/AppFrame';

const shellState = vi.hoisted(() => ({
    settingsOpen: true
}));

vi.mock('../../../../store/app-state-selectors', () => ({
    useAppShellStore: () => ({
        settings: {
            language: 'en-US',
            theme: 'serika-dark',
            fontScale: 'md',
            focusMode: false,
            soundEffects: true,
            keyboardLayout: 'qwerty'
        },
        updateSettings: vi.fn(),
        copy: getCopy('en-US'),
        account: null,
        accountStatus: 'idle',
        trainingPlan: null,
        signInToAccount: vi.fn(() => Promise.resolve()),
        signOutFromAccount: vi.fn(),
        exportTrainingData: vi.fn(() => '{}'),
        importTrainingData: vi.fn()
    })
}));

vi.mock('../../use-app-shell-model', () => ({
    useAppShellModel: () => ({
        closeSettings: vi.fn(),
        hasTrainingPlan: false,
        openSettings: vi.fn(),
        settingsOpen: shellState.settingsOpen,
        toggleTheme: vi.fn()
    })
}));

describe('AppFrame', () => {
    test('marks the shell while settings are open so mobile chrome can yield to the drawer', () => {
        shellState.settingsOpen = true;
        setMockNavigation({ pathname: '/' });

        const { container } = render(
            <AppFrame>
                <div>Workspace</div>
            </AppFrame>
        );

        expect(container.querySelector('.app-shell')).toHaveClass('is-settings-open');
        expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    });

    test('omits the settings-open class when the drawer is closed', () => {
        shellState.settingsOpen = false;
        setMockNavigation({ pathname: '/' });

        const { container } = render(
            <AppFrame>
                <div>Workspace</div>
            </AppFrame>
        );

        expect(container.querySelector('.app-shell')).not.toHaveClass('is-settings-open');
        expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
    });
});
