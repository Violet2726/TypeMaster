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

    test('renders Button with icon at end position', () => {
        render(<Button icon={TestIcon} iconPosition="end">Submit</Button>);
        expect(screen.getByRole('button', { name: 'Submit' })).toBeTruthy();
    });

    test('renders Button without icon', () => {
        render(<Button>No Icon</Button>);
        expect(screen.getByRole('button', { name: 'No Icon' })).toBeTruthy();
    });

    test('renders IconButton without icon', () => {
        render(<IconButton label="No Icon" />);
        expect(screen.getByRole('button', { name: 'No Icon' })).toBeTruthy();
    });

    test('renders MetricStrip without icons and with tone', () => {
        render(
            <MetricStrip
                ariaLabel="Metrics"
                items={[
                    { id: 'score', label: 'Score', value: '100', tone: 'accent' },
                    { id: 'level', label: 'Level', value: '5' }
                ]}
            />
        );
        expect(screen.getByText('100')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
    });

    test('renders Inspector without optional fields', () => {
        render(
            <Inspector title="Minimal">
                <span>Content</span>
            </Inspector>
        );
        expect(screen.getByText('Minimal')).toBeTruthy();
        expect(screen.getByText('Content')).toBeTruthy();
    });

    test('renders EmptyState without optional fields', () => {
        render(<EmptyState title="Empty" />);
        expect(screen.getByText('Empty')).toBeTruthy();
    });

    test('renders Surface with different tones', () => {
        render(
            <div>
                <Surface aria-label="Default">Default</Surface>
                <Surface tone="accent" aria-label="Accent">Accent</Surface>
            </div>
        );
        expect(screen.getByLabelText('Default')).toBeTruthy();
        expect(screen.getByLabelText('Accent')).toBeTruthy();
    });

    test('renders SegmentedControl with onChange handler', () => {
        const handleChange = vi.fn();
        render(
            <SegmentedControl
                ariaLabel="Mode"
                value="time"
                onChange={handleChange}
                items={[
                    { value: 'time', label: 'Time' },
                    { value: 'words', label: 'Words' }
                ]}
            />
        );
        screen.getByRole('tab', { name: 'Words' }).click();
        expect(handleChange).toHaveBeenCalledWith('words');
    });
});
