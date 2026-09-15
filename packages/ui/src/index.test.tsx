import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionRow, Button, GameDialog, IconButton, Notice, Progress, SegmentedControl, Sheet, StatList } from './index';

afterEach(() => cleanup());

describe('TypeRift UI primitives', () => {
    it('renders button variants and icon buttons', () => {
        render(
            <>
                <Button variant="primary">Launch</Button>
                <IconButton label="Open settings">*</IconButton>
            </>
        );
        expect(screen.getByRole('button', { name: 'Launch' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy();
    });

    it('supports segmented selection and progress values', () => {
        const onChange = vi.fn();
        render(
            <>
                <SegmentedControl
                    ariaLabel="Archive sections"
                    value="runs"
                    onChange={onChange}
                    options={[
                        { value: 'runs', label: 'Runs' },
                        { value: 'daily', label: 'Daily' }
                    ]}
                />
                <Progress value={40} max={80} label="Resonance" />
            </>
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Daily' }));
        expect(onChange).toHaveBeenCalledWith('daily');
        expect(screen.getByRole('progressbar', { name: 'Resonance' }).getAttribute('aria-valuenow')).toBe('40');
    });

    it('locks focus inside sheets and restores it on close', () => {
        const onClose = vi.fn();
        const view = render(
            <>
                <button>Outside</button>
                <Sheet open title="Settings" onClose={onClose}>
                    <button>First</button>
                    <button>Second</button>
                </Sheet>
            </>
        );
        expect(document.activeElement?.textContent).toBe('First');
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
        view.rerender(
            <>
                <button>Outside</button>
                <Sheet open={false} title="Settings" onClose={onClose}>
                    <button>First</button>
                </Sheet>
            </>
        );
    });

    it('keeps parent modal inertness when a child modal closes', () => {
        const view = render(
            <>
                <button>Outside</button>
                <GameDialog open title="Pause" dismissOnEscape={false}>
                    <button>Open settings</button>
                </GameDialog>
                <GameDialog open title="Settings">
                    <button>Close settings</button>
                </GameDialog>
            </>
        );
        let layers = Array.from(document.querySelectorAll<HTMLElement>('.game-dialog-layer'));
        expect(layers).toHaveLength(2);
        expect(layers[0]?.hasAttribute('inert')).toBe(true);
        expect(layers[1]?.hasAttribute('inert')).toBe(false);
        expect(view.container.hasAttribute('inert')).toBe(true);

        view.rerender(
            <>
                <button>Outside</button>
                <GameDialog open title="Pause" dismissOnEscape={false}>
                    <button>Open settings</button>
                </GameDialog>
            </>
        );
        layers = Array.from(document.querySelectorAll<HTMLElement>('.game-dialog-layer'));
        expect(layers).toHaveLength(1);
        expect(layers[0]?.hasAttribute('inert')).toBe(false);
        expect(view.container.hasAttribute('inert')).toBe(true);

        view.rerender(
            <>
                <button>Outside</button>
                <GameDialog open={false} title="Pause">
                    <button>Open settings</button>
                </GameDialog>
            </>
        );
        expect(screen.getByRole('button', { name: 'Outside' }).hasAttribute('inert')).toBe(false);
    });

    it('renders notice, stats and action rows without a generic card', () => {
        render(
            <>
                <Notice tone="warning" title="Offline">
                    Sync pending
                </Notice>
                <StatList items={[{ label: 'WPM', value: '72' }]} />
                <ActionRow eyebrow="Daily" title="Open today" detail="Resets at 00:00 UTC" href="/play?mode=daily-rift" />
            </>
        );
        expect(screen.getByText('Offline')).toBeTruthy();
        expect(screen.getByText('72')).toBeTruthy();
        expect(screen.getByText('Open today')).toBeTruthy();
    });
});
