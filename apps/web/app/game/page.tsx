'use client';

import dynamic from 'next/dynamic';

const GamePage = dynamic(() => import('../../src/screens/GamePage'), { ssr: false });

export default function GameRoute() {
    return <GamePage />;
}
