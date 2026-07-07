/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getCopy } from '../../../../i18n';
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
        summaryTitle: 'Workspace',
        preferencesTitle: 'Preferences',
        sessionTitle: 'Session behavior',
        dataTitle: 'Data maintenance',
        dataSummaryTitle: 'Local workspace data',
        dataSummaryBody: 'Export a backup or paste a bundle to restore this training state.',
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
    test('shows account sync controls and import/export area', async () => {
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

        expect(screen.getByText(/Account sync/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Workspace/i)).toBeInTheDocument();
        expect(screen.getByText(/Preferences/i)).toBeInTheDocument();
        expect(screen.getByText(/Session behavior/i)).toBeInTheDocument();
        expect(screen.getByText(/Local workspace data/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign in and sync/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export data/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Import data/i })).toBeInTheDocument();
    });

    test('localizes the drawer into Chinese and avoids repeating idle account badges', () => {
        const { container } = render(
            <SettingsDrawer
                isOpen
                settings={{
                    language: 'zh-CN',
                    theme: 'serika-dark',
                    fontScale: 'md',
                    focusMode: false,
                    soundEffects: false,
                    keyboardLayout: 'qwerty'
                }}
                copy={getCopy('zh-CN')}
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

        expect(screen.getByRole('dialog', { name: '设置' })).toBeInTheDocument();
        expect(screen.getByText('工作区总览')).toBeInTheDocument();
        expect(screen.getByText('偏好设置')).toBeInTheDocument();
        expect(screen.getByText('训练行为')).toBeInTheDocument();
        expect(screen.getByText('数据维护')).toBeInTheDocument();
        expect(screen.getByText('本地训练数据')).toBeInTheDocument();
        expect(container.querySelector('.settings-summary-card__head .panel-badge')).toBeNull();
        expect(container.querySelector('.settings-account__info .panel-badge')).toBeNull();
    });
});
