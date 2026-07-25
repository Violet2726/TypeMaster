import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '../src/components/AppShell';
import { Providers } from '../src/components/Providers';
import './styles.css';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'),
    title: { default: 'TypeRift — Turn rhythm into force', template: '%s — TypeRift' },
    description: 'A deterministic typing roguelite built around rhythm, clarity, and fair competition.',
    applicationName: 'TypeRift',
    manifest: '/manifest.webmanifest',
    openGraph: { title: 'TypeRift', description: 'Turn rhythm into force.', images: ['/og.png'] },
    icons: { icon: '/icon.svg' }
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    colorScheme: 'light dark',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f3f5f8' },
        { media: '(prefers-color-scheme: dark)', color: '#070a12' }
    ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <body>
                <Providers>
                    <AppShell>{children}</AppShell>
                </Providers>
            </body>
        </html>
    );
}
