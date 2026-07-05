/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { getCopy } from '../../../../i18n';
import { TrendChart } from '../TrendChart';

const timeline = {
    samples: [
        { time: 0, wpm: 0, raw: 0, burst: 0, accuracy: 100, errors: 0 },
        { time: 9, wpm: 20, raw: 24, burst: 35, accuracy: 95, errors: 1 },
        { time: 18, wpm: 28, raw: 32, burst: 48, accuracy: 92, errors: 2 }
    ],
    pauseMoments: []
};

describe('TrendChart', () => {
    test('uses localized duration labels on the Chinese replay axis', () => {
        render(<TrendChart copy={getCopy('zh-CN')} language="zh-CN" timeline={timeline} />);

        expect(screen.getByText('0 秒')).toBeInTheDocument();
        expect(screen.getByText('9 秒')).toBeInTheDocument();
        expect(screen.getByText('18 秒')).toBeInTheDocument();
        expect(screen.queryByText('0s')).not.toBeInTheDocument();
    });
});
