/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button, EmptyState, IconButton, Inspector, MetricStrip, SegmentedControl, Surface } from './Primitives.jsx';

function TestIcon(props) {
    return <svg aria-hidden="true" {...props} />;
}

describe('UI primitives', () => {
    test('renders accessible command controls and summary primitives', () => {
        render(
            <div>
                <Button icon={TestIcon}>Start</Button>
                <IconButton icon={TestIcon} label="Settings" />
                <Surface aria-label="Surface">Body</Surface>
                <MetricStrip
                    ariaLabel="Metrics"
                    items={[
                        { id: 'wpm', label: 'WPM', value: '72', icon: TestIcon }
                    ]}
                />
                <Inspector eyebrow="Mode" title="Practice" badge="Ready">
                    <span>Config</span>
                </Inspector>
                <EmptyState icon={TestIcon} title="No data" body="Start a session" />
                <SegmentedControl
                    ariaLabel="Mode"
                    value="time"
                    items={[
                        { value: 'time', label: 'Time' },
                        { value: 'words', label: 'Words' }
                    ]}
                />
            </div>
        );

        expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
        expect(screen.getByText('72')).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Time' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByText('No data')).toBeTruthy();
    });
});
