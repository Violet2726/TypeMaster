/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
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

    test('keeps fixed Chinese replay copy localized', () => {
        render(<TrendChart copy={getCopy('zh-CN')} language="zh-CN" timeline={timeline} />);

        expect(screen.getByText('会话复盘')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: '输入、错误和节奏复盘' })).toBeInTheDocument();
        expect(screen.getByText('仅基于本轮训练期间捕获的逐秒样本。')).toBeInTheDocument();
        expect(screen.getByText('切换模式后，可以悬停、拖动或使用方向键逐秒查看本轮。')).toBeInTheDocument();
        expect(screen.getByText('原始速度')).toBeInTheDocument();
        expect(screen.getByText('爆发速度')).toBeInTheDocument();
        expect(screen.getByText('本轮平均')).toBeInTheDocument();
        expect(screen.getByText('平均原始速度')).toBeInTheDocument();
        expect(screen.getByText('峰值爆发')).toBeInTheDocument();
        expect(screen.getByText('已记录 3 个样本，出现 2 次错误波动。')).toBeInTheDocument();

        [
            'Session replay',
            'Input, error, and rhythm replay',
            'Built from per-second samples captured during this session only.',
            'Switch modes, then hover, drag, or use the arrow keys to inspect the round second by second.',
            'Raw speed',
            'Burst speed',
            'Round averages',
            'Average raw speed',
            'Peak burst',
            '3 samples captured, with 2 error spikes.'
        ].forEach((text) => {
            expect(screen.queryByText(text)).not.toBeInTheDocument();
        });
    });

    test('reveals localized inspection state when using keyboard replay navigation', () => {
        const { container } = render(<TrendChart copy={getCopy('zh-CN')} language="zh-CN" timeline={timeline} />);
        const hitArea = container.querySelector('.replay-hit-area');

        expect(hitArea).not.toBeNull();
        fireEvent.keyDown(hitArea, { key: 'ArrowRight' });

        expect(screen.getByText('选中秒数')).toBeInTheDocument();
        expect(container.querySelector('.replay-floating-inspect__state')).toHaveTextContent('错误波动');
    });
});
