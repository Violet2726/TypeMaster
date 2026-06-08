/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsDrawer } from '../SettingsDrawer';

const baseCopy = {
    settings: {
        kicker: 'Settings',
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        fontScale: 'Font size',
        focusMode: 'Focus mode',
        sound: 'Sound',
        soundComingSoon: 'unused',
        themeDark: 'Dark',
        themeLight: 'Light',
        fontSm: 'Compact',
        fontMd: 'Standard',
        fontLg: 'Spacious',
        focusOn: 'Enabled',
        focusOff: 'Disabled'
    },
    common: {
        close: 'Close',
        comingSoon: 'Coming soon'
    }
};

describe('SettingsDrawer', () => {
    test('shows cloud account controls and import/export area', async () => {
        const user = userEvent.setup();

        render(
            <SettingsDrawer
                isOpen
                settings={{
                    language: 'en-US',
                    theme: 'serika-dark',
                    fontScale: 'md',
                    focusMode: false,
                    soundEffects: false,
                    keyboardLayout: 'qwerty'
                }}
                copy={baseCopy}
                account={null}
                accountStatus="idle"
                onClose={() => {}}
                onChange={() => {}}
                onSignIn={() => Promise.resolve()}
                onSignOut={() => Promise.resolve()}
                onExportData={() => Promise.resolve('{}')}
                onImportData={() => Promise.resolve()}
            />
        );

        await user.type(screen.getByPlaceholderText(/Enter a display name/i), 'Alice');

        expect(screen.getByText(/Cloud account/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign in and sync/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export data/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Import data/i })).toBeInTheDocument();
    });
});
