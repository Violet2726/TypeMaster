import type { Metadata } from 'next';
import { DebriefScreen } from '../../../src/features/archive/DebriefScreen';

export const metadata: Metadata = { title: 'Debrief' };
export default async function DebriefPage({ params }: { params: Promise<{ runId: string }> }) {
    return <DebriefScreen runId={(await params).runId} />;
}
