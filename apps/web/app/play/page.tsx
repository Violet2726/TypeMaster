import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RunScreen } from '../../src/features/run/RunScreen';

export const metadata: Metadata = { title: 'Run' };
export default function PlayPage() {
    return (
        <Suspense fallback={<div className="run-loading">Aligning the rift…</div>}>
            <RunScreen />
        </Suspense>
    );
}
