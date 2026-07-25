import type { Metadata } from 'next';
import { MissionsScreen } from '../../src/features/missions/MissionsScreen';

export const metadata: Metadata = { title: 'Missions' };
export default function MissionsPage() {
    return <MissionsScreen />;
}
