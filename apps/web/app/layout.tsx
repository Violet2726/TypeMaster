import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppFrame } from '../src/application/AppFrame';
import { AppProviders } from '../src/application/AppProviders';
import '../index.css';

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
