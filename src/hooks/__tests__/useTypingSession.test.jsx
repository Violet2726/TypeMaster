/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useTypingSession } from '../useTypingSession';

vi.mock('../../services/sound', () => ({
    playTypingSound: vi.fn()
}));

function HookHarness({ onComplete }) {
    const session = useTypingSession({
        draft: {
            id: 'draft-1',
            words: ['steady'],
            text: 'steady'
        },
        config: {
            source: 'builtin',
            mode: 'words',
            wordCount: 1,
            durationSeconds: 30
        },
        soundEffects: false,
        onComplete
    });

    return (
        <input
            ref={session.inputRef}
            value={session.currentInput}
            onChange={session.handleInputChange}
            onKeyDown={session.handleKeyDown}
            onFocus={session.handleFocus}
            onBlur={session.handleBlur}
            aria-label="typing-input"
        />
    );
}

describe('useTypingSession', () => {
    test('completes the final word only once when space is pressed immediately after it', async () => {
        const onComplete = vi.fn();
        const user = userEvent.setup();

        render(<HookHarness onComplete={onComplete} />);
        const input = screen.getByLabelText('typing-input');

        await user.click(input);
        await user.type(input, 'steady ');

        await waitFor(() => {
            expect(onComplete).toHaveBeenCalledTimes(1);
        });
    });
});
