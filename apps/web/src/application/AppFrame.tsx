'use client';

import { useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getInlineSeparator } from '../i18n';
import { Header } from '../features/shell/components/Header';
import { SettingsDrawer } from '../features/shell/components/SettingsDrawer';
import { useAppShellModel } from '../features/shell/use-app-shell-model';
import { useAppShellStore } from '../store/app-state-selectors';

type AppFrameProps = {
    children: ReactNode,
};

export function AppFrame({ children }: AppFrameProps) {
    const pathname = usePathname();
    const {
        settings,
        updateSettings,
        copy,
        account,
        accountStatus,
        trainingPlan,
        signInToAccount,
        signOutFromAccount,
        exportTrainingData,
        importTrainingData
    } = useAppShellStore();
    const {
        closeSettings,
        hasTrainingPlan,
        openSettings,
        settingsOpen,
        toggleTheme
    } = useAppShellModel({
        copy,
        exportTrainingData,
        importTrainingData,
        settings,
        trainingPlan,
        updateSettings
    });

    const isPracticeRoute = pathname === '/practice';
    const isFocusedLayout = settings.focusMode && isPracticeRoute;
    const footerText = useMemo(() => (
        isFocusedLayout
            ? copy.shell.footerFocus
            : `${copy.common.appName}${getInlineSeparator(settings.language)}${copy.shell.footerDefault}`
    ), [copy, isFocusedLayout, settings.language]);

    return (
        <div className={`app-shell ${isFocusedLayout ? 'is-focus-layout' : ''} ${settingsOpen ? 'is-settings-open' : ''}`}>
            <Header
                settings={settings}
                copy={copy}
                hasTrainingPlan={hasTrainingPlan}
                onToggleTheme={toggleTheme}
                onOpenSettings={openSettings}
            />

            <main className="app-main">
                <div className="container shell-container">
                    {children}
                </div>
            </main>

            <footer className="app-footer">
                <div className="container app-footer__inner">
                    <span>{footerText}</span>
                </div>
            </footer>

            <SettingsDrawer
                isOpen={settingsOpen}
                settings={settings}
                copy={copy}
                account={account}
                accountStatus={accountStatus}
                onClose={closeSettings}
                onChange={updateSettings}
                onSignIn={signInToAccount}
                onSignOut={signOutFromAccount}
                onExportData={exportTrainingData}
                onImportData={importTrainingData}
            />
        </div>
    );
}
