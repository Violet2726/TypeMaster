import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppFrameWrapper } from '../src/application/AppFrameWrapper';
import { AppProviders } from '../src/application/AppProviders';
import '../index.css';
import '../src/styles/layout.css';
import '../src/styles/header.css';
import '../src/styles/buttons.css';
import '../src/styles/panels.css';
import '../src/styles/base-page.css';
import '../src/styles/typography.css';
import '../src/styles/design-system.css';
import '../src/styles/animations.css';
import '../src/styles/toggle-switch.css';
import '../src/styles/typing-experience.css';
import '../src/styles/result-page.css';
import '../src/styles/insights-page-full.css';
import '../src/styles/home-action-card.css';
import '../src/styles/overlays.css';
import '../src/styles/settings.css';
import '../src/styles/dialogs.css';
import '../src/styles/mobile.css';

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
                    <AppFrameWrapper>
                        {children}
                    </AppFrameWrapper>
                </AppProviders>
            </body>
        </html>
    );
}

