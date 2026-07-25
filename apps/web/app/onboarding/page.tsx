import type { Metadata } from 'next';
import { OnboardingScreen } from '../../src/features/player/OnboardingScreen';

export const metadata: Metadata = { title: 'First calibration' };
export default function OnboardingPage() {
    return <OnboardingScreen />;
}
