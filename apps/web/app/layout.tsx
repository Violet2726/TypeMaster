import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppFrame } from '../src/application/AppFrame';
import { AppProviders } from '../src/application/AppProviders';
import '../index.css';
import '../src/styles/animations.css';
import '../src/styles/toggle-switch.css';
import '../src/styles/typing-shell.css';
import '../src/styles/result-page.css';
import '../src/styles/insights-page.css';
import '../src/styles/home-action-card.css';
import '../src/styles/diagnostic-page.css';
import '../src/styles/settings-drawer.css';
import '../src/styles/confirm-dialog.css';

export const metadata: Metadata = {
    title: 'TypeMaster 2.0',
    description: 'TypeMaster 2.0 typing training workspace'
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="zh-CN">
            <body>
                <AppProviders>
                    <AppFrame>
                        {children}
                    </AppFrame>
                </AppProviders>
            </body>
        </html>
    );
}
