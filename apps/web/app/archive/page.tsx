import type { Metadata } from 'next';
import { ArchiveScreen } from '../../src/features/archive/ArchiveScreen';

export const metadata: Metadata = { title: 'Archive' };
export default function ArchivePage() {
    return <ArchiveScreen />;
}
