import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'),
    title: { default: 'TypeMaster Studio — 打字练习', template: '%s · TypeMaster' },
    description: 'A calm space to practice touch typing with thoughtful passages and clear progress notes.',
    applicationName: 'TypeMaster Studio',
    manifest: '/manifest.webmanifest',
    openGraph: { title: 'TypeMaster Studio', description: 'Thoughtful passages for a more natural typing rhythm.', images: ['/studio/quiet-desk.png'] },
    icons: { icon: '/icon.svg' }
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    colorScheme: 'light dark',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
        { media: '(prefers-color-scheme: dark)', color: '#181a1d' }
    ]
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    );
}
