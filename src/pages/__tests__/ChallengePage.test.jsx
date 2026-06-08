/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import ChallengePage from '../ChallengePage';
import { renderWithProvider } from '../../test/render-with-provider';

describe('ChallengePage', () => {
    test('renders daily challenge controls and leaderboard section', async () => {
        renderWithProvider(<ChallengePage />, {
            localStorageState: {
                'typemaster:v2:settings': {
                    language: 'en-US',
                    lastConfig: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 30,
                        wordCount: 25,
                        includePunctuation: false,
                        includeNumbers: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'Daily challenge' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start challenge/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    });
});
